# T-035 — Structured Error Handling

## Status

Done

## Description

Introduce a consistent, structured error-handling approach across the project
(API + frontend), modeled on the reference implementation the owner maintains.

Today the API returns ad hoc inline JSON like `{ ok: false, error:
"INVALID_PASSWORD" }`, `{ error: "UNAUTHENTICATED", ok: false }`, `{ item: null }`
(404), etc. (multiple sites in `apps/api/src/index.ts`), and the frontend throws
bare `Error("...")` strings (e.g. `apps/web/src/api/measurements.ts`,
`dashboard.ts`, `auth.ts`).

Reference pattern (private repo `antonbsa/clone-tabnews`, `infra/errors.js`,
read via `gh api repos/antonbsa/clone-tabnews/contents/infra/errors.js --jq
.content | base64 -d`): a set of **custom error classes** each carrying `name`,
`message`, `action`, and `statusCode`, with a `toJSON()` that serializes exactly
those four fields. Classes include `InternalServerError` (500), `ServiceError`
(503), `MethodNotAllowedError` (405), `ValidationError` (400), and
`NotFoundError` (404). Construction takes an options object
(`{ cause, message, action }`) so callers can override message/action while
keeping a consistent shape and status code.

## Why

Scattered, inconsistent error shapes make the frontend guess at error handling
and force generic messages. A single structured contract (`name`, `message`,
`action`, `statusCode`) lets the API serialize every error the same way and lets
the frontend surface a real message + suggested action. T-038's "complete error
description, expandable for details" failure toasts build directly on this shape.

## Scope

- Analyze the error types/shapes across the project (frontend + API) and
  document the mapping.
- Add a shared `errors` module at `infra/errors.ts` exposing typed error
  classes (or discriminated-union factories) with a consistent serialized shape
  (`name`, `message`, `action`, `statusCode`).
- Add an API error handler (Hono `onError` / try-catch boundary) that converts
  thrown structured errors into the consistent JSON response + status code, and
  maps unexpected errors to an internal-server-error shape.
- Replace every existing ad hoc API error payload (`{ ok: false, error: "..." }`,
  `{ item: null }`, etc.) with the structured shape — a full replace, not an
  additive/parallel format. No release has shipped yet, so there is no backward
  compatibility constraint; update every caller and test that depended on the
  old shapes so the app keeps working end-to-end.
- Update the frontend API layer to parse the structured error shape and expose
  `message` / `action` to screens, replacing bare `Error("...")` strings.

## Out of Scope

- Do not change the data-route **success** response shapes (errors only).
- Do not build the toast UI (that is T-038; this task provides the error shape
  it consumes).
- Do not add logging/telemetry pipelines, multi-user behavior, or any unrelated
  feature.

## Dependencies

- **T-033 (`infra/` restructure)** creates the `infra/errors.ts` location. The
  shared error definitions are the natural occupant of that location.

## Assumptions

- The structured-error envelope **fully replaces** the existing ad hoc error
  payloads — confirmed by the owner, since no release has shipped and backward
  compatibility is not a concern. Implement whatever change is needed across API
  and frontend callers to keep the app working with the new shape end-to-end.
- Shared TypeScript error source lives directly in `infra/errors.ts`, included
  via a tsconfig that covers `infra/` — confirmed by the owner.

## Validation

Run the relevant automated checks:

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run test:api` — passed, 8 files / 65 tests.
- `npm run test:web` — blocked: this repository does not define a
  `test:web` script.
- `npm run build` — passed.
- `git diff --check` — passed.

Manual validation:

- An intentionally triggered invalid login via `npx tsx -e '...'` returned
  HTTP 401 with `{"action":"Verifique a senha configurada e tente
novamente.","message":"Senha inválida.","name":"UnauthorizedError","statusCode":401}`.
- The frontend API layer now parses structured API errors into `ApiError`, and
  the login, measurement form, dashboard, history, export, and import surfaces
  display the structured `message` / `action` text.
- Follow-up consolidation: all project error declarations and error helpers now
  live in `infra/errors.ts`; the frontend API client only owns the fetch wrapper.

## Implementation Notes

- Added `infra/errors.ts` locally because this parallel worktree is based on
  `main` and does not include T-033's `infra/` setup yet.
- Kept the T-035 overlap with T-033 limited to creating `infra/errors.ts`; this
  branch does not move migrations, local-db scripts, or shared domain types.
- Replaced API error responses from auth, protected-route guard, measurement
  validation, missing measurement lookup/delete, and CSV import validation with
  thrown structured errors handled by Hono `app.onError`.
- Kept data-route success response shapes unchanged, including partial CSV
  import success summaries with row-level `errors`.
- Moved `ApiError` and `CsvImportError` declarations into `infra/errors.ts` so
  error classes have a single source of import.
- Moved `parseApiError`, `createFallbackApiError`, `throwApiError`, and
  `formatApiErrorMessage` into `infra/errors.ts` so callers import all
  error-related behavior from the same module.
- Renamed the API CSV row validation type from `CsvImportError` to
  `CsvImportRowIssue` to avoid a non-throwable row issue looking like a project
  error declaration.
- Updated frontend API callers to parse structured errors and expose
  `message` / `action`; no toast UI was added.
- Updated API tests and E2E mocks that depended on the old ad hoc error
  envelope.

## Modified Files

- `infra/errors.ts`
- `apps/api/src/index.ts`
- `apps/api/src/measurements/csv-import.ts`
- `apps/web/src/api/client.ts`
- `apps/web/src/api/auth.ts`
- `apps/web/src/api/dashboard.ts`
- `apps/web/src/api/measurements.ts`
- `apps/web/src/screens/LoginScreen.tsx`
- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `apps/web/src/screens/components/MeasurementForm.tsx`
- `specs/v2/implementation-plan.md`
- `specs/v2/open-questions.md`
- `specs/v2/tasks/README.md`
- `specs/v2/tasks/t-033-restructure-infra-folder.md`
- `tests/api/auth.test.ts`
- `tests/api/measurement-api.test.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/measurement-list.spec.ts`
- `tests/e2e/tooling.spec.ts`

## Acceptance Criteria

- [x] A shared structured-error module exists with typed error classes/factories
      exposing `name`, `message`, `action`, `statusCode` and a stable serialized
      shape.
- [x] The API serializes thrown errors via a central handler into that shape +
      status code, mapping unexpected errors to an internal-server-error shape.
- [x] The frontend API layer parses the structured shape and exposes
      `message` / `action` to screens.
- [x] Every ad hoc API error payload is replaced by the structured shape (no
      parallel/legacy error format remains).
- [x] Existing data-route success response shapes are unchanged.
- [ ] All listed automated checks pass. `test:web` is not available in
      `package.json`; all defined listed checks pass.

## Definition of Done

- [x] Acceptance criteria are met, except `test:web` cannot run because the
      script does not exist.
- [x] Implementation matches the approved spec or plan.
- [x] Relevant docs or specs were updated when needed.
- [x] Tests or manual validation were completed.
- [x] No unrelated changes were introduced.
- [x] Task notes include validation results.
