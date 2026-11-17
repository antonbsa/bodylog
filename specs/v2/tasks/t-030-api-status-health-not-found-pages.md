# T-030 — API Liveness / Not-Found Pages

## Status

Done

## Description

Rework the API's public liveness surface and add a frontend not-found page.

Today the API health response leaks a service identity and the frontend has no
fallback page for unknown routes. This task:

- removes the old `service: "bodylog-api"` field from the former health
  response and the `x-bodylog-api: ok` middleware header;
- adds a public root route `GET /` returning `200` with
  `{ ok: true }` as a lightweight liveness response (no `/` route exists in the
  pre-task API; Hono falls through to a default 404);
- removes the health endpoints instead of replacing them. At this project size,
  a dependency-readiness contract is unnecessary; `GET /` only answers whether
  the Worker can respond;
- adds a default frontend not-found page for unknown routes, with a single
  button that redirects to `/`. The frontend has **no router** today
  (`apps/web/src/App.tsx` switches only on auth state), so this introduces
  minimal client-side routing (see Assumptions).

## Why

The `service`/`x-bodylog-api` identifiers expose deployment internals to
unauthenticated callers with no product value. A predictable root liveness
response makes it easy to know the API is running without adding premature
dependency health semantics. A not-found page gives users a clear path back
instead of a blank or broken screen. Doing this before the T-036 redesign avoids
reworking the API entry point and frontend shell twice.

## Scope

- Remove the old `service: "bodylog-api"` health payload field and the
  `c.header("x-bodylog-api", "ok")` middleware header.
- Add `GET /` (public, unauthenticated) returning `200` with:

  ```json
  {
    "ok": true
  }
  ```

  This is a pure liveness response and does not check D1.

- Remove `GET /api/health` and `GET /api/health/d1` without adding replacement
  `/health` routes. Confirm the old health paths fall through as not found and
  the `/api/*` auth and CORS middleware still behave for the remaining data
  routes after the removal.
- Re-verify the full route table. Routes that must stay under `/api`:
  `/api/dashboard/weekly`, `/api/export/csv`, `/api/import/csv`,
  `/api/measurements`, `/api/measurements/by-date/:date`,
  `/api/measurements/:id`, `/api/auth/login`, `/api/auth/logout`,
  `/api/auth/session`.
- Introduce minimal client-side routing sufficient to render a not-found page
  for unknown paths while preserving the auth-gated dashboard/login flow
  (`apps/web/src/App.tsx`, `apps/web/src/main.tsx`). The not-found page is a
  default "404 Not Found" screen with a single button that redirects to `/`.
  Keep it mobile-first.

## Out of Scope

- Do not start the T-036 visual redesign.
- Do not change the documented data-route response shapes for
  measurements/dashboard/auth.
- Do not add a service worker, offline behavior, multi-user support, charts,
  Google Sheets integration, Postgres migration, or Vercel compatibility.

## Assumptions

- `GET /` returns exactly `{ ok: true }` as a pure liveness response. It does
  not check D1 or return an API health link. **Resolved.**
- No health endpoints remain. If dependency checks are needed later, add a
  dedicated readiness endpoint in a separate task. **Resolved.**
- The not-found page is a default "404 Not Found" screen with a single button
  that redirects to `/`. **Resolved.** Frontend routing still uses the smallest
  viable approach (lightweight history-based switch or a tiny router), not a
  heavy dependency, to enable that page without breaking the auth-gated shell.

## Validation

Run the relevant automated checks:

- `npm run typecheck`
- `npm run lint`
- `npm run test:api`
- `npm run build`
- `git diff --check`

Manual validation:

- `GET /` returns `200` with `{ "ok": true }`.
- `GET /health`, `GET /health/d1`, and `GET /api/health*` do not exist.
- No response includes `service: "bodylog-api"` or the `x-bodylog-api` header.
- An unknown frontend route renders the "404 Not Found" page with a button that
  redirects to `/`; the auth-gated shell still works.

## Acceptance Criteria

- [x] Public API responses no longer expose `service`, and the `x-bodylog-api`
      header is removed.
- [x] `GET /` returns `200` with `{ ok: true }`, public and
      unauthenticated.
- [x] Health endpoints are removed; remaining `/api/*` data routes and
      middleware still work.
- [x] Unknown frontend routes render a default "404 Not Found" page with a
      single button that redirects to `/`, without breaking the auth-gated
      shell.
- [x] Existing data-route API behavior and response shapes are unchanged.
- [x] All listed automated checks pass.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results

## Implementation Notes

- Removed the `x-bodylog-api` middleware response header and the old
  `service: "bodylog-api"` health payload field.
- Added public `GET /` as a pure liveness route returning exactly `{ ok: true }`.
  It does not query D1.
- Removed `/health`, `/health/d1`, `/api/health`, and `/api/health/d1` as public
  health surfaces. Removed the `API_BASE_URL` configuration that only existed to
  build the old health link.
- Added a minimal frontend route switch in `apps/web/src/App.tsx`: `/` keeps the
  auth-gated shell, and every other path renders a mobile-first default
  "404 Not Found" screen with a single button back to `/`.
- Updated API contract/deployment docs, README route references, deployment
  workflow configuration, and local development env configuration.

## Validation Notes

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run test:api` — passed; 8 files, 64 tests.
- `npm run build` — passed.
- `git diff --check` — passed.
- Initial `npm run test:api` failed before dependency installation because
  `node_modules` was missing and `vitest` was not found. Ran `npm install` with
  Node `v24.16.0`, then validation passed. `npm install` reported existing npm
  audit findings; no dependency versions were changed for this task.
- Playwright/E2E was not run locally because the project rule forbids starting
  dev servers/watchers, and Playwright's config starts the Vite dev server. The
  not-found route coverage was added to `tests/e2e/tooling.spec.ts` and was
  typechecked.

## Modified Files

- `.env.development`
- `.github/workflows/deploy.yml`
- `README.md`
- `apps/api/src/index.ts`
- `apps/api/wrangler.toml`
- `apps/web/src/App.tsx`
- `apps/web/src/screens/NotFoundScreen.tsx`
- `apps/web/src/styles.css`
- `docs/technical/api.md`
- `docs/technical/deployment.md`
- `specs/v2/implementation-plan.md`
- `specs/v2/open-questions.md`
- `specs/v2/tasks/t-030-api-status-health-not-found-pages.md`
- `tests/api/auth.test.ts`
- `tests/api/index.test.ts`
- `tests/e2e/tooling.spec.ts`
