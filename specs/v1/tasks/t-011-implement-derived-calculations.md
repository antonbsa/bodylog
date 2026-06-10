# T-011 — Implement Derived Calculations

## Status

Done

## Description

Implement pure domain calculations for V1 derived measurement values.

## Implementation Plan

- Add a small derived-calculation module under the API measurement domain.
- Use a versioned default height constant for V1 BMI calculations.
- Allow callers/tests to pass an explicit height for future configuration wiring.
- Calculate BMI, body fat mass, and muscle mass from stored measurement values.
- Return `null` for derived mass values when the required optional percentage is missing.
- Add focused API-domain unit tests for derived calculation behavior.

## Why

This task advances BodyLog V1 during the Database and Domain phase.

## Scope

Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.

## Out of Scope

Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.

## Validation

Run the relevant automated checks for the changed area. If automated coverage is not practical yet, record the manual validation performed in this task.

## Acceptance Criteria

- [x] BMI calculated from configured height.
- [x] Body fat mass calculated when possible.
- [x] Muscle mass calculated when possible.
- [x] Missing optional fields return `null` derived values.
- [x] Unit tests cover derived calculation behavior.

## Modified Files

- `apps/api/src/measurements/derived-calculations.ts`
- `apps/api/src/measurements/weekly-logic.ts`
- `docs/technical/deployment.md`
- `docs/technical/decisions/0024-use-versioned-height-constant.md`
- `specs/v1/open-questions.md`
- `tests/api/derived-calculations.test.ts`
- `tests/api/weekly-logic.test.ts`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-011-implement-derived-calculations.md`
- `specs/v1/tasks/t-012-implement-weekly-logic.md`

## Validation Notes

- `npm run test:api` passed.
- `npm run typecheck` passed.
- `npx eslint apps/api/src/measurements/derived-calculations.ts apps/api/src/measurements/weekly-logic.ts tests/api/derived-calculations.test.ts tests/api/weekly-logic.test.ts` passed.
- `npm run lint` was attempted but failed because the local generated `.wrangler/tmp` directory is scanned by `eslint .`; the changed source and test files pass ESLint directly.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
