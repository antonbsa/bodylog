# T-030 — API Status / Health / Not-Found Pages

## Status

To Do

## Description

Rework the API's status/health surface and add a frontend not-found page.

Today the API health response leaks a service identity and the frontend has no
fallback page for unknown routes. This task:

- removes the `service: "bodylog-api"` field from the health response
  (`apps/api/src/index.ts:178`) and the `x-bodylog-api: ok` middleware header
  (`apps/api/src/index.ts:172`);
- adds a public root route `GET /` returning `200` with
  `{ ok: true, health: <api_endpoint_health> }` (no `/` route exists today; Hono
  currently falls through to a default 404);
- moves the existing health endpoints off the `/api` prefix —
  `GET /api/health` (`apps/api/src/index.ts:175`) → `GET /health` and
  `GET /api/health/d1` (`apps/api/src/index.ts:182`) → `GET /health/d1` — and
  enriches the health payload with cheap, non-secret signals;
- adds a default frontend not-found page for unknown routes, with a single
  button that redirects to `/`. The frontend has **no router** today
  (`apps/web/src/App.tsx` switches only on auth state), so this introduces
  minimal client-side routing (see Assumptions).

## Why

The `service`/`x-bodylog-api` identifiers expose deployment internals to
unauthenticated callers with no product value. A predictable root + health
contract makes uptime/monitoring checks straightforward, and a not-found page
gives users a clear path back instead of a blank or broken screen. Doing this
before the T-036 redesign avoids reworking the API entry point and frontend
shell twice.

## Scope

- Remove `service: "bodylog-api"` from the health response and the
  `c.header("x-bodylog-api", "ok")` middleware header.
- Add `GET /` (public, unauthenticated) returning `200` with:

  ```json
  {
    "d1": true,
    "health": "https://api.bodylog.antonbsa.dev/health"
  }
  ```

  where `d1` is a boolean D1 connectivity check and `health` is the absolute URL
  of the relocated `/health` endpoint, built from the API's own base URL (the
  same value the frontend reads as `VITE_API_BASE_URL` —
  `apps/web/src/env.d.ts:4`, `apps/web/src/api/client.ts:1` — so the API needs
  its own configured base URL, e.g. an environment variable, to construct this
  absolute link).
- Move `GET /api/health` → `GET /health` and `GET /api/health/d1` →
  `GET /health/d1`, kept public. Confirm the `/api/*` auth and CORS middleware
  still behave for the remaining data routes after the move.
- Enrich the `/health` payload with cheap, non-secret signals (at minimum D1
  connectivity; consider configured time zone and schema/migration
  reachability).
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

- Health endpoints move to top-level `/health` and `/health/d1` and stay fully
  public/unauthenticated. **Resolved.**
- `GET /` returns exactly `{ d1: boolean, health: string }` — confirmed by the
  owner. The exact extra fields (if any) inside `/health` itself beyond `d1`
  remain at the implementer's discretion, kept cheap and secret-free.
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

- `GET /` returns `200` with `{ d1: boolean, health: "<absolute /health URL>" }`.
- `GET /health` and `GET /health/d1` respond; `GET /api/health*` no longer
  exists.
- No response includes `service: "bodylog-api"` or the `x-bodylog-api` header.
- An unknown frontend route renders the "404 Not Found" page with a button that
  redirects to `/`; the auth-gated shell still works.

## Acceptance Criteria

- [ ] Health response no longer exposes `service`, and the `x-bodylog-api`
      header is removed.
- [ ] `GET /` returns `200` with `{ d1: boolean, health: string }`, public and
      unauthenticated.
- [ ] Health endpoints are reachable without the `/api` prefix and carry richer,
      non-secret data; remaining `/api/*` data routes and middleware still work.
- [ ] Unknown frontend routes render a default "404 Not Found" page with a
      single button that redirects to `/`, without breaking the auth-gated
      shell.
- [ ] Existing data-route API behavior and response shapes are unchanged.
- [ ] All listed automated checks pass.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
