# T-033 — Restructure `infra/` Folder

## Status

To Do

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
- Add `infra/errors.ts` for shared error definitions (consumed by
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
- The shared types module is a typechecked sibling of `infra/errors.ts` (e.g.
  `infra/types/`), included in a tsconfig project that both `apps/api` and
  `apps/web` reference — the same physical pattern as the error module.

## Out of Scope

- Do not change migration SQL, local-db tooling behavior, or DB schema.
- Do not rename package scripts (path changes only — see Assumptions).
- Do not implement the error module itself (that is T-035; this task only
  creates its `infra/errors.ts` home).
- Do not refactor type-only differences (request/response DTOs, view models)
  that are not genuinely the same shape on both sides — only extract real
  duplication.

## Dependencies

- **T-035 (structured error handling)** places its shared error definitions
  in `infra/errors.ts`. This task creates that location; T-035 fills it.
  Coordinate the physical TypeScript source location so it stays typechecked
  (see Assumptions) — `infra/` is currently outside the `apps/*` tsconfig
  projects.

## Assumptions

- Package-script names are kept (`db:*:local`, `typecheck:scripts`); only paths
  change. **Confirmed by the owner.**
- `infra/errors.ts` is the documented home for shared error definitions; the
  TypeScript source lives directly there, included via a tsconfig that covers
  `infra/` (see T-035, which the owner confirmed should use this
  approach).
- The shared-types audit (see Scope) follows the same physical pattern as
  `infra/errors.ts` — a typechecked `infra/` location both apps import from.

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

- [ ] `migrations/` and `scripts/local-db/` (+ `scripts/tsconfig.json`) live
      under `infra/`.
- [ ] `infra/errors.ts` exists for shared error definitions.
- [ ] All references (wrangler config, package scripts, tsconfig, seed/local-db
      script, CI/deploy, docs) are updated; no stale root-level paths remain.
- [ ] Local DB tooling and migrations still work from the new locations.
- [ ] Genuinely shared types (e.g. `Measurement`) are defined once in a
      typechecked shared location and imported by both `apps/api` and
      `apps/web`, instead of one side importing the other's declaration.
- [ ] All listed automated checks pass.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
