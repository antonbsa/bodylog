# infra

Conventions for `infra/` (D1 migrations, local-db scripts, the shared `errors.ts`).

## Migrations

- Migrations are hand-written SQL in `infra/migrations/`, named `<NNNN>_<snake_case_name>.sql` with the next four-digit number. Every wrangler environment reads them through `migrations_dir` in `apps/api/wrangler.toml`.
- Apply locally with `npm run db:migrate:local` (or `npm run db:setup:local`, which also seeds an empty table). Remote databases get migrations only from the deploy workflows: preview on every merge to `main`, production when a release is published (ADR 0041). A migration therefore runs against preview's data before production's, without a manual step.
- Symptom: a renamed or edited migration never runs on a database that already applied it, or `db:migrate:local` fails with `duplicate column name`. Why it slips: wrangler tracks applied migrations by filename in the `d1_migrations` table, not by content, and `tests/api/migrations.test.ts` replays the files on a fresh in-memory SQLite. Verify: a schema change is always a new file, never an edit to an applied one; extend `migrations.test.ts` for it and run `npm run db:migrate:local`, which applies only the new file.
- A schema change also updates the repository in `apps/api/src/db/repositories/` and [docs/reference/database.md](../docs/reference/database.md) in the same change. The page maps tables, relations, unique keys and enumeration values; column types and indexes stay in the migrations. Symptom: the page names a table, key or value the schema no longer has, or misses a new one. Why it slips: `migrations.test.ts` and the API tests read the SQL, never the page. Verify: for each table, relation, unique key or enumeration value the migration adds or removes, `grep -n "<name>" docs/reference/database.md` finds it as it now is.

## Local DB scripts

- `infra/scripts/local-db/` (commands in its [README](scripts/local-db/README.md)) only ever uses wrangler's `--local` mode; keep every new command local-only.
- `npm run db:reset:local` deletes every local measurement before reseeding, and deleting `apps/api/.wrangler/state` wipes the whole local D1. Both need the owner's yes first; `guard-bash.mjs` asks before any `rm` of `.wrangler` state.
- Seed dates are generated relative to today in TypeScript because weekly grouping depends on the current date; pass `-- --today YYYY-MM-DD` for deterministic data.
