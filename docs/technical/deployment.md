# Deployment

## Goal

Deploy the full V1 on Cloudflare, preferably within free plan limits, for personal usage.

Vercel compatibility is not a V1 requirement.

## Cloudflare Components

- One Cloudflare Worker with Hono that serves the API under `/api/*` and the built web app through Workers Static Assets.
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
```

`USER_HEIGHT_CM` configures the single user's height in centimeters for BMI calculations. The API converts this value to meters before applying the BMI formula. Height is not a secret and should be configured as a Worker variable, not as a Cloudflare secret.

`USER_TIME_ZONE` configures the single user's IANA time zone for dashboard date and week boundaries. It is not a secret and should be configured as a Worker variable.

The production Worker serves the web app and the API from one origin, `https://bodylog.antonbsa.dev`, so the session cookie is first-party: `HttpOnly`, `SameSite=Lax` and `Secure` (except on `localhost`). There is no CORS handling and no API base URL (`0040-serve-the-web-app-from-the-api-worker.md`).

## D1

### Database

Names: `bodylog-dev` (local), `bodylog-preview` (future, issue #39) and `bodylog-prod` (production).

### Migrations

Migrations should be versioned in the repository under `infra/migrations/`.

Example:

```txt
infra/migrations/
  0001_create_measurements.sql
```

## Environments

### Local

- Frontend running through Vite.
- Hono API running through Wrangler local/dev.
- Local D1 database (its own state, keyed by the placeholder `database_id` at the top level of `apps/api/wrangler.toml`).
- Non-production defaults loaded from the committed `.env.development` file through Wrangler's `--env-file` flag.
- `npm run dev` starts the API on `http://localhost:8787` and the frontend on `http://localhost:5173`.

Local development uses separate processes:

```txt
Vite frontend dev server from apps/web
Wrangler API dev server from apps/api
```

The frontend calls relative `/api/...` URLs. In local development Vite proxies `/api` requests to the local Worker, so the browser still sees one origin.

### Production

- Worker `bodylog` (`[env.production]`) serving `apps/web/dist` and the API at `https://bodylog.antonbsa.dev`.
- Secrets configured with `npx wrangler secret put <NAME> --env production` from `apps/api`.
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

No deployment variables are needed.

The deploy workflow runs after CI passes and runs `npm run deploy`, which builds the web app and deploys the Worker with `wrangler deploy --env production`, uploading `apps/web/dist` as its static assets.

## Wrangler Configuration

`apps/api/wrangler.toml` is the only Wrangler config:

- The top level is local dev only: worker `bodylog-dev`, non-secret vars, and the `bodylog-dev` D1 binding with a placeholder `database_id`, so an accidental `--remote` without `--env production` cannot reach production data. Local API development loads the root `.env.development` file through `--env-file`.
- `[env.production]` re-declares everything production needs, because named environments do not inherit vars or bindings: worker `bodylog`, vars, observability, the `bodylog-prod` D1 database and `[env.production.assets]`.
- Assets stay out of the top level because `wrangler dev` fails when `apps/web/dist` is missing.

`[env.production.assets]` uses `not_found_handling = "single-page-application"` so client routes such as `/historico` get `index.html`, and `run_worker_first = ["/api/*"]` so every API request, including unknown ones, reaches the Worker and gets a JSON response. `apps/web/public/_headers` is copied into `dist/` and applied by Workers Static Assets, which keeps `Cache-Control: no-cache` on `/` and `/index.html`.

Remote D1 scripts (`db:migrate:remote`, `db:query:remote`) pass `--env production`. Check the config without deploying with `npm run build`, then `npx wrangler deploy --dry-run --env production` from `apps/api`: it lists the static assets and the `DB` binding.

## Deployment Strategy

Selected strategy: one Worker serving the web app and the API (`0040-serve-the-web-app-from-the-api-worker.md`).

- The React/Vite build in `apps/web/dist` is served as Workers Static Assets.
- The Hono API in `apps/api` owns authentication, data routes, D1 access, CSV import/export and dashboard endpoints under `/api/*`.
- D1 is bound only to the Worker.
- One origin means no CORS, no API base URL, one deploy step and one custom domain.

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
