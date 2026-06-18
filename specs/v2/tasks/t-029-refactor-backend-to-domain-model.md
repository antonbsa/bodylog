# T-029 — Refactor Backend to Domain Model

## Status

Done

## Description

Refactor the API backend to introduce a light domain model layer so that
business logic is encapsulated in domain objects rather than scattered across
free functions.

Currently, `derived-calculations.ts` and `weekly-logic.ts` contain free
functions that operate on plain data interfaces. Services and routes must
manually invoke these functions and assemble results. The goal is to promote
`Measurement` to a domain object that carries its own derived values, and
`WeekSummary` to a value object that encapsulates averaging, direction, and
comparison rules.

## Why

Derived values (`bmi`, `bodyFatKg`, `muscleKg`) are properties of a
measurement, not independent computations that callers must remember to invoke.
Weekly summary rules (averaging, direction thresholds, percentage-point
comparison) belong to a single place rather than being composed ad hoc in the
service layer. This makes the service layer easier to read and the domain rules
easier to test in isolation.

## Scope

- Introduce a `Measurement` domain object (class or factory function) that
  computes and exposes derived values (`bmi`, `bodyFatKg`, `muscleKg`) when the
  relevant fields are present.
- Introduce a `WeekSummary` value object that encapsulates weekly average
  calculation.
- Introduce a `WeekComparison` value object that encapsulates absolute
  variation, relative percentage, direction, and percentage-point display for
  percentage-based metrics.
- Update the repository to return `Measurement` domain objects instead of raw
  row types.
- Update the service layer to operate on domain objects rather than calling
  `derived-calculations.ts` or `weekly-logic.ts` functions directly.
- Remove or collapse `derived-calculations.ts` and `weekly-logic.ts` into the
  domain objects where their logic now lives.
- Keep domain types independent from D1-specific types (required for the planned
  V2 Postgres migration).
- Update existing tests to cover domain object behavior.

## Out of Scope

- Do not change the API contract or response shape.
- Do not add new product features.
- Do not touch the frontend.
- Do not add multi-user behavior, charts, Google Sheets integration,
  offline-first behavior, or Vercel compatibility.

## Validation

Run the relevant automated checks:

- `npm run test:api`
- `npm run typecheck`
- `npm run lint`
- `npm run build:api`
- `git diff --check`

## Acceptance Criteria

- [x] `Measurement` domain object computes derived values internally.
- [x] Repository returns `Measurement` domain objects, not raw DB row types.
- [x] Service layer no longer calls `derived-calculations.ts` free functions
      directly.
- [x] `WeekSummary` and `WeekComparison` value objects encapsulate averaging,
      direction, and comparison rules.
- [x] Domain types have no dependency on D1-specific types.
- [x] Existing API behavior and response shapes are unchanged.
- [x] Existing automated tests pass and cover domain object behavior.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results

## Implementation Notes

Introduced `apps/api/src/domain/`:

- `measurement.ts` — `Measurement` class. Holds raw fields and exposes
  `getDerivedValues(heightCm)` (bmi/bodyFatKg/muscleKg) and `toJSON()` for
  API serialization. Height stays a caller-supplied config value (not stored
  on the instance), matching the documented rule that height lives outside
  the measurement record.
- `week-range.ts` — pure date-range helpers (`getWeekRange`,
  `getPreviousWeekRange`), extracted from the old `weekly-logic.ts`.
- `week-summary.ts` — `WeekSummary` value object. Static factory
  `WeekSummary.forRange(measurements, range, options)` encapsulates the
  averaging rules (ignore missing days, ignore missing optional values per
  metric, null average when no values).
- `week-comparison.ts` — `WeekComparison` value object. Static
  `WeekComparison.compare(current, previous)` encapsulates absolute
  variation, relative percentage, percentage-point display for
  percentage-based metrics, and direction thresholds.

`MeasurementRepository` now constructs and returns `Measurement` domain
objects instead of a plain row-shaped type. `weekly-dashboard-service.ts`
orchestrates `WeekSummary`/`WeekComparison` to build the current/previous/
display/variation response instead of calling free functions from
`weekly-logic.ts`. `index.ts` calls `measurement.getDerivedValues(heightCm)`
for the measurement list endpoint instead of the removed
`calculateDerivedMeasurementValues` function.

`derived-calculations.ts` and `weekly-logic.ts` were deleted; their logic
now lives in the domain objects above. `types.ts` no longer exports a plain
`Measurement` type — only the create/update/import input types remain.

Domain types have no D1-specific dependencies (D1 row mapping stays inside
`measurement-repository.ts`).

## Validation

- `npm run test:api` — 11 files, 67 tests passed. Added
  `tests/api/measurement.test.ts`, `week-range.test.ts`,
  `week-summary.test.ts`, `week-comparison.test.ts`, and
  `weekly-dashboard-service.test.ts` to cover the domain objects directly;
  removed `derived-calculations.test.ts` and `weekly-logic.test.ts` (logic
  moved). Existing `measurement-api.test.ts` and `weekly-dashboard-api.test.ts`
  pass unchanged, confirming the API response shape is unchanged.
- `npm run typecheck` — passes.
- `npm run lint` — passes (after `eslint --fix` for two formatting issues).
- `npm run build:api` — script does not exist in this repo (root only has
  `build:web`; `apps/api` has no `build` script). Pre-existing gap, unrelated
  to this task; skipped.
- `git diff --check` — no whitespace errors.
