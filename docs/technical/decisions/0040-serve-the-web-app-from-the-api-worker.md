# 0040 — Serve the Web App from the API Worker

## Status

Accepted

Supersedes [0019 — Use Cloudflare Pages and Separate Worker](./0019-use-cloudflare-pages-and-separate-worker.md) and [0028 — Use Same-Site Custom Domains for PWA Session](./0028-use-same-site-custom-domains-for-pwa-session.md).

## Context

Production ran two Cloudflare targets: the Pages project `bodylog` at `bodylog.antonbsa.dev` and the Worker `bodylog-api` at `api.bodylog.antonbsa.dev`. The split needed CORS, a `PRODUCTION_FRONTEND_ORIGIN` variable, a build-time `VITE_API_BASE_URL`, session cookie `SameSite` negotiation by host, two deploy steps and two custom domains. `antonbsa/twitch-radar` serves its built web app from its API Worker through Workers Static Assets, so the web app and the API share one origin.

## Decision

One Worker, `bodylog`, serves both the built web app and the API at `https://bodylog.antonbsa.dev`:

- `apps/api/wrangler.toml` `[env.production.assets]` points at `../web/dist` with `not_found_handling = "single-page-application"` and `run_worker_first = ["/api/*"]`: every `/api/*` request reaches Hono (unknown routes get the API's JSON 404), and every other path is a static file or `index.html`.
- The top level of `wrangler.toml` is local dev only (worker `bodylog-dev`, placeholder D1 `database_id`, no assets because `wrangler dev` fails when `dist/` is missing). Production is always addressed with `--env production`.
- The web app calls relative `/api/...` URLs; there is no CORS handling and no API base URL.
- The session cookie is `HttpOnly; SameSite=Lax; Path=/`, and `Secure` except on `localhost`/`127.0.0.1`.
- The liveness route moves from `GET /` to `GET /api/health`, since `/` now serves the app.
- `npm run deploy` builds the web app and runs one `wrangler deploy --env production`.

## Consequences

- The installed iOS PWA keeps a first-party, same-origin cookie, which is what 0028 was working around.
- One deploy target, one custom domain, and no origin variables in GitHub or the Worker.
- `apps/web/public/_headers` still applies: Workers Static Assets reads it from the assets directory.
- The placeholder `database_id` gives local dev its own empty D1 state; `npm run db:reset:local` re-seeds it. An accidental `--remote` without `--env production` fails instead of reaching production data.
- The production Worker is named `bodylog` (not `bodylog-api`), so its secrets are set again with `wrangler secret put ... --env production`, and the old session cookie for `api.bodylog.antonbsa.dev` no longer applies after cutover.
