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
migrations/ Cloudflare D1 migrations
```

The root package owns shared scripts for installation, typechecking, tests, D1 commands, and deployment entry points.

## Frontend

### Stack

- React
- Vite
- TypeScript
- PWA basics

### Responsibilities

- Render the authenticated app.
- Show the single-page weekly dashboard.
- Open the measurement form as a modal from the dashboard.
- List recent measurements on the dashboard.
- Call API endpoints.
- Handle CSV import/export UI.
- Keep the UX mobile-first.

### V1 UI Structure

V1 authenticated UI structure:

```txt
/login
/dashboard
```

The dashboard is the main authenticated screen and contains weekly summary, measurement history, and relevant actions as sections. The measurement form opens from the dashboard as a full-viewport mobile modal or a constrained desktop modal.

Separate authenticated pages for history, settings, import/export, or deeper dashboard analysis are deferred.

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
