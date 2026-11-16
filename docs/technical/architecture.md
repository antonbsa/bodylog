# Architecture

## Overview

The V1 architecture is a small Cloudflare-based web application.

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
  e2e/      Playwright E2E tests
infra/
  migrations/ Cloudflare D1 migrations
  scripts/    local infrastructure tooling
  errors/     shared structured error definitions
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
/tendencias        Tendências (tab, placeholder until the redesign sub-issue lands)
/ajustes           Ajustes (tab; CSV export/import and logout for now)
/registro?data=YYYY-MM-DD   registration, outside the tab layout, no bar
```

The tab screens share a full-height flex layout: a scrolling content area above a bottom tab bar that sits in the layout flow (not fixed), with a central button that opens `/registro` for today (`0033-use-bottom-navigation.md`, `docs/product/ui-direction.md`). Unauthenticated visits show the login screen without the bar, and unknown paths show the not-found screen. The registration route is a full-screen form outside the tab layout: a sticky header with the date bar, a form that scrolls with the document (so iOS scrolls focused fields natively) and a fixed footer that is hidden while the iOS keyboard is open (detected from the visual viewport height). Numeric fields use a right-to-left digit mask, and validation limits, notes normalization and derived values come from `domain/measurement.ts` at the repo root, so the web form and the API share them. Tab switches and opening or closing `/registro` replace the history entry (decided in `apps/web/src/hooks/useTabNavigate.ts`) because the iOS edge swipe follows history; Cancelar returns to the origin path kept in location state. Server data goes through TanStack Query (one client in `main.tsx`, keys in `apps/web/src/api/queryKeys.ts`), so screens show cached data while refetching and Registro prefetches the adjacent days; see `docs/technical/decisions/0037-use-tanstack-query-for-server-state.md`.

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
  config.ts             env-derived settings (password, session secret, height, time zone)
  types.ts              API-only bindings and input types
  features/<name>/      routes.ts plus that feature's services (auth, measurements, dashboard, history, trends, csv)
  db/repositories/      D1 access, one file per table
  http/                 cross-feature HTTP helpers (request validation, session guard)
  domain/               API domain objects (Measurement, week range, week summary)
```

`app.ts` mounts `/api/auth/*` and `/api/health` as public routes. Every other feature router is mounted under its own `/api/<prefix>` on a protected router whose `requireSession` guard covers that prefix, so a new data router gets the guard by being added to that mount list, and unknown `/api/*` paths still answer 404 rather than 401.

## Database

### V1 Database

- Cloudflare D1

### Future V2 Database

- Serverless Postgres

The V1 must avoid spreading database-specific logic across handlers. SQL and persistence details should be isolated behind repositories.

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

V1 uses simple single-user authentication.

- The password is stored as a Cloudflare secret/environment variable.
- The backend validates login requests.
- A secure session cookie should be used.
- All data routes require authentication.

This is acceptable for personal V1 usage but not a scalable authentication model.

## Deployment

The full V1 deploy target is Cloudflare.

- One Worker serves the API under `/api/*` and the built web app through Workers Static Assets, on one origin (`0040-serve-the-web-app-from-the-api-worker.md`).
- `apps/api/wrangler.toml` is the only Wrangler config; production is `[env.production]`.

## Non-Goals

The architecture does not need to support:

- Vercel deployment;
- multi-user scale;
- complex authorization;
- offline-first behavior;
- native mobile deployment;
- desktop-optimized dashboards;
- separate authenticated history/settings pages for V1;
- advanced analytics pipelines.

## Key Risks

### D1 to Postgres Migration

D1 is suitable for V1 on Cloudflare, but V2 plans a migration to serverless Postgres.

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

### Authentication Simplicity

Simple password auth is enough for personal V1 usage but should not be treated as production-grade multi-user security.
