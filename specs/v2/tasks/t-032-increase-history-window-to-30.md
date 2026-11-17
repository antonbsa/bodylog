# T-032 — Increase History Window to 30 Items

## Status

Implemented

## Description

Show 30 history items (roughly one month of daily records) before the "Carregar
mais" (load more) control appears. The initial visible window was previously 20.

Current value: `HISTORY_PAGE_SIZE = 30`
(`apps/web/src/screens/components/AuthenticatedDashboard.tsx:41`), used both for
the initial `visibleLimit` and as the "load more" increment.

## Why

Twenty items is under a month; users reviewing recent progress repeatedly hit
"load more" for ordinary monthly context. Thirty aligns the default window with
the natural monthly review cadence.

## Scope

- Change `HISTORY_PAGE_SIZE` from `20` to `30` in
  `apps/web/src/screens/components/AuthenticatedDashboard.tsx`.
- Verify the "load more" increment and the `limit: visibleLimit + 1` look-ahead
  (used to decide whether more items exist) still behave correctly with the new
  value.

## Out of Scope

- Do not change pagination behavior beyond the page-size value.
- Do not add infinite scroll, server-side pagination changes, charts, or any
  other feature.

## Validation

Run the relevant automated checks:

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run test:web` — not run; this branch has no `test:web` script.
- `npm run build` — passed.
- `git diff --check` — passed.

Manual validation:

- Not run in browser. The available Playwright E2E command would start
  `npm --workspace @bodylog/web run dev` through `playwright.config.ts`, and
  local AGENTS.md rules forbid starting dev servers/watchers unless explicitly
  requested.

Automated coverage notes:

- Updated `tests/e2e/measurement-list.spec.ts` so the history-list scenario now
  expects 30 initially visible rows, a 31-item look-ahead request, and a
  61-item look-ahead request after "Carregar mais".
- The focused E2E spec was not executed for the dev-server reason above.

Modified files:

- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `tests/e2e/measurement-list.spec.ts`
- `specs/v2/tasks/t-032-increase-history-window-to-30.md`

## Acceptance Criteria

- [x] History shows 30 items before "Carregar mais" appears.
- [x] "Load more" continues to work beyond the first 30 items.
- [ ] All listed automated checks pass. (`test:web` is unavailable in this
      branch.)

## Definition of Done

- [ ] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
