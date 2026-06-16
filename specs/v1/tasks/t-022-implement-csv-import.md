# T-022 — Implement CSV Import

## Status

Done

## Description

Implement authenticated CSV import for BodyLog measurement backups and
canonical spreadsheet-style measurement CSV files.

The import accepts the canonical BodyLog headers with or without audit
timestamps:

```txt
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,created_at,updated_at
```

```txt
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal
```

When `created_at` or `updated_at` are omitted or empty, the API uses the
current import timestamp for that value.

## Implementation Plan

- Add CSV parsing and row validation for the two supported canonical header
  shapes.
- Add import-specific repository upsert behavior that uses `date` as the key.
- Preserve provided `created_at` and `updated_at` values when valid; otherwise
  use the current import timestamp.
- Add `POST /api/import/csv` as an authenticated multipart upload endpoint.
- Return created, updated, skipped, and row-level error details.
- Add a dashboard import action with loading, error, and summary states.
- Add automated coverage for valid import, invalid headers, invalid rows, and
  upsert-by-date behavior.

## Why

This task advances BodyLog V1 during the CSV Import phase.

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

- API tests cover valid full import, minimal import with timestamp fallback,
  invalid headers, invalid rows, and upsert by date.
- E2E coverage verifies the dashboard CSV import action posts a file and shows
  the import summary.
- The serial E2E suite initially caught a regression where import refresh reused
  the delete refresh key and cleared the delete success message. The refresh keys
  are now separated and the full serial E2E suite passes.
- Follow-up validation corrected import failure semantics: imports that validate
  zero rows now return `400`, and the dashboard displays a descriptive alert
  instead of a green success message.
- Follow-up review fixed CSV import date validation so impossible calendar dates
  are rejected before upsert.
- Local CSV testing clarified numeric format support: import accepts quoted
  decimal-comma numeric values, but rejects unquoted decimal-comma rows because
  they break CSV column counts.
- The project still has known unrelated default parallel E2E flakiness from
  earlier validation; this task validated E2E with `--workers=1`.

## Implementation Notes

- Added a CSV import service that accepts the full canonical export format and
  the minimal canonical format.
- Missing or empty `created_at` and `updated_at` values are set to the current
  import timestamp.
- Added import-specific repository upsert behavior keyed by `date`.
- Added `POST /api/import/csv` as an authenticated multipart upload endpoint.
- Added an `Importar CSV` dashboard action with loading, error, and summary
  states.
- Fully failed imports render as an alert. Partial imports with row-level errors
  also render as an alert, while clean imports use the success message.
- Import validates dates as real calendar dates, not only `YYYY-MM-DD` string
  shapes.
- Import accepts quoted decimal-comma numeric values and rejects unquoted
  decimal-comma rows.
- Kept spreadsheet-specific alternate header mapping out of V1 until a real CSV
  sample is available.

## Modified Files

- `apps/api/src/index.ts`
- `apps/api/src/measurements/csv-import.ts`
- `apps/api/src/measurements/measurement-repository.ts`
- `apps/api/src/measurements/types.ts`
- `apps/web/src/api/measurements.ts`
- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `docs/technical/api.md`
- `specs/v1/open-questions.md`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-022-implement-csv-import.md`
- `tests/api/measurement-api.test.ts`
- `tests/e2e/dashboard.spec.ts`

## Acceptance Criteria

- [x] Upload endpoint accepts CSV file.
- [x] Headers are validated.
- [x] Rows are validated.
- [x] Records are upserted by date.
- [x] Import summary is returned.
- [x] Invalid rows are reported.
- [x] UI has import action.
- [x] Automated tests cover valid import, invalid rows, and upsert by date.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
