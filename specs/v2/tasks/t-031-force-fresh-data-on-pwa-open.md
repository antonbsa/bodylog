# T-031 — Force Fresh Data on Every PWA Open

## Status

To Do

## Description

Ensure the app loads fresh report/dashboard/history data every time it is
accessed. When the installed PWA is opened it currently keeps showing stale data
and does not refresh automatically.

Important grounding fact: t-007
(`specs/v1/tasks/t-007-configure-basic-pwa.md`) configured a **manifest-only**
PWA. There is **no service worker, Workbox, or offline cache** in the codebase
(verified: no `registerSW` / `navigator.serviceWorker` usage). The stale data is
therefore **not** a service-worker cache problem; it comes from HTTP/browser
caching of static assets / `index.html` and the app not re-fetching on resume.

> Note: the owner's change requests #2 and #7 describe the same need; this is the
> single task that covers it.

## Why

The daily logging flow must reflect the latest records immediately. Showing
stale data after reopening the installed app undermines trust in the tracker and
forces manual reloads, making it slower than the spreadsheet it replaces.

## Scope

- Re-fetch dashboard / history / weekly data whenever the app/PWA is opened or
  returns to the foreground (e.g. refetch on mount plus on `visibilitychange` /
  `focus` / `pageshow`).
- Ensure API responses are not served from a stale HTTP cache (request data with
  cache-busting / `no-store` semantics as appropriate for the `api()` client in
  `apps/web/src/api/client.ts`).
- Ensure `index.html` is not cached such that a new deploy keeps serving old
  asset references (configure cache headers / no-cache for the HTML entry as
  appropriate for Cloudflare Pages).
- Add a manual "refresh data" affordance (e.g. a button in the dashboard) that
  re-triggers the same fetch as the automatic refetch, as a fallback in case the
  automatic strategy misses a case in practice.
- Keep the change manifest-only.

## Out of Scope

- Do **not** add a service worker, Workbox, offline cache, background sync, or
  any offline-first behavior.
- Do not change API contracts, add multi-user support, charts, Google Sheets
  integration, Postgres migration, or Vercel compatibility.

## Assumptions

- Fresh-data strategy: refetch on mount + `visibilitychange` / `pageshow` /
  `focus`, plus `Cache-Control: no-store` on data requests and no-cache on
  `index.html`; no service worker. **Confirmed by the owner**, with a manual
  refresh button added as a fallback (see Scope).

## Validation

Run the relevant automated checks:

- `npm run typecheck`
- `npm run lint`
- `npm run test:web`
- `npm run build`
- `git diff --check`

Manual validation:

- Reopening the installed PWA (or returning it to the foreground) shows fresh
  data without a manual reload.
- A new deploy is picked up without manually clearing the cache.

## Acceptance Criteria

- [ ] Opening or resuming the PWA reliably loads fresh dashboard/history/weekly
      data.
- [ ] Data requests are not served from a stale HTTP cache.
- [ ] `index.html` is not cached in a way that keeps serving stale asset
      references after a deploy.
- [ ] No service worker or offline behavior was added.
- [ ] A manual "refresh data" affordance is available as a fallback.
- [ ] All listed automated checks pass.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
