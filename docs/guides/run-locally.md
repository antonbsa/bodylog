# Run Locally

Setting up a machine to run BodyLog: the API Worker through Wrangler, the web app through Vite, and a local D1 database.

## Prerequisites

- Node.js at the version in `.nvmrc`. `engine-strict=true` makes installs fail with `EBADENGINE` on any other version, so run `nvm use` first.

## Install

```sh
nvm use
npm install
```

## Set Up the Database

```sh
npm run db:setup:local
```

This applies local D1 migrations and seeds the default mock measurements only when the local `measurements` table is empty. It is safe to run repeatedly.

`npm run dev` does not run migrations or seed data, so starting the servers never changes development data unexpectedly.

Seed or update the default mocked measurements, or clear local measurements and seed them again:

```sh
npm run db:seed:local
npm run db:reset:local
```

`db:reset:local` is local-only but intentionally destructive: it clears local measurements before recreating the default seed data.

The seed script generates dates relative to the current date, so the weekly views stay useful over time. For deterministic checks, pass an explicit date:

```sh
npm run db:seed:local -- --today 2026-06-11
npm run db:reset:local -- --today 2026-06-11
```

The seed data shape and command details are in [`infra/scripts/local-db/README.md`](../../infra/scripts/local-db/README.md).

Run ad hoc queries against the local database:

```sh
npm run db:query:local -- "SELECT COUNT(*) AS count FROM measurements"
```

## Start

```sh
npm run dev
```

This starts the API Worker on `http://localhost:8787` and the web app on `http://localhost:5173`; Vite proxies `/api` to the Worker. Log in with the `APP_PASSWORD` from the committed `.env.development`, which Wrangler loads through `--env-file` (see [Secrets](../operations/secrets.md)). Under `vite serve` the login screen also shows **Entrar sem senha**, which sends that same password; production builds leave it out.

To run one side only:

```sh
npm run dev:api
npm run dev:web
```

`npm run dev:lan` also exposes the web app on the local network (`--host 0.0.0.0`), for opening it from a phone on the same Wi-Fi.

## Check It Works

```sh
npm run typecheck
npm run lint
npm run test:unit
npm run test:e2e
```

Test tiers and how to filter them are in [`tests/AGENTS.md`](../../tests/AGENTS.md). `npm run build` builds the web app into `apps/web/dist`, which is what production serves.

## Next

Shipping a change is in [Deploying](../operations/deploying.md).
