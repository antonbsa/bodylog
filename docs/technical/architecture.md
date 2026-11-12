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
- Show the weekly summary on Início and the measurement history on Histórico.
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

The tab screens share a full-height flex layout: a scrolling content area above a bottom tab bar that sits in the layout flow (not fixed), with a central button that opens `/registro` for today (`0033-use-bottom-navigation.md`, `docs/product/ui-direction.md`). Unauthenticated visits show the login screen without the bar, and unknown paths show the not-found screen. The registration route renders the existing measurement form until the registration sub-issue redoes it.

Deep links rely on Cloudflare Pages serving `index.html` for unknown paths, which Pages does only when the build has no top-level `404.html`; do not add one to `apps/web/public`.

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

- Frontend deployed to Cloudflare Pages.
- API deployed as a Worker.
- Clear separation between frontend and backend.
- Wrangler configuration is split by target:
  - `apps/api/wrangler.toml` for the Worker API.
  - `apps/web/wrangler.toml` for the Pages frontend.

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
