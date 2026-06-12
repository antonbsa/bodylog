# T-020 — Implement Dashboard UI

## Status

Done

## Description

Implement the authenticated weekly dashboard UI using the existing
`GET /api/dashboard/weekly` endpoint.

## Implementation Plan

- Add a small frontend dashboard API client for the weekly dashboard response.
- Replace placeholder summary cards with current week average cards for weight,
  body fat, and muscle.
- Display variation, up/down/stable direction, V1 expected-outcome colors,
  registration reliability, and the partial-week notice.
- Keep the measurement form action as the primary dashboard action.
- Add E2E coverage for the authenticated dashboard display using mocked API
  responses.

## Why

This task advances BodyLog V1 during the Weekly Dashboard phase.

## Scope

Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.

## Out of Scope

Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.

## Validation

Run the relevant automated checks for the changed area. If automated coverage is not practical yet, record the manual validation performed in this task.

Automated checks:

- `npm run typecheck`
- `npm run lint`
- `npm run test:e2e`
- `npm run build`

Validation notes:

- Added E2E coverage for authenticated weekly dashboard rendering with mocked
  summary, variation, direction, partial-week, and reliability data.
- Existing authenticated E2E specs now mock the dashboard endpoint so they
  continue to test their own flows without a real API server.

## Implementation Notes

- Added a frontend weekly dashboard API client for `GET /api/dashboard/weekly`.
- Replaced placeholder summary cards with API-backed current-week cards for
  weight, body fat, and muscle.
- Added V1 expected-outcome color classes for summary card direction states.
- The dashboard refreshes after a measurement is saved from the modal form.
- Extracted shared number formatting/parsing helpers and dashboard summary
  presentation helpers to keep component files focused on rendering.

## Modified Files

- `apps/web/src/api/dashboard.ts`
- `apps/web/src/screens/AuthenticatedApp.tsx`
- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/screens/components/MeasurementForm.tsx`
- `apps/web/src/utils/dashboard-summary.ts`
- `apps/web/src/utils/date-format.ts`
- `apps/web/src/utils/number-format.ts`
- `specs/v1/tasks/t-020-implement-dashboard-ui.md`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/measurement-form.spec.ts`
- `tests/e2e/tooling.spec.ts`

## Acceptance Criteria

- [x] Dashboard is initial authenticated screen.
- [x] Shows weekly average cards.
- [x] Shows variation cards.
- [x] Shows up/down/stable indicators.
- [x] Uses V1 expected-outcome color semantics.
- [x] Shows registration reliability.
- [x] Shows partial week notice.
- [x] Has button to register measurement.
- [x] Mobile-first layout.
- [x] E2E tests cover the authenticated dashboard display.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
