# Body Metrics Tracker

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

The project follows a lightweight Spec-Driven Development workflow.

```txt
docs/
  sdd/              Process and documentation model
  product/          Product definition, requirements, scope, backlog
  technical/        Architecture, data model, API contract, deployment decisions
  implementation/   Implementation plan, tasks, validation checklist
```

Start with:

1. `docs/product/00-product-brief.md`
2. `docs/product/01-requirements.md`
3. `docs/product/03-scope.md`
4. `docs/technical/00-architecture.md`
5. `docs/implementation/01-tasks.md`

Agent-specific instructions are in [`AGENTS.md`](./AGENTS.md).

## Development

Install dependencies:

```sh
npm install
```

Run the Worker locally through Wrangler:

```sh
npm run dev
```

Validate the current backend base:

```sh
npm run typecheck
npm test
```

Automated tests live in the root `tests/` directory.

Deploy the Worker to Cloudflare:

```sh
npm run deploy
```

In non-interactive environments, Wrangler requires `CLOUDFLARE_API_TOKEN` to be set before deployment.

Current API base:

```txt
GET /api/health
```

## Status

T-001 backend API base implemented.
