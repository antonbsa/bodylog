# Deployment

## Goal

Deploy the full V1 on Cloudflare, preferably within free plan limits, for personal usage.

Vercel compatibility is not a V1 requirement.

## Cloudflare Components

- Cloudflare Pages for the frontend.
- Cloudflare Worker with Hono for the API.
- Cloudflare D1 for the database.
- Cloudflare Secrets for the app password and session secret.

## Relevant Limits

For personal usage, V1 should operate comfortably within expected free-tier limits.

Even so, the implementation should avoid:

- unnecessary queries;
- frequent full scans on large tables;
- repeated dashboard calls;
- polling;
- heavy processing inside the Worker.

## Variables and Secrets

### Secrets

```txt
APP_PASSWORD
SESSION_SECRET
```

### Configuration

```txt
USER_HEIGHT_CM=168
USER_TIME_ZONE=America/Sao_Paulo
PRODUCTION_FRONTEND_ORIGIN=https://bodylog.antonbsa.dev
VITE_API_BASE_URL=https://api.bodylog.antonbsa.dev
```

`USER_HEIGHT_CM` configures the single user's height in centimeters for BMI calculations. The API converts this value to meters before applying the BMI formula. Height is not a secret and should be configured as a Worker variable, not as a Cloudflare secret.

`USER_TIME_ZONE` configures the single user's IANA time zone for dashboard date and week boundaries. It is not a secret and should be configured as a Worker variable.

`PRODUCTION_FRONTEND_ORIGIN` configures the exact production frontend origin allowed by API CORS. It is not a secret. Deployment automation passes it to `wrangler deploy` from the GitHub `PRODUCTION_FRONTEND_ORIGIN` variable.

`VITE_API_BASE_URL` configures the frontend API origin. It is not a secret because Vite exposes `VITE_*` values to the browser.

The production frontend and API should use same-site custom domains for reliable installed-PWA session persistence on iOS:

```txt
Frontend: https://bodylog.antonbsa.dev
API:      https://api.bodylog.antonbsa.dev
```

The API remains a separate Worker, but requests from the frontend to the API are same-site under this domain layout. That allows the session cookie to use `Secure` + `SameSite=Lax` in production. The default Cloudflare domains, such as `pages.dev` for the frontend and `workers.dev` for the API, are cross-site and can lose session cookies in iOS standalone web apps.

## D1

### Database

Suggested name:

```txt
body_metrics_tracker
```

### Migrations

Migrations should be versioned in the repository.

Example:

```txt
migrations/
  0001_create_measurements.sql
```

## Environments

### Local

- Frontend running through Vite.
- Hono API running through Wrangler local/dev.
- Local or preview D1 database.
- Non-production defaults loaded from the committed `.env.development` file through Wrangler's `--env-file` flag.
- `npm run dev` starts the API on `http://localhost:8787` and the frontend on `http://localhost:5173`.

Local development uses separate processes:

```txt
Vite frontend dev server from apps/web
Wrangler API dev server from apps/api
```

The frontend should call the API through an environment-configured base URL.
In local development, `VITE_API_BASE_URL` is empty and Vite proxies `/api` requests to the local Worker.

### Production

- Frontend deployed to Cloudflare Pages.
- API deployed to a separate Cloudflare Worker.
- Secrets configured through Wrangler or the Cloudflare dashboard.
- Remote D1 database.

## Automation

V1 should include workflow automation before final delivery.

### CI Checks

CI should run on:

- pull requests targeting `main`;
- direct pushes to `main`.

CI should install dependencies reproducibly and run the relevant checks, including typecheck, unit/API tests, and E2E tests once E2E tooling exists.

### Deployment

Deployment automation should be added after the deployment strategy is chosen.

The deployment workflow should:

- run on direct pushes to `main`;
- run automated checks before deploying;
- deploy to the selected Cloudflare target;
- use repository or environment secrets for Cloudflare credentials;
- avoid committing or exposing secrets.

Expected deployment secret:

```txt
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Expected deployment variables:

```txt
CLOUDFLARE_PAGES_PROJECT_NAME
PRODUCTION_FRONTEND_ORIGIN
VITE_API_BASE_URL
```

`PRODUCTION_FRONTEND_ORIGIN` should be the production frontend origin, such as `https://bodylog.antonbsa.dev`, without a trailing path. `VITE_API_BASE_URL` should be the Worker API origin, such as `https://api.bodylog.antonbsa.dev`.

The deploy workflow runs the project checks first, builds the frontend with `VITE_API_BASE_URL`, deploys the Worker with `PRODUCTION_FRONTEND_ORIGIN`, and then deploys `apps/web/dist` to Cloudflare Pages.

## Wrangler Configuration

Wrangler configuration is split by deployment target:

```txt
apps/api/wrangler.toml
apps/web/wrangler.toml
```

The API config owns the Worker entry point, non-secret Worker variables, observability, and the D1 binding. Local API development uses this config with the root `.env.development` file loaded explicitly through `--env-file`, avoiding a named Wrangler environment solely for local secrets.

The web config owns stable Cloudflare Pages settings such as the Pages build output directory. The Pages project name remains an external deployment variable so local and CI deploys can target the configured Cloudflare project without committing account-specific identifiers.

## Deployment Strategy

Selected strategy: Cloudflare Pages + separate Worker.

### Frontend

- React/Vite frontend deployed to Cloudflare Pages.
- Frontend build is static assets generated by Vite.
- Frontend and API are developed as separate local processes.
- Frontend package lives under `apps/web`.

### API

- Hono API deployed as a separate Cloudflare Worker.
- API owns authentication, data routes, D1 access, CSV import/export, and dashboard endpoints.
- D1 remains bound only to the Worker.
- API package lives under `apps/api`.

### Reason

This keeps the React/Vite app and backend API independently understandable, testable, and deployable while still staying fully inside Cloudflare for V1.

### Tradeoffs

- Requires CORS and cookie/session configuration across the Pages and Worker origins.
- Requires two deployment targets instead of one.
- Requires frontend environment configuration for the API base URL.

These tradeoffs are acceptable for V1 because the project benefits from a clear separation between frontend and API.

## Risks

### Risk 1 — Historical CSV from the Spreadsheet

The real spreadsheet format may not match the expected headers.

Mitigation:

- Implement import using a canonical format first.
- Add minimal mapping if needed.
- Adjust after testing with the real CSV.

### Risk 2 — Simple Authentication

A single password is acceptable for personal V1 usage, but it is not a scalable authentication model.

Mitigation:

- Protect all data routes.
- Use secure cookies.
- Do not expose the password in the frontend.
- Keep secrets out of the repository.

### Risk 3 — Future Migration to Serverless Postgres

V2 is expected to migrate from D1 to serverless Postgres.

V1 mitigation:

- Isolate data access in a repository layer.
- Avoid SQL spread across the application.
- Keep migrations versioned.
- Avoid excessive dependency on D1-specific details outside persistence.
