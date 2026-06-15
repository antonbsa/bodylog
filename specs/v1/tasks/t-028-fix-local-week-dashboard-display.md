# T-028 — Fix Local Week Dashboard Display

## Status

Done

## Description

Fix weekly dashboard date and summary display behavior for single-user local
time.

The dashboard must use the configured user timezone when deriving today's date.
Summary cards represent the latest available current metrics. If the actual
current week has no measurements yet, cards should continue to display the
latest recorded week instead of placeholders. Once the current week has at
least one measurement, cards should display current-week values again.

## Implementation Plan

- Add `USER_TIME_ZONE` API configuration with validation.
- Derive the API dashboard current date using the configured timezone instead
  of UTC.
- Extend weekly dashboard logic with a `display` summary that uses current week
  when it has records, otherwise the latest recorded week.
- Keep `current` and `previous` as calendar-week context.
- Update the dashboard UI to render cards from `display`.
- Add focused API and E2E coverage for the timezone and fallback behavior.

## Validation

Automated checks:

- `npm run typecheck`
- `npm run lint`
- `npm run test:api`
- `npm run test:e2e`
- `npm run build:web`
- `git diff --check`

Validation notes:

- API tests cover configured timezone date derivation, including Sunday night in
  `America/Sao_Paulo` while UTC is already Monday.
- Weekly logic tests cover current-week display when current data exists and
  latest-recorded-week display when the current week is empty.
- E2E tests cover dashboard cards showing latest recorded metrics instead of
  placeholders when the current week has no measurements.

## Modified Files

- `.env.development`
- `README.md`
- `apps/api/src/config.ts`
- `apps/api/src/dashboard/weekly-dashboard-service.ts`
- `apps/api/src/index.ts`
- `apps/api/src/measurements/weekly-logic.ts`
- `apps/web/src/api/dashboard.ts`
- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `apps/web/src/utils/dashboard-summary.ts`
- `docs/product/requirements.md`
- `docs/product/ui-direction.md`
- `docs/technical/api.md`
- `docs/technical/deployment.md`
- `docs/technical/decisions/0027-use-user-time-zone-environment-variable.md`
- `specs/v1/tasks/t-028-fix-local-week-dashboard-display.md`
- `tests/api/auth.test.ts`
- `tests/api/config.test.ts`
- `tests/api/measurement-api.test.ts`
- `tests/api/weekly-dashboard-api.test.ts`
- `tests/api/weekly-logic.test.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/measurement-form.spec.ts`
- `tests/e2e/measurement-list.spec.ts`
- `tests/e2e/tooling.spec.ts`
- `wrangler.toml`

## Acceptance Criteria

- [x] At 22:30 in Brazil on Sunday, the dashboard still uses Sunday as the
      current local date.
- [x] If the current week has no measurements, dashboard cards display the
      latest available metrics instead of `-`.
- [x] Once the current week has measurements, dashboard cards display
      current-week values.
- [x] Current calendar week context remains visible separately from displayed
      metric values.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved behavior
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
