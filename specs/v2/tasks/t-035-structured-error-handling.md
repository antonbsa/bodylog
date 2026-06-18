# T-035 — Structured Error Handling

## Status

To Do

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
- Add a shared `errors` module under `infra/errors/` exposing typed error
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

- **T-033 (`infra/` restructure)** creates the `infra/errors/` location. The
  shared error definitions are the natural occupant of that location.

## Assumptions

- The structured-error envelope **fully replaces** the existing ad hoc error
  payloads — confirmed by the owner, since no release has shipped and backward
  compatibility is not a concern. Implement whatever change is needed across API
  and frontend callers to keep the app working with the new shape end-to-end.
- Shared TypeScript error source lives directly in `infra/errors/`, included via
  a tsconfig that covers that directory (`infra/errors` is both the physical
  location and the documented home) — confirmed by the owner.

## Validation

Run the relevant automated checks:

- `npm run typecheck`
- `npm run lint`
- `npm run test:api`
- `npm run test:web`
- `npm run build`
- `git diff --check`

Manual validation:

- An intentionally triggered API error returns the structured
  `{ name, message, action, statusCode }` shape with the correct status code.
- The frontend surfaces the structured `message` / `action` rather than a
  generic string.

## Acceptance Criteria

- [ ] A shared structured-error module exists with typed error classes/factories
      exposing `name`, `message`, `action`, `statusCode` and a stable serialized
      shape.
- [ ] The API serializes thrown errors via a central handler into that shape +
      status code, mapping unexpected errors to an internal-server-error shape.
- [ ] The frontend API layer parses the structured shape and exposes
      `message` / `action` to screens.
- [ ] Every ad hoc API error payload is replaced by the structured shape (no
      parallel/legacy error format remains).
- [ ] Existing data-route success response shapes are unchanged.
- [ ] All listed automated checks pass.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
