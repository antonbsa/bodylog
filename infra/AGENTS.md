# infra

Conventions for `infra/` (D1 migrations, local-db scripts, the shared `errors.ts`).

## Migrations

- Migrations are hand-written SQL in `infra/migrations/`, named `<NNNN>_<snake_case_name>.sql` with the next four-digit number. Every wrangler environment reads them through `migrations_dir` in `apps/api/wrangler.toml`.
- Apply locally with `npm run db:migrate:local` (or `npm run db:setup:local`, which also seeds an empty table). Remote apply (`npm run db:migrate:remote`) is production and stays with the owner.
- Symptom: a renamed or edited migration never runs on a database that already applied it, or `db:migrate:local` fails with `duplicate column name`. Why it slips: wrangler tracks applied migrations by filename in the `d1_migrations` table, not by content, and `tests/api/migrations.test.ts` replays the files on a fresh in-memory SQLite. Verify: a schema change is always a new file, never an edit to an applied one; extend `migrations.test.ts` for it and run `npm run db:migrate:local`, which applies only the new file.
- A schema change also updates [docs/technical/database.md](../docs/technical/database.md) and the repository in `apps/api/src/db/repositories/` in the same change.

## Local DB scripts

- `infra/scripts/local-db/` (commands in its [README](scripts/local-db/README.md)) only ever uses wrangler's `--local` mode; keep every new command local-only.
- `npm run db:reset:local` deletes every local measurement before reseeding, and deleting `apps/api/.wrangler/state` wipes the whole local D1. Both need the owner's yes first; `guard-bash.mjs` asks before any `rm` of `.wrangler` state.
- Seed dates are generated relative to today in TypeScript because weekly grouping depends on the current date; pass `-- --today YYYY-MM-DD` for deterministic data.
