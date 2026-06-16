# T-029 — Refactor Backend to Domain Model

## Status

To Do

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

- [ ] `Measurement` domain object computes derived values internally.
- [ ] Repository returns `Measurement` domain objects, not raw DB row types.
- [ ] Service layer no longer calls `derived-calculations.ts` free functions
      directly.
- [ ] `WeekSummary` and `WeekComparison` value objects encapsulate averaging,
      direction, and comparison rules.
- [ ] Domain types have no dependency on D1-specific types.
- [ ] Existing API behavior and response shapes are unchanged.
- [ ] Existing automated tests pass and cover domain object behavior.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
