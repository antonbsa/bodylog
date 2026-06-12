# T-016 — Implement Measurement Form

## Status

Done

## Description

Implement the authenticated measurement form as a dashboard modal, including the API routes required to load and save a measurement by selected date.

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
- `npm run build:web`
- `npm run test:e2e`

Notes:

- API tests cover missing-date lookup, create-by-date, existing-date load/update, and invalid measurement input.
- E2E tests cover creating a measurement from the dashboard form and loading an existing date before saving edits.
- E2E now uses a dedicated static default port, `5174`, so Playwright does not reuse the project owner's normal local dev server on `5173`.

## Implementation Notes

- Added protected `GET /api/measurements/by-date/:date` and `PUT /api/measurements/by-date/:date`.
- Added minimal measurement request validation for required `weightKg`, optional numeric fields, and `YYYY-MM-DD` route dates.
- Added frontend measurement API helpers.
- Added a dashboard action that opens the measurement form.
- Split the authenticated screen into separate screen-local dashboard and measurement form components.
- Added a responsive modal form: full viewport on mobile and constrained on larger screens.
- Date defaults to today, uses `DD/MM/YYYY` in the form, rejects future dates during validation, and loads existing records when the selected date changes.
- Removed placeholders from measurement form inputs.
- Optional numeric fields accept blank values as `null`; decimal inputs accept comma or period separators.
- Successful saves close the modal and show a short status message on the dashboard.
- Kept full weekly dashboard UI, measurement list, and delete confirmation for their dedicated tasks.
- Recorded a future date picker component idea in `docs/product/future-ideas.md`.

## Modified Files

- `apps/api/src/index.ts`
- `apps/web/package.json`
- `apps/web/src/api/measurements.ts`
- `apps/web/src/screens/AuthenticatedApp.tsx`
- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `apps/web/src/screens/components/MeasurementForm.tsx`
- `apps/web/src/screens/components/date-format.ts`
- `apps/web/src/styles.css`
- `docs/product/future-ideas.md`
- `docs/product/ui-direction.md`
- `docs/technical/cross-cutting-concerns.md`
- `playwright.config.ts`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-016-implement-measurement-form.md`
- `tests/api/measurement-api.test.ts`
- `tests/e2e/measurement-form.spec.ts`
- `tests/e2e/tsconfig.json`

## Acceptance Criteria

- [x] Form opens from dashboard.
- [x] Form opens as a full-viewport modal on mobile and a constrained modal on larger screens.
- [x] Date defaults to today.
- [x] User can change date.
- [x] Existing date loads existing record.
- [x] Empty date shows empty fields.
- [x] Only weight is required.
- [x] Save creates or updates by date.
- [x] E2E tests cover create and existing-date edit behavior.


## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
