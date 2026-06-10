# T-013 — Implement Login

## Status

Done

## Description

Implement the first authentication slice for V1: a `pt-BR` login screen, a password-backed API login endpoint, and signed session cookie creation.

## Implementation Plan

- Add API auth configuration for `APP_PASSWORD` and `SESSION_SECRET`.
- Add small session helpers for creating and validating signed session cookie values.
- Add `POST /api/auth/login` using the configured password and returning `INVALID_PASSWORD` for invalid attempts.
- Add the login screen in the existing React app without selecting a component library.
- Cover backend login behavior with API tests and the screen flow with Playwright.

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

- Backend tests cover invalid password handling and valid login session cookie creation.
- E2E tests cover the login screen, invalid password error, and opening the app after a valid login response.
- Local proxy smoke checks confirmed `POST /api/auth/login` through Vite returns `401` for an invalid password and `200` plus a session cookie for the local `dev-password`.
- The login screen uses the existing CSS direction without selecting a component library.

## Modified Files

- `.env.example`
- `README.md`
- `apps/api/src/auth/session.ts`
- `apps/api/src/config.ts`
- `apps/api/src/index.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/env.d.ts`
- `apps/web/src/styles.css`
- `apps/web/vite.config.ts`
- `docs/technical/deployment.md`
- `eslint.config.mjs`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-013-implement-login.md`
- `tests/api/auth.test.ts`
- `tests/api/config.test.ts`
- `tests/e2e/tooling.spec.ts`

## Acceptance Criteria

- [x] Login screen created.
- [x] Login endpoint created.
- [x] Password read from secret/environment.
- [x] Invalid password returns clear error.
- [x] Valid login creates session.
- [x] Login behavior is covered by backend tests and E2E coverage for the screen flow.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
