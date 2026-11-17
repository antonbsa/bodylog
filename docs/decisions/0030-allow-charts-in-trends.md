---
status: Accepted
area: web
supersedes: ["0022"]
---

# 0030 — Allow Charts in Trends

## Status

Accepted

## Context

V1 avoided charts to stay small, and `0022-decide-v1-ui-direction.md` recorded that. Weekly averages answer "how is this week", but not "where is the longer trend going", which the owner wants to see in the app. The mobile redesign has a dedicated screen for it.

## Decision

Allow charts, limited to a Tendências screen.

- One line chart at a time, with the metric chosen in a selector.
- Periods: 14 days, 30 days, 90 days, 1 year, all. Fourteen days is the shortest window considered a meaningful trend.
- Daily points are drawn discreetly in a neutral tone and the weekly average line is emphasized with the accent color.
- No "ideal" bands or targets, and no interpretation of the line.

## Consequences

The "no charts" rule in `0022-decide-v1-ui-direction.md` and `docs/product.md` no longer applies. Charts elsewhere (Início, Histórico) are still not part of the direction.

Trend analysis stays descriptive: the app shows data and neutral variation, never judgment (see `0031-use-neutral-variation-color.md`).
