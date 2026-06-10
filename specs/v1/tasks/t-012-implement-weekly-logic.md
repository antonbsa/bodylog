# T-012 — Implement Weekly Logic

## Status

Done

## Description

Implement pure domain logic for V1 week ranges, weekly averages, and weekly comparison.

## Implementation Plan

- Add weekly domain logic under the API measurement domain.
- Use UTC date-only helpers for `YYYY-MM-DD` week boundaries.
- Group measurements into Monday-to-Sunday weeks.
- Calculate weekly averages from existing measurements while ignoring missing days.
- Ignore missing optional metric values per metric.
- Include derived values in weekly averages.
- Compare the partial current week against the previous full week.
- Calculate absolute, relative, and percentage-point differences.
- Apply the documented V1 stable thresholds for weight, body fat mass, and muscle mass.
- Add focused API-domain unit tests for week boundaries, missing values, averages, variation, and direction.

## Why

This task advances BodyLog V1 during the Database and Domain phase.

## Scope

Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.

## Out of Scope

Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.

## Validation

Run the relevant automated checks for the changed area. If automated coverage is not practical yet, record the manual validation performed in this task.

## Acceptance Criteria

- [x] Week starts on Monday.
- [x] Week ends on Sunday.
- [x] Missing days are ignored.
- [x] Missing metric values are ignored per metric.
- [x] Weekly averages are calculated correctly.
- [x] Current partial week is compared against previous full week.
- [x] Percentage metrics use percentage points for absolute difference.
- [x] Direction uses documented stable thresholds for weight, body fat mass, and muscle mass.
- [x] Unit tests cover week boundaries, missing values, averages, stable thresholds, and comparison rules.

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
