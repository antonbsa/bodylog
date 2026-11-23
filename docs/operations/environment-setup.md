# Environment Setup

What a BodyLog environment is made of on Cloudflare and how it is configured. The deploy itself is in [Deploying](deploying.md); secret values are in [Secrets](secrets.md).

## Cloudflare Components

- One Worker with Hono that serves the API under `/api/*` and the built web app through Workers Static Assets.
- One D1 database bound to that Worker as `DB`.
- Worker secrets for the environment's GitHub OAuth App and Google OAuth client ([Secrets](secrets.md)).

BodyLog is meant to run within the Cloudflare free plan for personal use, so the implementation avoids unnecessary queries, frequent full scans on large tables, repeated dashboard calls, polling and heavy processing inside the Worker.

## Environments

| Environment | Worker            | D1 database       | Where                                                              |
| ----------- | ----------------- | ----------------- | ------------------------------------------------------------------ |
| Local       | `bodylog-dev`     | `bodylog-dev`     | `wrangler dev` on `http://localhost:8787`                          |
| Preview     | `bodylog-preview` | `bodylog-preview` | its `workers.dev` URL, deployed on every merge to `main`           |
| Production  | `bodylog`         | `bodylog-prod`    | `https://bodylog.antonbsa.dev`, deployed on each published release |

Locally, the Vite dev server on `http://localhost:5173` proxies `/api` requests to the Worker, so the browser still sees one origin. Running it is covered in [Run locally](../guides/run-locally.md).

## Wrangler Configuration

`apps/api/wrangler.toml` is the only Wrangler config:

- The top level is local dev only: worker `bodylog-dev`, non-secret vars, and the `bodylog-dev` D1 binding with a placeholder `database_id`, so an accidental `--remote` without `--env production` cannot reach production data. Local API development loads the root `.env.development` file through `--envFile`.
- `[env.production]` re-declares everything production needs, because named environments do not inherit vars or bindings: worker `bodylog`, vars, observability, the `bodylog-prod` D1 database and `[env.production.assets]`.
- `[env.preview]` mirrors it for worker `bodylog-preview` and its own `bodylog-preview` D1 database, so preview never reads production data; a change to production's vars, assets or bindings is repeated there.
- Assets stay out of the top level because `wrangler dev` fails when `apps/web/dist` is missing.

`[env.production.assets]` uses `not_found_handling = "single-page-application"` so client routes such as `/historico` get `index.html`, and `run_worker_first = ["/api/*", "/import-format.md"]` so every API request, including unknown ones, reaches the Worker and gets a JSON response; the public `/import-format.md` page is listed because it lives outside `/api/*`, where the SPA fallback would otherwise serve `index.html`. `apps/web/public/_headers` is copied into `dist/` and applied by Workers Static Assets, which keeps `Cache-Control: no-cache` on `/` and `/index.html`.

The web app and the API share one origin, so the session cookie is first-party: `HttpOnly`, `SameSite=Lax` and `Secure` (except on `localhost`). There is no CORS handling and no API base URL. Each provider's `redirect_uri` is derived from the request origin, so each environment's OAuth clients only need its callback URLs to match; there is no var for it.

## Local GitHub Sign-in

Locally, **Entrar como dev** covers day-to-day work ([Run locally](../guides/run-locally.md#start)). To try the real GitHub flow, create a separate OAuth App with `http://localhost:5173` as **Homepage URL** and `http://localhost:5173/api/auth/github/callback` as **Authorization callback URL**, and put its credentials in `.env.local` at the repo root:

```txt
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

For Google, add `http://localhost:5173/api/auth/google/callback` as an **Authorized redirect URI** of an OAuth client and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` the same way.

`wrangler dev` loads `.env.local` after `.env.development`, so these replace the placeholders. Without them, **Entrar com GitHub** reaches GitHub with a placeholder client id and GitHub rejects it.

The API's `dev` script passes `--local-upstream localhost:5173`, so the Worker sees the Vite origin and derives that callback even though it listens on 8787; Vite runs with `strictPort`, so the port can't drift. GitHub sign-in doesn't work from a phone via `dev:lan` (the callback stays on localhost): use **Entrar como dev** there and test GitHub sign-in on preview.

## Non-Secret Variables

Height and time zone are per user, stored on `users` and set from Ajustes and the device (`0046-per-user-height-and-device-time-zone.md`), so the Worker has no variable for them.

- `DEV_LOGIN_ENABLED="true"` turns on `POST /api/auth/dev-login`. Only `.env.development` sets it; `wrangler.toml` leaves it out of every environment, so preview and production answer that route with 404.

It is not a secret, so it never goes through `wrangler secret put`.

## GitHub Repository Secrets

Both deploy workflows (`deploy-preview.yaml`, `deploy-release.yaml`) need two repository secrets and no variables:

```txt
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

The token needs the account permissions **Workers Scripts: Edit** and **D1: Edit**: the workflows list Worker secrets, apply D1 migrations, read the Time Travel bookmark, export production D1 for the backup and deploy both Workers.

## Setting Up Preview

From `apps/api`, once:

```sh
npx wrangler d1 create bodylog-preview
```

Put the printed `database_id` in `[[env.preview.d1_databases]]` in `apps/api/wrangler.toml`, replacing the placeholder, and commit it. Then set the preview secrets ([Secrets](secrets.md#preview)), which also creates the `bodylog-preview` Worker. The first deploy applies every migration to the empty database.

## Backup Storage

Production D1 is exported every day to a private Backblaze B2 bucket outside Cloudflare ([backup and restore](backup-and-restore.md)). Besides the Cloudflare secrets above and the B2 key secrets in [Secrets](secrets.md#backup-secrets), the backup workflow reads three repository variables:

```txt
B2_BUCKET     the bucket name
B2_ENDPOINT   the bucket's S3 endpoint with https://, e.g. https://s3.us-west-004.backblazeb2.com
B2_REGION     the region part of the endpoint, e.g. us-west-004
```
