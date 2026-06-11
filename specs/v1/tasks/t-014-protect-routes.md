# T-014 — Protect Routes

## Status

Done

## Description

Protect the documented V1 data-route prefixes with the signed session cookie created by login.

## Implementation Plan

- Add a small API auth guard that validates the `bodylog_session` cookie using the existing session helper.
- Apply the guard to planned data-route prefixes only: measurements, dashboard, CSV export, and CSV import.
- Keep health and auth endpoints public.
- Cover unauthenticated, invalid-session, and valid-session behavior with API tests.

## Why

This task advances BodyLog V1 during the Authentication phase.

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

Notes:

- Protected route prefixes return `401` with `UNAUTHENTICATED` when no valid session cookie is present.
- Valid session cookies allow requests to continue to the matching route handler. Since the protected data handlers are not implemented yet, authenticated requests currently fall through to `404`.
- Health and auth routes remain public.

## Modified Files

- `apps/api/src/index.ts`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-014-protect-routes.md`
- `tests/api/auth.test.ts`

## Acceptance Criteria

- [x] Measurement API requires authentication.
- [x] Dashboard API requires authentication.
- [x] CSV import/export require authentication.
- [x] Unauthenticated users are redirected or receive 401.
- [x] Protected route behavior is covered by automated tests.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
