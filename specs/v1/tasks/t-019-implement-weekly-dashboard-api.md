# T-019 — Implement Weekly Dashboard API

## Status

Done

## Description

Implement the protected weekly dashboard API endpoint for the current partial
week and previous full week comparison.

## Implementation Plan

- Add a small dashboard service that loads measurements through the repository
  and delegates weekly calculations to the existing weekly logic.
- Add `GET /api/dashboard/weekly` to the Hono API.
- Use the configured `USER_HEIGHT_CM` value for derived averages.
- Use the current runtime date as the current dashboard date.
- Add an API test that covers week summaries, measurement counts, partial-week
  metadata, and variation output.

## Why

This task advances BodyLog V1 during the Weekly Dashboard phase.

## Scope

Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.

## Out of Scope

Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.

## Validation

Automated checks:

- `npm run test:api`
- `npm run typecheck`
- `npm run lint`

Validation notes:

- Added API coverage for the authenticated `GET /api/dashboard/weekly` route.
- The test pins the current date to `2026-06-10` and verifies current week
  summary, previous week summary, variation values, measurement counts, and
  partial-week metadata.

## Implementation Notes

- Added `getWeeklyDashboard` to compose repository data with the existing weekly
  comparison logic.
- Added `getCurrentDateOnly` so the route consistently passes a `YYYY-MM-DD`
  current date into the weekly logic.
- The endpoint uses `MeasurementRepository.list()` and the existing protected
  `/api/dashboard` route prefix.

## Modified Files

- `apps/api/src/dashboard/weekly-dashboard-service.ts`
- `apps/api/src/index.ts`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-019-implement-weekly-dashboard-api.md`
- `tests/api/weekly-dashboard-api.test.ts`

## Acceptance Criteria

- [x] Returns current week summary.
- [x] Returns previous week summary.
- [x] Returns variation object.
- [x] Includes measurement counts.
- [x] Indicates partial current week.
- [x] Provides enough week date and count data for the UI to derive registration reliability.
- [x] API or service tests cover dashboard summary and variation output.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
