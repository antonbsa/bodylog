# 0031 — Use Neutral Variation Color

## Status

Accepted

## Context

`0012-use-neutral-variation-interpretation.md` and `0022-decide-v1-ui-direction.md` colored variations by expected outcome (green for muscle up, red for fat up, and so on). That is a judgment the app cannot make without configurable goals, and it conflicts with the minimal direction of the redesign.

## Decision

Show every variation in one neutral tone: an arrow plus text ("Subiu", "Caiu", "Estável") and the magnitude in a neutral chip. Variations are never classified as good or bad, for any metric.

Percentage metrics keep showing changes in percentage points. Other units follow the metric: kg, cm, h, and points for disposição.

Color is reserved for system states (error, focus, primary action and active state through the accent).

## Consequences

The expected-outcome color table in `docs/product/ui-direction.md` (V1) is removed. Up/down/stable direction, factual copy and the ban on health advice from `0012-use-neutral-variation-interpretation.md` remain.

Future configurable goals could change this, but would need a new decision.
