# Architecture Overview

How BodyLog works end to end and why. What it does for the user is in [Product](../product.md); the HTTP surface, the tables and the measurement rules are in [API contract](../reference/api-contract.md), [Database](../reference/database.md) and [Measurements](../reference/measurements.md); the reasoning behind each choice is in the [decisions](../decisions/README.md).

## In Short

BodyLog is a small Cloudflare-based web application.

```txt
React/Vite PWA
      ↓
Hono API on Cloudflare Workers
      ↓
Cloudflare D1
```

The application is designed for one user, mobile-first usage, and simple weekly analysis of body metrics.

## Repository Structure

The repository uses npm workspaces.

```txt
apps/
  api/      Hono Worker API
  web/      React/Vite frontend
tests/
  api/      API and backend behavior tests
  web/      web unit tests
  e2e/      Playwright E2E tests
infra/
  migrations/ Cloudflare D1 migrations
  scripts/    local infrastructure and docs tooling
  errors.ts   shared structured error definitions
types/      shared API/web TypeScript shapes
domain/     shared pure measurement rules (limits, notes, derived values)
```

The root package owns shared scripts for installation, typechecking, tests, D1 commands, and deployment entry points.

## Frontend

### Stack

- React
- Vite
- TypeScript
- react-router (declarative mode)
- Phosphor icons
- Radix Themes for behavior and not-yet-redone components (`0026-use-radix-ui-components.md`)
- PWA basics

### Responsibilities

- Render the authenticated app.
- Route between the Início, Histórico, Tendências and Ajustes screens behind a bottom tab bar, plus a registration route without the bar.
- Show the weekly summary on Início and the measurement history on Histórico as weekly cards, paged by week (`GET /api/history/weeks`).
- Apply the light, dark or system theme before first paint, from the preference stored in the browser.
- Call API endpoints.
- Handle CSV import/export UI.
- Keep the UX mobile-first.

### UI Structure

Routes, handled client-side by `react-router`:

```txt
/                  Início (tab)
/historico         Histórico (tab)
/tendencias        Tendências (tab)
/ajustes           Ajustes (tab; theme, CSV export/import, logout)
/registro?data=YYYY-MM-DD   registration, outside the tab layout, no bar
```

The tab screens share a full-height flex layout: a scrolling content area above a bottom tab bar that sits in the layout flow (not fixed), with a central button that opens `/registro` for today (`0033-use-bottom-navigation.md`, [UI direction](../product/ui-direction.md)). Unauthenticated visits show the login screen without the bar, and unknown paths show the not-found screen. The registration route is a full-screen form outside the tab layout: a sticky header with the date bar, a form that scrolls with the document (so iOS scrolls focused fields natively) and a fixed footer that is hidden while the iOS keyboard is open (detected from the visual viewport height). Numeric fields use a right-to-left digit mask, and validation limits, notes normalization and derived values come from `domain/measurement.ts` at the repo root, so the web form and the API share them. Tab switches and opening or closing `/registro` replace the history entry (decided in `apps/web/src/hooks/useTabNavigate.ts`) because the iOS edge swipe follows history; Cancelar returns to the origin path kept in location state. Server data goes through TanStack Query (one client in `main.tsx`, keys in `apps/web/src/api/queryKeys.ts`), so screens show cached data while refetching and Registro prefetches the adjacent days; see `0037-use-tanstack-query-for-server-state.md`.

Deep links rely on the Worker's static assets serving `index.html` for unknown non-API paths (`not_found_handling = "single-page-application"` in `apps/api/wrangler.toml`).

Colors are CSS custom properties in `apps/web/src/styles/tokens.css`. The theme preference (`system`, `light` or `dark`) is stored in `localStorage` and applied as `data-theme` on `<html>` by an inline script in `apps/web/index.html`, with `apps/web/src/theme.ts` as the module that reads and writes it. `system` leaves `data-theme` unset so the `prefers-color-scheme` media query decides. Geist and Geist Mono are self-hosted from `apps/web/public/fonts`.

## Backend

### Stack

- Hono
- TypeScript
- Cloudflare Workers

### Responsibilities

- Authentication endpoints.
- Measurement CRUD endpoints.
- Weekly dashboard endpoint.
- CSV import/export endpoints.
- Validation.
- Derived metric calculations.
- Data access through repository/service layers.

### Source Layout

```txt
apps/api/src/
  index.ts              wrangler main; re-exports the app
  app.ts                builds the Hono app: error and 404 handlers, health route, router mounts
  config.ts             env-derived settings (GitHub and Google OAuth clients, dev login flag)
  types.ts              API-only bindings and input types
  features/<name>/      routes.ts plus that feature's services (auth, me, measurements, dashboard, history, trends, csv, api-tokens)
  db/repositories/      D1 access, one file per table
  http/                 cross-feature HTTP helpers (request validation, session guard, the user's height and zone, secret generation and hashing)
  domain/               API domain objects (Measurement, week range, week summary)
```

`app.ts` mounts `/api/auth/*` and `/api/health` as public routes. Every other feature router is mounted under its own `/api/<prefix>` on a protected router whose `requireSession` guard covers that prefix and sets `c.var.userId`, so a new data router gets the guard by being added to that mount list, and unknown `/api/*` paths still answer 404 rather than 401.

## Database

Cloudflare D1 today, with a planned later migration to serverless Postgres. The app avoids spreading database-specific logic across handlers. SQL and persistence details should be isolated behind repositories.

## Suggested Layers

```txt
api routes
  ↓
use cases / services
  ↓
repositories
  ↓
D1
```

### Routes

Handle HTTP concerns:

- request parsing;
- response formatting;
- auth guard;
- status codes.

### Services / Use Cases

Handle product behavior:

- create or update measurement by date;
- calculate weekly summaries;
- import CSV;
- export CSV.

### Repositories

Handle persistence:

- SQL queries;
- D1 bindings;
- database row mapping.

## Authentication

Accounts sign in with GitHub or Google OAuth; the full decision is `0044-multi-user-accounts-with-oauth-sign-in.md`.

- `features/auth/oauth-flow.ts` runs the authorization code flow with PKCE through `oauth4webapi` for each provider. `GET /api/auth/<provider>` keeps `state` and `code_verifier` in a short-lived cookie scoped to that path and redirects to the provider; the callback validates them, exchanges the code, reads the profile, and creates or refreshes the user and its identity in `users` and `user_identities`. `github.ts` reads the profile from `/user` and `/user/emails`, `google.ts` from the ID token.
- `UserRepository.upsertFromProfile` links a new identity to the user that already has an identity with the same verified email, and otherwise creates a user.
- The callback sets the session cookie on a 200 page that redirects to `/` client-side, because WebKit drops a `Set-Cookie` on a redirect that ends a cross-site chain. Failures redirect to `/?error=<code>` without a session.
- `features/auth/session.ts` keeps sessions in D1: the `bodylog_session` cookie holds a random id, `sessions` stores its SHA-256, and `requireSession` resolves it to the user id, renewing it in its last week and deleting it once expired. Each new sign-in sweeps expired rows.
- Every measurement query goes through `MeasurementRepository`, which is built for one user id and filters each statement by it.
- `POST /api/auth/dev-login` signs in as a local seed user only when `DEV_LOGIN_ENABLED="true"` (set only in `.env.development`).

## Deployment

The whole app deploys to Cloudflare.

- One Worker serves the API under `/api/*` and the built web app through Workers Static Assets, on one origin (`0040-serve-the-web-app-from-the-api-worker.md`).
- `apps/api/wrangler.toml` is the only Wrangler config; the deployed environments are `[env.preview]` (every merge to `main`) and `[env.production]` (each published release, `0041-release-gated-production-deploys-with-a-preview-environment.md`). The runbook is [Deploying](../operations/deploying.md).

## Non-Goals

The architecture does not need to support:

- Vercel deployment;
- data sharing between accounts;
- roles or admin authorization;
- offline-first behavior;
- native mobile deployment;
- desktop-optimized dashboards;
- advanced analytics pipelines.

## Key Risks

### D1 to Postgres Migration

D1 suits the app on Cloudflare, but a migration to serverless Postgres is planned.

Mitigation:

- isolate data access;
- keep domain types independent from D1-specific types;
- version migrations;
- avoid D1-specific behavior outside repositories.

### CSV Import Compatibility

The current spreadsheet export format may not match the canonical CSV format.

Mitigation:

- start with a canonical CSV format;
- validate rows clearly;
- add mapping only after seeing real CSV exports.

### Sign-up Abuse

Sign-up is open to any GitHub or Google account, with no rate limit. Every account starts empty and sees only its own rows, so abuse costs storage, not privacy.

## Cross-Cutting Concerns

Standing guidance for implementation, reviews and future ADRs; a concrete decision made from one of these becomes an ADR under [decisions](../decisions/README.md).

### Dependency Boundaries

BodyLog intentionally uses React, Vite, Hono, Cloudflare Workers, and Cloudflare D1.

The project should not abstract every selected tool just to remain theoretically portable. The priority is delivery with a small, understandable implementation.

However, product and domain behavior should not be tightly coupled to infrastructure details when a future migration is already plausible.

Guidelines:

- Keep HTTP concerns in routes and middleware.
- Keep product behavior in services or use cases.
- Keep SQL, D1 bindings, and row mapping inside repositories.
- Keep domain types independent from D1-specific types.
- Isolate authentication/session mechanics behind small helpers instead of spreading cookie and secret handling across routes.
- Introduce provider-style abstractions only when there is a concrete boundary to protect, such as persistence, sessions, or deployment-specific integrations.

### Security and Privacy

BodyLog stores personal body metrics for several accounts, so every data path is scoped to the signed-in user.

Guidelines:

- Store OAuth client secrets and deployment credentials only in environment variables or Cloudflare secrets.
- Protect all data routes with authentication.
- Use secure session handling appropriate for Cloudflare Workers.
- Avoid logging OAuth codes or tokens, session ids, CSV contents, or measurement values.
- Treat CSV import/export as sensitive data movement.
- Do not commit real personal data, exported CSV backups, secrets, or production database files.
- Avoid health interpretation, diagnosis, recommendations, or motivational value judgments.
- Scope every new query on user data to the session's user, and cover it in `tests/api/user-isolation.test.ts`.

### Data Correctness

The app replaces a spreadsheet workflow, so trust depends on correct calculations and predictable data handling.

Guidelines:

- Store at most one measurement per date.
- Treat `YYYY-MM-DD` dates consistently across API, database, and CSV.
- Display and accept dates in the UI as `DD/MM/YYYY` for `pt-BR`.
- Keep week calculations aligned with Monday-start weeks.
- Compare partial current week against the previous full week.
- Display percentage metric changes in percentage points.
- Treat a weekly change as stable when it rounds to zero at the displayed precision, decided in the UI.
- Ignore missing optional values when calculating averages for that metric.
- Keep derived calculations covered by focused automated tests.
- Document assumptions when date, rounding, tolerance, or import behavior is ambiguous but not blocking.

### Data Ownership and Recovery

The user should be able to keep and move their data without depending on the application forever.

Guidelines:

- Preserve CSV export as the primary backup path.
- Keep the documented CSV format stable unless a migration note is added.
- Validate CSV import clearly and avoid silent data loss.
- Upsert imported records by date.
- Version database migrations.
- Keep future D1-to-Postgres migration awareness in repository and migration design.

### Scope Discipline

BodyLog is a personal body metrics tracker, not a generic fitness platform.

Guidelines:

- Prefer small, explicit implementation over broad frameworks or speculative architecture.
- Do not add multi-user support, account registration, OAuth, charts outside the Tendências screen (`0030-allow-charts-in-trends.md`), offline-first behavior, Google Sheets integration, recommendations, or health interpretation unless scope changes explicitly.
- Do not add user-configurable goals; variations use one neutral color for every metric (`0031-use-neutral-variation-color.md`).
- Keep future ideas in [future ideas](../product/future-ideas.md), not in executable work.
- Let automated tests scale with the risk of the behavior being implemented.

### Mobile Usability

The primary usage context is fast daily logging from a smartphone.

Guidelines:

- Keep forms short and easy to complete.
- Make weight the only required body metric.
- Load an existing record when its date is selected.
- Make missing optional values clear without blocking the workflow.
- Favor readable cards and tables; charts are limited to the Tendências screen (`0030-allow-charts-in-trends.md`).
- Use separate screens behind a bottom tab bar as the authenticated app surface (`0033-use-bottom-navigation.md`).
- Open measurement creation/editing in a full-screen registration route.
- Validate mobile usability before considering desktop-specific polish.

### Operational Safety

The app should remain easy to deploy and maintain as a personal project.

Guidelines:

- Keep deployment Cloudflare-only.
- Run automated checks before deployment.
- Document required secrets without committing their values.
- Keep deployment and environment assumptions current in technical docs.
- Avoid operational complexity that does not directly support delivery.
