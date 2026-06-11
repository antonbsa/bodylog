# T-015 — Implement Logout

## Status

Done

## Description

Implement the logout endpoint and UI action for ending the current single-user session.

## Implementation Plan

- Add `POST /api/auth/logout` that clears the `bodylog_session` cookie.
- Add a frontend logout API function next to the existing login call.
- Add a visible logout action to the authenticated app placeholder.
- Return the user to the login screen after a successful logout.
- Cover backend cookie clearing and the frontend logout flow with automated tests.

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
- `npm run test:e2e`
- `npm run build:web`

Notes:

- Backend tests cover logout response and session cookie clearing.
- E2E tests cover returning to the login screen after logout.

## Modified Files

- `apps/api/src/index.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/api/auth.ts`
- `apps/web/src/screens/AuthenticatedApp.tsx`
- `apps/web/src/styles.css`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-015-implement-logout.md`
- `tests/api/auth.test.ts`
- `tests/e2e/tooling.spec.ts`

## Acceptance Criteria

- [x] Logout endpoint created.
- [x] Logout clears session.
- [x] User returns to login screen.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
