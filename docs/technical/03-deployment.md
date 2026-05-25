# Deployment

## Goal

Deploy the full V1 on Cloudflare, preferably within free plan limits, for personal usage.

Vercel compatibility is not a V1 requirement.

## Cloudflare Components

- Cloudflare Pages or Workers Static Assets for the frontend.
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
USER_HEIGHT_M
```

`USER_HEIGHT_M` can start as an environment variable or versioned constant, as long as it is not treated as a secret.

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

### Production

- Cloudflare deployment.
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
```

## Initial Deployment Strategy

Pending decision:

### Option A — Pages + Separate Worker

- Frontend on Cloudflare Pages.
- API on a separate Worker.
- More separation.

### Option B — Single Worker with Assets

- One Worker serves frontend and API.
- Fewer moving parts.
- May simplify deployment.

This decision should be made during final technical setup.

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
