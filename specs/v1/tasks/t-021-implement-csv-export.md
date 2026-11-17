# T-021 — Implement CSV Export

## Status

Done

## Description

Implement authenticated CSV export for all measurements from the existing
single-page dashboard.

The V1 export format is:

```txt
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,created_at,updated_at
```

The export intentionally omits the internal `id` field. Import should continue
to use `date` as the V1 upsert key.

## Implementation Plan

- Add a protected `GET /api/export/csv` endpoint.
- Serialize all measurements as CSV using the documented headers.
- Export empty optional values as empty cells.
- Add an authenticated dashboard action that downloads the CSV file.
- Cover exported headers and row values with automated API tests.
- Add focused browser coverage for the dashboard export action.

## Why

This task advances BodyLog V1 during the CSV Export phase.

## Scope

Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.

## Out of Scope

Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.

## Validation

Automated checks:

- `npm run test:api`
- `npm run typecheck`
- `npm run lint`
- `npx playwright test tests/e2e/dashboard.spec.ts --workers=1`
- `npx playwright test --workers=1`
- `npm run build:web`
- `git diff --check`

Validation notes:

- API tests cover the CSV response headers, documented CSV headers, row values,
  empty optional cells, and date-descending order.
- E2E coverage verifies the dashboard export action requests `/api/export/csv`.
- `npm run test:e2e` passed for the new dashboard export test during the second
  full parallel run, but the full parallel suite still failed on unrelated tests
  that remained on the initial loading state. The complete E2E suite passed with
  `npx playwright test --workers=1`.
- An initial mistaken command, `npm run test:api -- --runInBand`, failed because
  Vitest does not support the Jest `--runInBand` flag; `npm run test:api` passed.

## Implementation Notes

- Added a small CSV serializer under the measurements domain.
- Added `GET /api/export/csv` behind the existing protected `/api/export`
  route prefix.
- Added an `Exportar CSV` action to the authenticated dashboard header.
- Kept export manual and browser-driven; no Google Sheets integration was added.
- Updated technical docs to document the CSV endpoint and canonical format.

## Modified Files

- `apps/api/src/index.ts`
- `apps/api/src/measurements/csv-export.ts`
- `apps/web/src/api/measurements.ts`
- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `docs/technical/api.md`
- `docs/technical/database.md`
- `specs/v1/tasks/t-021-implement-csv-export.md`
- `tests/api/measurement-api.test.ts`
- `tests/e2e/dashboard.spec.ts`

## Acceptance Criteria

- [x] Export endpoint returns CSV.
- [x] CSV includes all records.
- [x] CSV uses documented headers.
- [x] UI has export action.
- [x] Automated tests cover exported headers and row values.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
