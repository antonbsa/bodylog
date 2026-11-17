# T-017 — Implement Measurement List

## Status

Done

## Description

Implement the dashboard measurement history list backed by `GET /api/measurements`.

The list is part of the authenticated dashboard, shows recent measurements in
date-descending order, includes raw and derived values, and supports loading 20
more records at a time.

## Implementation Plan

- Add `GET /api/measurements` with `limit` and `offset` query support.
- Return derived values for each listed measurement using the configured user height.
- Add a frontend measurement-list API helper.
- Add a dashboard history section with loading, empty, error, populated, and load-more states.
- Wire each history row edit action to the existing measurement form by date.
- Expose a non-destructive delete action entry point for T-018.
- Refactor history into a literal table with `Data` as the first column and `Ações` as the last column.
- Use Radix UI / Radix Themes only for the history-table component in this task.
- Add API and E2E coverage for list behavior and rendering states.

## Why

This task advances BodyLog V1 during the Measurement CRUD phase.

## Scope

Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.

## Out of Scope

Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.

## Validation

Run the relevant automated checks for the changed area. If automated coverage is not practical yet, record the manual validation performed in this task.

Automated checks:

- `npm run typecheck`
- `npm run lint`
- `npm run test:api`
- `npm run test:e2e`
- `npm run build:web`

Focused checks also run while implementing:

- `npm run test:e2e -- measurement-list.spec.ts`

Validation notes:

- API tests cover measurement listing by descending date, pagination, derived values, invalid list query parameters, and repository list filters.
- E2E tests cover populated, empty, and error history states.
- E2E tests cover the initial 20-row table view, loading 20 more, raw values, derived values, missing optional values, edit action, and visible delete action.
- E2E tests assert the history is a table with `Data` as the first column and `Ações` as the last column.
- Delete is intentionally non-destructive in this task. Confirmation, actual deletion, list refresh after deletion, and dashboard recalculation remain in T-018.

## Implementation Notes

- Added authenticated `GET /api/measurements`.
- Added repository list options for `from`, `to`, `limit`, and `offset`.
- The frontend requests `visibleLimit + 1` rows so it can detect whether a "Carregar mais" action should be shown without changing the documented response shape.
- The measurement form now accepts an optional initial date so list rows can open existing measurements for editing.
- History now renders as a compact literal table instead of card rows.
- Added `@radix-ui/themes` to the web workspace and used the Radix Themes `Table` component only for the history table.
- Recorded Radix UI as the selected component library in ADR `0026` and created T-027 for applying Radix to other existing UI components later.

## Modified Files

- `apps/web/package.json`
- `apps/api/src/index.ts`
- `apps/api/src/measurements/measurement-repository.ts`
- `apps/web/src/api/measurements.ts`
- `apps/web/src/screens/AuthenticatedApp.tsx`
- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `apps/web/src/screens/components/MeasurementHistoryTable.tsx`
- `apps/web/src/screens/components/MeasurementForm.tsx`
- `apps/web/src/styles.css`
- `docs/product/ui-direction.md`
- `docs/technical/decisions/0026-use-radix-ui-components.md`
- `package-lock.json`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-017-implement-measurement-list.md`
- `specs/v1/tasks/t-027-apply-radix-ui-to-existing-components.md`
- `specs/v1/open-questions.md`
- `tests/api/auth.test.ts`
- `tests/api/measurement-api.test.ts`
- `tests/api/measurement-repository.test.ts`
- `tests/api/weekly-dashboard-api.test.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/measurement-form.spec.ts`
- `tests/e2e/measurement-list.spec.ts`
- `tests/e2e/tooling.spec.ts`

## Acceptance Criteria

- [x] Measurements listed by date descending.
- [x] Initial history view shows 20 records and can load 20 more when more exist.
- [x] Raw values shown.
- [x] Derived values shown when possible.
- [x] Missing optional values handled clearly.
- [x] Edit action available.
- [x] Delete action available.
- [x] E2E or component-level tests cover list rendering states.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
