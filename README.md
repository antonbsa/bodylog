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
- **Deployment:** Cloudflare Pages / Workers
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
- `specs/` contains version-level specifications, acceptance criteria, implementation strategy, open questions, and executable tasks.

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

Executable V1 tasks are tracked as plain markdown files under `specs/v1/tasks/`.

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
npm run test:api
npm run test:e2e
```

Automated tests live in the root `tests/` directory.

Run D1 migrations:

```sh
npx wrangler d1 create body_metrics_tracker
npm run db:migrate:local
npm run db:migrate:remote
```

Prepare and populate local D1 data:

```sh
npm run db:setup:local
npm run db:seed:local -- --today 2026-06-11
npm run db:reset:local -- --today 2026-06-11
```

Local seed data is development-only. It generates measurement dates relative to the current date so weekly dashboard development remains useful over time. See `scripts/local-db/README.md` for details.

Run ad hoc (manual) D1 queries:

```sh
npm run db:query:local -- "SELECT COUNT(*) AS count FROM measurements"
npm run db:query:remote -- "SELECT COUNT(*) AS count FROM measurements"
```

Deploy the Worker to Cloudflare:

```sh
npm run deploy:api
```

Deploy the built frontend to Cloudflare Pages:

```sh
npm run build
npm run deploy:web -- --project-name <cloudflare-pages-project-name> --branch main
```

For local interactive deployment, authenticate Wrangler once through the browser:

```sh
npx wrangler login
npm run deploy:api
```

For non-interactive deployment, such as CI or an agent environment, Wrangler requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to be set before deployment.
Local API development explicitly loads the committed `.env.development` file with non-production auth defaults through Wrangler's `--env-file` flag. Production secrets must be configured through Cloudflare, not committed.
Non-secret Worker variables such as `USER_HEIGHT_CM` and `USER_TIME_ZONE` are configured in `apps/api/wrangler.toml`. Deployment automation injects `PRODUCTION_FRONTEND_ORIGIN` so the API can allow credentialed requests from the production Pages origin.
The frontend Pages deployment uses `apps/web/wrangler.toml`.

```sh
npx wrangler secret put APP_PASSWORD --config apps/api/wrangler.toml
npx wrangler secret put SESSION_SECRET --config apps/api/wrangler.toml
npm run deploy:api
```

GitHub deployment automation runs on direct pushes to `main` and deploys both Cloudflare targets after checks pass. Required GitHub configuration:

```txt
Secrets:
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN

Variables:
CLOUDFLARE_PAGES_PROJECT_NAME
PRODUCTION_FRONTEND_ORIGIN
VITE_API_BASE_URL
```

Current API base:

```txt
GET /
POST /api/auth/login
```

## Status

Initial V1 validation tasks are marked `Done`; remaining V1 work is tracked under `specs/v1/tasks/`.
