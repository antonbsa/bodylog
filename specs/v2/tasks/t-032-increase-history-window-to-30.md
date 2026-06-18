# T-032 — Increase History Window to 30 Items

## Status

To Do

## Description

Show 30 history items (roughly one month of daily records) before the "Carregar
mais" (load more) control appears. The initial visible window is currently 20.

Current value: `HISTORY_PAGE_SIZE = 20`
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

- `npm run typecheck`
- `npm run lint`
- `npm run test:web`
- `npm run build`
- `git diff --check`

Manual validation:

- The history list shows 30 items before "Carregar mais" appears.
- "Load more" still reveals additional items beyond 30.

## Acceptance Criteria

- [ ] History shows 30 items before "Carregar mais" appears.
- [ ] "Load more" continues to work beyond the first 30 items.
- [ ] All listed automated checks pass.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
