# T-018 — Implement Delete Confirmation

## Status

Done

## Description

Implement measurement deletion from the dashboard history table.

The user must confirm before deletion. After deletion succeeds, the removed
measurement must disappear from the history table and the weekly dashboard must
refresh so summaries and comparisons reflect the deleted record.

Deletion from the measurement form is intentionally out of scope for this task.

## Implementation Plan

- Add the authenticated `DELETE /api/measurements/:id` route.
- Add a frontend delete API helper.
- Wire the history table delete action to a Radix AlertDialog confirmation flow.
- Refresh the history list and weekly dashboard after successful deletion.
- Add API and E2E coverage for successful deletion and confirmation behavior.

## Why

This task advances BodyLog V1 during the Measurement CRUD phase.

## Scope

Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.

## Out of Scope

Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.
Do not add deletion from the measurement form in this task.

## Validation

Automated checks:

- `npm run typecheck`
- `npm run lint`
- `npm run test:api`
- `npm run test:e2e`
- `npm run build:web`
- `git diff --check`

Focused checks also run while implementing:

- `npm run test:api -- measurement-api.test.ts`
- `npm run test:e2e -- measurement-list.spec.ts`

Validation notes:

- API tests cover successful authenticated deletion and missing-record deletion.
- E2E tests cover cancelling the confirmation modal, confirming deletion, the row disappearing from the history table, the success message, and dashboard refresh.
- Deletion is intentionally available from the history table only. Form-context deletion remains deferred.

## Modified Files

- `apps/api/src/index.ts`
- `apps/web/src/api/measurements.ts`
- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `apps/web/src/screens/components/DeleteConfirmationDialog.tsx`
- `apps/web/src/screens/components/MeasurementHistoryTable.tsx`
- `apps/web/src/styles.css`
- `docs/product/requirements.md`
- `docs/product/ui-direction.md`
- `docs/product/user-flows.md`
- `specs/v1/tasks/t-018-implement-delete-confirmation.md`
- `tests/api/measurement-api.test.ts`
- `tests/e2e/measurement-list.spec.ts`

## Acceptance Criteria

- [x] User must confirm before deletion.
- [x] Deleted record disappears from list.
- [x] Dashboard recalculates after deletion.
- [x] E2E tests cover delete confirmation and resulting UI update.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
