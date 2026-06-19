# T-031 — Force Fresh Data on Every PWA Open

## Status

Done

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

Automated checks completed:

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test:web`
- [x] `npm run build`
- [x] `git diff --check`

Manual validation status:

- Not performed against an installed PWA or deployed Cloudflare Pages
  environment in this local worktree.
- Automated browser coverage simulates returning to the foreground with a
  `focus` event and verifies dashboard/history data refresh.
- Automated static coverage verifies the Cloudflare Pages `_headers` file
  revalidates `/` and `/index.html`.

## Implementation Notes

- The authenticated app now increments the existing dashboard/history
  `refreshKey` when the window receives `focus`, when `pageshow` fires, or when
  `document.visibilityState` returns to `visible`.
- Resume-triggered refreshes are deduplicated within 500ms so common
  focus/visibility event bursts do not fire duplicate fetches.
- The dashboard header includes a manual `Atualizar dados` button that uses the
  same refresh path.
- The shared web API client now defaults data requests to `cache: "no-store"`.
- Cloudflare Pages receives `apps/web/public/_headers`, copied into `dist/` by
  Vite, to keep the HTML entry revalidated without adding a service worker.
- Added `npm run test:web` as an alias for the existing Playwright web suite so
  the task's requested validation command is available.

## Modified Files

- `apps/web/src/api/client.ts`
- `apps/web/src/screens/AuthenticatedApp.tsx`
- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `apps/web/public/_headers`
- `package.json`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/tooling.spec.ts`
- `specs/v2/tasks/t-031-force-fresh-data-on-pwa-open.md`

## Acceptance Criteria

- [x] Opening or resuming the PWA reliably loads fresh dashboard/history/weekly
      data.
- [x] Data requests are not served from a stale HTTP cache.
- [x] `index.html` is not cached in a way that keeps serving stale asset
      references after a deploy.
- [x] No service worker or offline behavior was added.
- [x] A manual "refresh data" affordance is available as a fallback.
- [x] All listed automated checks pass.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
