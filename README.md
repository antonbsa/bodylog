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

Run the Worker locally through Wrangler:

```sh
npm run dev
```

The default `dev` command runs the API Worker. The React/Vite frontend will be configured in T-006.

Validate the current backend base:

```sh
npm run typecheck
npm test
npm run test:e2e
```

Automated tests live in the root `tests/` directory.

Run D1 migrations:

```sh
npx wrangler d1 create body_metrics_tracker
npm run db:migrate:local
npm run db:migrate:remote
```

Run ad hoc (manual) D1 queries:

```sh
npm run db:query:local -- "SELECT COUNT(*) AS count FROM measurements"
npm run db:query:remote -- "SELECT COUNT(*) AS count FROM measurements"
```

Deploy the Worker to Cloudflare:

```sh
npm run deploy
```

For local interactive deployment, authenticate Wrangler once through the browser:

```sh
npx wrangler login
npm run deploy
```

For non-interactive deployment, such as CI or an agent environment, Wrangler requires `CLOUDFLARE_API_TOKEN` to be set before deployment.
Use `.env.example` as the template for a local `.env` file, then load it before deploying:

```sh
cp .env.example .env
# edit .env and set CLOUDFLARE_API_TOKEN
set -a
source .env
set +a
npm run deploy
```

Current API base:

```txt
GET /api/health
GET /api/health/d1
```

## Status

Initial V1 validation tasks are marked `Done`; remaining V1 work is tracked under `specs/v1/tasks/`.
