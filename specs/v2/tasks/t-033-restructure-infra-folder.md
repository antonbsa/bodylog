# T-033 — Restructure `infra/` Folder

## Status

Done

## Description

Create the `infra/` folder layout at the repo root and relocate existing
infrastructure files into it: `migrations/`, `local-db/`, `scripts/`, and an
`errors` location.

Skeleton directories already exist (`infra/`, `infra/migrations`,
`infra/scripts`, `infra/scripts/local-db`), but the **real** files still live at
the repo root (`migrations/0001_create_measurements.sql`, `scripts/local-db/*`,
`scripts/tsconfig.json`). This is a **move/restructure**, not a from-scratch
creation, and every reference to the old paths must be updated.

## Why

Infrastructure concerns (DB migrations, local-db tooling, shared error
definitions) are currently scattered at the repo root alongside application
code. Consolidating them under `infra/` clarifies the project layout before the
T-036 redesign and gives the structured error module (T-035) a documented home.

## Scope

- Move `migrations/` → `infra/migrations/` (currently one file:
  `migrations/0001_create_measurements.sql`).
- Move `scripts/local-db/` (and `scripts/tsconfig.json`) → `infra/scripts/`
  (target `infra/scripts/local-db/` already exists as a skeleton).
- Add an `infra/errors/` location for shared error definitions (consumed by
  T-035 — see Dependencies).
- Update **every** reference:
  - `apps/api/wrangler.toml`: `migrations_dir = "../../migrations"` →
    `"../../infra/migrations"`.
  - `scripts/local-db/wrangler.ts`: the literal `"migrations"` segment used by
    `applyLocalMigrations()`; verify `wranglerConfigPath = "apps/api/wrangler.toml"`
    still resolves after the move.
  - `package.json` scripts: `db:setup:local`, `db:seed:local`,
    `db:reset:local` (point `tsx` at the new `infra/scripts/local-db/cli.ts`
    path) and `typecheck:scripts` (point at the relocated `tsconfig.json`).
  - relocated `tsconfig.json`: `extends` path and `include` globs.
  - CI/deploy workflows (`.github/workflows/*`): verify nothing breaks (current
    greps show no direct `migrations`/`scripts` references, but confirm via
    `npm ci` / `npm run typecheck` paths).
- Re-run the reference greps after the move and confirm no stale root-level
  `migrations/` or `scripts/local-db/` paths remain.

### Shared type extraction

- Audit types used by both `apps/api` and `apps/web` (e.g. `Measurement` is
  independently declared in `apps/api/src/measurements/types.ts` and
  re-declared in `apps/web/src/api/measurements.ts`; frontend screen components
  import it from the latter, e.g. `import type { Measurement } from
"../api/measurements"`, even though the shape originates from the API).
- For types that are genuinely shared (same domain shape on both sides, not
  request/response wrappers specific to one side), move them into a single
  generic, typechecked location both `apps/api` and `apps/web` import from,
  instead of one side importing a type that conceptually belongs to the other.
- Keep this audit scoped to types that are actually duplicated/shared today;
  do not invent a shared-types layer for types that only exist on one side.
- The shared types module lives at root `types/` and is covered by the root
  TypeScript project. App-specific shared types live in the app root
  `src/types.ts`.

## Out of Scope

- Do not change migration SQL, local-db tooling behavior, or DB schema.
- Do not rename package scripts (path changes only — see Assumptions).
- Do not implement the error module itself (that is T-035; this task only
  creates its `infra/errors/` home).
- Do not refactor type-only differences (request/response DTOs, view models)
  that are not genuinely the same shape on both sides — only extract real
  duplication.

## Dependencies

- **T-035 (structured error handling)** places its shared error definitions
  under `infra/errors/`. This task creates that location; T-035 fills it.
  Coordinate the physical TypeScript source location so it stays typechecked
  (see Assumptions) — `infra/` is currently outside the `apps/*` tsconfig
  projects.

## Assumptions

- Package-script names are kept (`db:*:local`, `typecheck:scripts`); only paths
  change. **Confirmed by the owner.**
- `infra/errors/` is the documented home for shared error definitions; the
  TypeScript source lives directly there and is covered by the root tsconfig
  (see T-035, which the owner confirmed should use this approach).
- Cross-app shared contracts live in root `types/`; API-only and web-only
  shared types live in each app's root `src/types.ts`.

## Validation

Run the relevant automated checks:

- `npm run typecheck`
- `npm run lint`
- `npm run db:setup:local` and `npm run db:reset:local` (relocated local-db
  scripts still run)
- migrations still apply from `infra/migrations`
- `npm run build`
- `git diff --check`

Manual validation:

- No stale root-level `migrations/` or `scripts/local-db/` paths remain.
- Local DB setup/seed/reset succeed from the new locations.

## Acceptance Criteria

- [x] `migrations/` and `scripts/local-db/` (+ `scripts/tsconfig.json`) live
      under `infra/`.
- [x] An `infra/errors/` location exists for shared error definitions.
- [x] All references (wrangler config, package scripts, tsconfig, seed/local-db
      script, CI/deploy, docs) are updated; no stale root-level paths remain.
- [x] Local DB tooling and migrations still work from the new locations.
- [x] Genuinely shared types (e.g. `Measurement`) are defined once in a
      typechecked shared location and imported by both `apps/api` and
      `apps/web`, instead of one side importing the other's declaration.
- [x] All listed automated checks pass.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results

## Implementation Notes

- Moved the D1 migration from `migrations/` into `infra/migrations/`.
- Moved local DB tooling and the scripts TypeScript project from `scripts/` into
  `infra/scripts/`.
- Updated root package scripts, the API Wrangler D1 migration directory,
  script tsconfig inheritance, and stable docs to reference the new paths.
- Added `infra/errors/.gitkeep` so the shared structured-error home exists for
  T-035 without implementing the error module in this task.
- Extracted cross-app measurement, CSV import summary, and weekly dashboard
  response shapes into root `types/`.
- Moved API-only shared input/config types to `apps/api/src/types.ts`.
- Moved web-only shared UI/request types to `apps/web/src/types.ts`.
- Removed nested type-only ownership from API/web feature modules where the
  types are shared outside that file.
- Added root `typecheck:shared` coverage for `types/**/*.ts` and
  `infra/errors/**/*.ts`; app tsconfigs now only include app source and rely on
  normal imports for external shared contracts.
- Follow-up: moved the shared type module from `infra/types/` to root `types/`
  per owner direction, then updated imports, tsconfig includes, and docs.
- Follow-up: re-audited type ownership so non-shared types stay file-local,
  app-shared types live in app root `src/types.ts`, and cross-app contracts
  live in root `types/`.

## Validation Notes

Commands run:

```sh
node -v
npm -v
npm ci
npm run typecheck
npm run lint
npm run build
git diff --check
tmpdir=$(mktemp -d)
BODYLOG_D1_PERSIST_TO="$tmpdir" npm run db:setup:local -- --today 2026-06-11
BODYLOG_D1_PERSIST_TO="$tmpdir" npm run db:reset:local -- --today 2026-06-11
rm -rf "$tmpdir"
test ! -e migrations && test ! -e scripts
rg -n "scripts/local-db|scripts/tsconfig|\\.\\./\\.\\./migrations|tsx scripts|tsc -p scripts|migrations_dir = \"\\.\\./\\.\\./migrations\"" README.md docs package.json apps .github infra specs/v2/open-questions.md specs/v2/implementation-plan.md specs/v1/tasks/t-023-configure-deployment-automation.md specs/v1/tasks/t-026-prepare-local-development-data-setup.md
```

Results:

- Node was `v24.16.0`; npm was `11.13.0`.
- Initial `npm run typecheck` failed before `npm ci` because dependencies were
  not installed in the dedicated worktree (`tsc: not found`).
- `npm ci` passed. npm reported existing audit findings: 12 vulnerabilities
  (1 low, 11 high); dependency remediation is outside T-033.
- `npm run typecheck` passed after install, including relocated
  `infra/scripts/tsconfig.json`.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.
- `npm run db:setup:local` applied `0001_create_measurements.sql` from
  `infra/migrations` and seeded 11 records in an isolated temp local D1 store.
- `npm run db:reset:local` found no pending migrations, cleared measurements,
  and seeded 11 records in the same isolated temp local D1 store.
- Root `migrations/` and `scripts/` directories are absent.
- Reference grep found no stale executable references to root-level
  `scripts/local-db`, `scripts/tsconfig`, `../../migrations`, `tsx scripts`,
  `tsc -p scripts`, or the old Wrangler `migrations_dir`.
- No focused automated runtime test was added because this task changes
  structure/type ownership only; behavior was validated through typecheck,
  build, lint, and relocated local DB setup/reset.
- Follow-up validation passed: `npm run typecheck`, `npm run lint`,
  `npm run test:api`, `npm run build`, `git diff --check`, and
  stale-reference/type-export sweeps for `infra/types`, old nested API
  measurement types, and nested API/web type re-exports.

## Modified Files

- `README.md`
- `apps/api/src/measurements/types.ts`
- `apps/api/src/types.ts`
- `apps/api/src/measurements/weekly-logic.ts`
- `apps/api/tsconfig.json`
- `apps/api/wrangler.toml`
- `apps/web/src/api/dashboard.ts`
- `apps/web/src/api/measurements.ts`
- `apps/web/src/types.ts`
- `apps/web/tsconfig.json`
- `docs/guides/development.md`
- `docs/technical/architecture.md`
- `docs/technical/deployment.md`
- `infra/errors/.gitkeep`
- `infra/migrations/0001_create_measurements.sql`
- `infra/scripts/local-db/README.md`
- `infra/scripts/local-db/cli.ts`
- `infra/scripts/local-db/dates.ts`
- `infra/scripts/local-db/seed-data.ts`
- `infra/scripts/local-db/seed-sql.ts`
- `infra/scripts/local-db/seed-template.sql`
- `infra/scripts/local-db/types.ts`
- `infra/scripts/local-db/wrangler.ts`
- `infra/scripts/tsconfig.json`
- `types/dashboard.ts`
- `types/measurements.ts`
- `package.json`
- `tsconfig.json`
- `specs/v1/tasks/t-023-configure-deployment-automation.md`
- `specs/v1/tasks/t-026-prepare-local-development-data-setup.md`
- `specs/v2/tasks/t-033-restructure-infra-folder.md`
