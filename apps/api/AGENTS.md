# apps/api

Backend conventions for the Hono Worker on Cloudflare Workers + D1. The Worker also serves `apps/web/dist` in production (ADR 0040).

## Source layout

- The map is in [the architecture overview's "Source Layout"](../../docs/architecture/overview.md#source-layout). A new endpoint goes in `src/features/<name>/routes.ts` with that feature's services beside it; `app.ts` mounts it, and `index.ts` stays a re-export as the wrangler `main`.
- Code two or more features use goes in `src/http/` (request validation, session and API token guards) or `src/domain/`; rules the web app also runs go in root `domain/`, and wire shapes in root `types/` (root [AGENTS.md](../../AGENTS.md) "Engineering"). `src/types.ts` holds API-only bindings and inputs.
- Only `/api/auth/*`, `/api/health` and `/import-format.md` are public, and `/api/collector/*` takes a personal API token instead of the session (ADR 0047). Symptom: a new data router answers without a session cookie, or a new public path outside `/api/*` answers with the SPA's `index.html`. Why it slips: mounting a router with `app.route` directly works and its happy-path tests pass, and a path outside `/api/*` works in `app.request` tests and the Vite proxy while the deployed Worker never sees it unless it is in `run_worker_first`. Verify: add a data router to the `protectedApi` mount list in `app.ts` (which puts `requireSession` on its prefix) and test that a request without a cookie gets 401; list a public path outside `/api/*` in `run_worker_first` of both `[env.production.assets]` and `[env.preview.assets]` in `wrangler.toml` (the config test in `tests/api/config.test.ts` reads both).

## Route handlers

- Validate input with the parsers in `http/request-validation.ts` and throw the `AppError` subclasses from `infra/errors.ts` (`createValidationError`/`createNotFoundError` for known codes); `app.onError` serializes them. Each error carries a Portuguese `message` and `action` the web shows as-is.
- Read env-derived settings through `config.ts` (`getGitHubClient`, `isDevLoginEnabled`), not raw `c.env` strings.
- Persistence goes through `db/repositories/` (one file per table, `new MeasurementRepository(c.env.DB, c.get("userId"))`); SQL never appears in a route or service, so the planned move to Postgres touches only repositories.
- A change that adds, removes or reshapes a route, or changes the error envelope, updates [docs/reference/api-contract.md](../../docs/reference/api-contract.md) in the same change; a schema change also updates [docs/reference/database.md](../../docs/reference/database.md), and a measurement field or rule change [docs/reference/measurements.md](../../docs/reference/measurements.md).

## Data scoped by user

- Every query on user data filters by the owner: `MeasurementRepository` takes the user id in its constructor and adds it to each statement. Symptom: one account sees or overwrites another's rows. Why it slips: single-user tests pass, since one user's rows are all the rows. Verify: extend `tests/api/user-isolation.test.ts` with two users for every route that reads or writes user data.

## SQL that only SQLite has run

- Symptom: a repository query passes `npm run test:unit` and fails on real D1. Why it slips: `tests/api` runs it on Node's SQLite with the real migrations, which parses and executes it but is not D1 (no D1 limits, a different SQLite build).
- Verify: run the statement against local D1 after `npm run db:setup:local`, a `SELECT` directly (see "D1 debug queries") and a write only with the owner's yes.

## D1 debug queries

- For a debugging question ("does row X exist", "what's stored for date Y"), run the query yourself and report the result; don't hand it back to the user.
- Run it from the repo root against the local database, in exactly one of these shapes (that is what `.claude/settings.json` allow-lists):

  ```bash
  npm run db:query:local -- "SELECT * FROM measurements WHERE date = '2026-06-10'"
  npx wrangler d1 execute DB --config apps/api/wrangler.toml --local --command "SELECT * FROM measurements WHERE date = '2026-06-10'"
  ```

- Anything that mutates data or schema (`INSERT`, `UPDATE`, `DELETE`, `DROP`, "seed a test row") needs explicit confirmation every time, even locally: say what it changes and where first. `guard-bash.mjs` asks for every `d1 execute` that isn't a single `SELECT`.
- Remote D1 (`--remote` against preview or production, `d1 time-travel`, `npm run db:query:remote`, `npm run db:migrate:remote`) is deployed data and is denied in `.claude/settings.json`; it is never run from an agent session.
