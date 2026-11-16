# BodyLog

A personal, mobile-first PWA for logging daily body metrics from a bioimpedance scale and tracking weekly progress through simple averages and comparisons.

The V1 goal is not to build a generic fitness platform. The goal is to make daily logging faster than a spreadsheet while keeping weekly progress easier to read.

## V1 Scope

- Daily body metrics logging
- Weekly dashboard
- Measurement history list
- Edit and delete records
- Weekly averages
- Partial current week vs previous full week comparison
- CSV import for existing spreadsheet data
- CSV export for backup
- Simple single-user authentication
- Full deployment on Cloudflare

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Hono + TypeScript
- **Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1
- **Deployment:** one Cloudflare Worker serving the web app (Workers Static Assets) and the API
- **Future V2 migration:** serverless Postgres

## Core Metrics

The app stores manually entered scale readings:

- Weight
- Body fat percentage
- Muscle percentage
- Resting metabolism

Only weight is required in V1. Derived values such as BMI, body fat mass, muscle mass, weekly averages, and weekly variation are calculated by the app.

## Documentation

This repository uses a lightweight Spec-Driven Development workflow.

- `docs/` contains stable product, technical, decision, and general documentation.
- `specs/` contains version-level specifications, acceptance criteria, implementation strategy, and open questions.

Project documentation is stored under `docs/`.

- Product overview: `docs/product/overview.md`
- Product requirements: `docs/product/requirements.md`
- User flows: `docs/product/user-flows.md`
- UI direction: `docs/product/ui-direction.md`
- V1 scope: `docs/product/scope.md`
- Future ideas: `docs/product/future-ideas.md`
- Technical architecture: `docs/technical/architecture.md`
- API contract: `docs/technical/api.md`
- Database model: `docs/technical/database.md`
- Technical decisions: `docs/technical/decisions/`
- Development guide: `docs/guides/development.md`

V1 spec files are stored under `specs/v1/`.

Executable work is tracked only as GitHub issues (see ADR 0036); the files under `specs/v1/tasks/` are history.

Agent-specific instructions are in [`AGENTS.md`](./AGENTS.md).

## Development

Use the project Node.js version:

```sh
nvm use
```

Install dependencies:

```sh
npm install
```

Repository structure:

```txt
apps/api   Hono Worker API
apps/web   React/Vite frontend package
tests/api  API and backend tests
tests/e2e  Playwright E2E tests
```

Run the API Worker and React/Vite frontend together:

```sh
npm run dev
```

`npm run dev` does not run migrations or seed local data. Prepare the local D1 database separately when needed:

```sh
npm run db:setup:local
```

This applies local migrations and seeds default mock measurements only when the local database is empty.

Run only the Worker locally through Wrangler:

```sh
npm run dev:api
```

Run only the React/Vite frontend locally:

```sh
npm run dev:web
```

Build the project:

```sh
npm run build
```

Validate the current backend base:

```sh
npm run typecheck
npm run test:unit
npm run test:e2e
```

Automated tests live in the root `tests/` directory.

Run D1 migrations:

```sh
npm run db:migrate:local
npm run db:migrate:remote
```

Prepare and populate local D1 data:

```sh
npm run db:setup:local
npm run db:seed:local -- --today 2026-06-11
npm run db:reset:local -- --today 2026-06-11
```

Local seed data is development-only. It generates measurement dates relative to the current date so weekly dashboard development remains useful over time. See `infra/scripts/local-db/README.md` for details.

Run ad hoc (manual) D1 queries:

```sh
npm run db:query:local -- "SELECT COUNT(*) AS count FROM measurements"
npm run db:query:remote -- "SELECT COUNT(*) AS count FROM measurements"
```

Deploy to Cloudflare: one Worker (`bodylog`) serves the built web app and the API from the same origin.

```sh
npm run deploy
```

`npm run deploy` builds `apps/web` and runs `wrangler deploy --env production` from `apps/api`, uploading `apps/web/dist` as the Worker's static assets. The top level of `apps/api/wrangler.toml` is local dev only; production always goes through `--env production`.

For local interactive deployment, authenticate Wrangler once through the browser with `npx wrangler login`. For non-interactive deployment, such as CI or an agent environment, Wrangler requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to be set before deployment.
Local API development explicitly loads the committed `.env.development` file with non-production auth defaults through Wrangler's `--env-file` flag. Production secrets must be configured through Cloudflare, not committed.
Non-secret Worker variables such as `USER_HEIGHT_CM` and `USER_TIME_ZONE` are configured in `apps/api/wrangler.toml`.

```sh
cd apps/api
npx wrangler secret put APP_PASSWORD --env production
npx wrangler secret put SESSION_SECRET --env production
```

GitHub deployment automation runs after CI passes on `main` and runs `npm run deploy`. Required GitHub configuration:

```txt
Secrets:
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

Current API base:

```txt
GET /api/health
POST /api/auth/login
```

## Status

Initial V1 validation tasks are marked `Done`; remaining work is tracked as GitHub issues.
