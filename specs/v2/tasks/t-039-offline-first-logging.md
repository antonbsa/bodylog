# T-039 — Offline-first Logging

## Status

To Do

## Description

Make the installed PWA usable when the network is unavailable or slow. After the
app has successfully loaded authenticated data at least once, reopening the PWA
should show the last-known dashboard/history/measurement data immediately,
instead of starting from an empty state. Measurement create/edit/delete actions
should be possible offline and synced when the app reconnects.

This task intentionally comes after T-038 so the offline states can use the
final V2 shell, redesigned components, structured errors, and toast
notifications.

## Why

The daily logging flow should be faster and more resilient than the spreadsheet
workflow it replaces. Offline-first support lets the user open the installed app,
see the previous data, record today's measurement without waiting on the
network, and rely on the app to sync later.

## Scope

- Add an offline-capable PWA app shell using a service worker and Workbox or an
  equivalent small service-worker setup.
- Cache the built frontend assets with a versioned update strategy that does not
  leave users stuck on stale releases.
- Persist last-known authenticated data locally, including dashboard summary,
  weekly data, recent history, and per-date measurement lookups needed by the
  form.
- Hydrate the authenticated UI from local data on cold open before network
  requests finish.
- Keep T-031's online fresh-data behavior: when online, refetch from the API and
  update the local store with the latest server response.
- Add clear offline/stale/pending-sync UI states without classifying body metric
  changes as good or bad.
- Allow measurement create/edit/delete while offline by writing to local storage
  first and queueing the corresponding API mutation.
- Sync queued mutations after reconnecting, on app open/resume, and through
  Background Sync where the platform supports it.
- Preserve the V1 rule of one measurement per date in both the local store and
  the sync queue.
- Add a simple conflict policy for queued measurement changes, document it in
  this task before implementation, and keep the server as the final source of
  truth after sync.
- Add automated tests for local hydration, offline mutation queueing, reconnect
  sync, stale-state display, and service-worker/cache configuration.

## Out of Scope

- Do not add multi-user support, account registration, OAuth, or complex
  authorization.
- Do not add Google Sheets integration.
- Do not add charts, automatic health interpretation, recommendations, or
  goal-based judgment of metric changes.
- Do not migrate from D1 to Postgres.
- Do not implement a native mobile app.
- Do not make offline behavior depend only on Background Sync; unsupported
  platforms must still sync on reconnect/open/resume.

## Assumptions

- Browser local persistence should be treated as sensitive personal data. Prefer
  the smallest durable data set that supports offline display and logging.
- The app remains single-user, so the first conflict policy can be conservative
  and explicit rather than building collaborative merge behavior.
- If the authenticated session expires while offline, queued local changes stay
  pending and sync only after the user is authenticated again.
- Last-known data may be stale while offline; the UI should say that directly
  without blocking reads or local edits.

## Validation

Run the relevant automated checks:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:web`
- `npm run build`
- `git diff --check`

Manual validation:

- Install the PWA, load authenticated data, fully close it, disable network, and
  reopen it. The app shell and last-known data should render.
- While offline, create or edit today's measurement and confirm the UI marks the
  change as pending sync.
- Restore network and confirm the pending change syncs to the API/D1 and the UI
  returns to a synced state.
- Deploy a new frontend build and confirm the service-worker update strategy
  does not keep serving an obsolete app version indefinitely.

## Acceptance Criteria

- [ ] Installed PWA opens offline after a previous successful load.
- [ ] Last-known dashboard/history/weekly data renders on cold open before fresh
      network data is available.
- [ ] Online opens/resumes still refetch fresh API data and update the local
      store.
- [ ] Measurement create/edit/delete can be queued while offline.
- [ ] Queued changes sync after reconnecting or reopening the app online.
- [ ] Pending, stale, synced, and sync-failed states are visible to the user.
- [ ] The one-measurement-per-date rule is preserved locally and after sync.
- [ ] Conflict handling is documented and covered by tests or manual validation.
- [ ] Service-worker asset caching does not trap users on stale deploys.
- [ ] Automated checks pass.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
