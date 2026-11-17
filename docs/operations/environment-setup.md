# Environment Setup

What a BodyLog environment is made of on Cloudflare and how it is configured. The deploy itself is in [Deploying](deploying.md); secret values are in [Secrets](secrets.md).

## Cloudflare Components

- One Worker with Hono that serves the API under `/api/*` and the built web app through Workers Static Assets.
- One D1 database bound to that Worker as `DB`.
- Worker secrets for the app password and the session secret.

BodyLog is meant to run within the Cloudflare free plan for personal use, so the implementation avoids unnecessary queries, frequent full scans on large tables, repeated dashboard calls, polling and heavy processing inside the Worker.

## Environments

| Environment | Worker        | D1 database       | Where                                     |
| ----------- | ------------- | ----------------- | ----------------------------------------- |
| Local       | `bodylog-dev` | `bodylog-dev`     | `wrangler dev` on `http://localhost:8787` |
| Production  | `bodylog`     | `bodylog-prod`    | `https://bodylog.antonbsa.dev`            |
| Preview     | (planned)     | `bodylog-preview` | not deployed yet (#39)                    |

Locally, the Vite dev server on `http://localhost:5173` proxies `/api` requests to the Worker, so the browser still sees one origin. Running it is covered in [Run locally](../guides/run-locally.md).

## Wrangler Configuration

`apps/api/wrangler.toml` is the only Wrangler config:

- The top level is local dev only: worker `bodylog-dev`, non-secret vars, and the `bodylog-dev` D1 binding with a placeholder `database_id`, so an accidental `--remote` without `--env production` cannot reach production data. Local API development loads the root `.env.development` file through `--env-file`.
- `[env.production]` re-declares everything production needs, because named environments do not inherit vars or bindings: worker `bodylog`, vars, observability, the `bodylog-prod` D1 database and `[env.production.assets]`.
- Assets stay out of the top level because `wrangler dev` fails when `apps/web/dist` is missing.

`[env.production.assets]` uses `not_found_handling = "single-page-application"` so client routes such as `/historico` get `index.html`, and `run_worker_first = ["/api/*"]` so every API request, including unknown ones, reaches the Worker and gets a JSON response. `apps/web/public/_headers` is copied into `dist/` and applied by Workers Static Assets, which keeps `Cache-Control: no-cache` on `/` and `/index.html`.

The web app and the API share one origin, so the session cookie is first-party: `HttpOnly`, `SameSite=Lax` and `Secure` (except on `localhost`). There is no CORS handling and no API base URL.

## Non-Secret Variables

Set in `apps/api/wrangler.toml`, at the top level and again under `[env.production]`:

```txt
USER_HEIGHT_CM=168
USER_TIME_ZONE=America/Sao_Paulo
```

- `USER_HEIGHT_CM` is the single user's height in centimeters for BMI; the API converts it to meters before applying the formula (`0025-use-user-height-environment-variable.md`).
- `USER_TIME_ZONE` is the single user's IANA time zone for dashboard date and week boundaries (`0027-use-user-time-zone-environment-variable.md`).

Neither is a secret, so neither goes through `wrangler secret put`.

## GitHub Repository Secrets

The deploy workflow needs two repository secrets and no variables:

```txt
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

The token must be able to deploy Workers scripts on the account.
