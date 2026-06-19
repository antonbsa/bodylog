# T-026 — Prepare Local Development Data Setup

## Status

Done

## Description

Create a development-only local database setup flow that prepares the local D1 database and populates it with useful mocked measurement data for API and dashboard development.

The setup must make it easy for a fresh clone to prepare a local database without manually remembering migration and seed commands.

This task is intentionally listed before T-016 in the task index because upcoming UI and dashboard tasks benefit from realistic local measurement data. The task number remains T-026 to avoid renumbering existing stable task files.

## Why

The remaining V1 work includes measurement UI, weekly dashboard API/UI, CSV import/export, and end-to-end validation. Those tasks are easier to develop and validate when every local development environment can quickly create the database schema and populate representative measurements.

Static SQL seed files are not a good fit for this project because dates are central to weekly grouping and current-week comparison. Seed data should be generated relative to the current date so the dashboard remains useful over time.

## Scope

- Add a local database setup script that runs local D1 migrations and seeds mocked data.
- Add a local seed command that is idempotent and safe to run more than once.
- Generate seed measurement dates relative to the current date instead of relying on fixed calendar dates.
- Seed useful default data for:
  - the previous full Monday-to-Sunday week;
  - the current partial week through today;
  - complete and partially missing optional metric values.
- Add a reset command for local development data when a clean reseed is desired.
- Document the intended local development flow and the difference between setup, seed, and reset commands.
- Keep all seed behavior development-only and local-only.

## Out of Scope

- Do not seed production data automatically.
- Do not run remote D1 migrations or remote seed commands from the local setup command.
- Do not commit personal production records, exported backups, or production database files.
- Do not add Google Sheets integration.
- Do not add CSV import behavior as part of this task.
- Do not change V1 product behavior or API contracts except where needed to support local tooling.
- Do not run long-running development servers or watchers as part of validation.

## Implementation Notes

- Prefer a TypeScript seed script over a plain SQL seed file so dates can be generated relative to the current date.
- The setup command should apply local migrations before attempting to seed.
- The default seed command should avoid overwriting normal local development records unexpectedly.
- `npm run dev` should not seed on every run.
- If any command prepares data before starting dev servers in the future, it should seed only when the local database is empty.
- Use idempotent writes, such as upsert by `date`, or clearly isolate known mock records so repeated runs do not create duplicates.
- Keep the seed flow intentionally small. Provide explicit commands for:
  - prepare local database and seed default mock data;
  - seed default mock data;
  - reset local mock data.
- Support `--today YYYY-MM-DD` so development and validation can pin the generated current week.
- Keep the SQL shape readable through a seed template file with generated rows.

## Acceptance Criteria

- [x] A local setup command applies local D1 migrations and seeds default mocked measurements.
- [x] The default local seed uses dates relative to the current date.
- [x] The default seed includes previous full week data and current partial week data.
- [x] The default seed includes at least one record with missing optional values.
- [x] Seed behavior is idempotent and does not create duplicate records when run repeatedly.
- [x] A reset command exists for clearing and recreating local mock data.
- [x] A documented `--today YYYY-MM-DD` option exists for pinning relative seed dates.
- [x] `npm run dev` does not seed on every run.
- [x] Any future prepare-before-dev flow seeds only when the local database is empty.
- [x] Commands are documented in the relevant README, task notes, or technical docs.
- [x] The task notes record validation results and the exact commands tested.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results

## Implementation Notes

- Split local DB tooling under `infra/scripts/local-db/` instead of keeping one large script.
- Added `npm run db:setup:local` to apply local migrations and seed default mocked measurements only when the local database is empty.
- Added `npm run db:seed:local` for explicit default mocked data.
- Added `npm run db:reset:local` to clear local measurements and recreate the default mocked data.
- Kept `npm run dev` unchanged; it does not run migrations or seed data.
- Added `tsx` and `@types/node` as dev dependencies for TypeScript local tooling.
- Added `infra/scripts/tsconfig.json` and included script typechecking in the root `npm run typecheck` command.
- Added `infra/scripts/local-db/seed-template.sql` so the SQL shape stays readable while dates and values are generated in TypeScript.

## Seed Support

The seed creates:

- the previous full Monday-to-Sunday week;
- the current partial week through the selected `today` date;
- one current-week record with missing optional values.

The public command option is `--today YYYY-MM-DD`. Validation also used the internal `BODYLOG_D1_PERSIST_TO` environment variable to point Wrangler at isolated temporary local D1 stores.

## Validation Notes

Validated against isolated temporary Wrangler local D1 stores using the internal `BODYLOG_D1_PERSIST_TO` environment variable.

Commands run:

```sh
npm run typecheck:scripts
npm run typecheck
npx eslint infra/scripts/local-db
npm run test:api
npm run lint
BODYLOG_D1_PERSIST_TO=/tmp/tmp.Np5xpK2LMb npm run db:setup:local -- --today 2026-06-11
BODYLOG_D1_PERSIST_TO=/tmp/tmp.Np5xpK2LMb npm run db:setup:local -- --today 2026-06-11
BODYLOG_D1_PERSIST_TO=/tmp/tmp.Np5xpK2LMb npm run db:seed:local -- --today 2026-06-11
npx wrangler d1 execute body_metrics_tracker --local --persist-to /tmp/tmp.Np5xpK2LMb --json --command "SELECT COUNT(*) AS count, COUNT(DISTINCT date) AS distinct_dates FROM measurements"
BODYLOG_D1_PERSIST_TO=/tmp/tmp.Np5xpK2LMb npm run db:reset:local -- --today 2026-06-11
npx wrangler d1 execute body_metrics_tracker --local --persist-to /tmp/tmp.Np5xpK2LMb --json --command "SELECT MIN(date) AS min_date, MAX(date) AS max_date, COUNT(*) AS count, SUM(CASE WHEN body_fat_percentage IS NULL OR muscle_percentage IS NULL OR resting_metabolism_kcal IS NULL THEN 1 ELSE 0 END) AS missing_optional_count FROM measurements"
```

Results:

- `npm run typecheck`, `npx eslint infra/scripts/local-db`, `npm run test:api`, and `npm run lint` passed.
- First setup applied local migrations and seeded 11 default records.
- Second setup found 11 records and skipped seeding.
- Explicit seed did not create duplicate dates; count and distinct date count both remained 11.
- Reset cleared local measurements and recreated 11 records.
- Default setup for `2026-06-11` produced date range `2026-06-01` through `2026-06-11`, 11 records, and 1 record with missing optional values.

Modified files:

- `README.md`
- `docs/guides/development.md`
- `package.json`
- `package-lock.json`
- `infra/scripts/local-db/README.md`
- `infra/scripts/local-db/cli.ts`
- `infra/scripts/local-db/dates.ts`
- `infra/scripts/local-db/seed-data.ts`
- `infra/scripts/local-db/seed-sql.ts`
- `infra/scripts/local-db/seed-template.sql`
- `infra/scripts/local-db/types.ts`
- `infra/scripts/local-db/wrangler.ts`
- `infra/scripts/tsconfig.json`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-026-prepare-local-development-data-setup.md`
