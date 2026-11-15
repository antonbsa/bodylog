# 0039 — Compute Weekly Variation in the UI

## Status

Accepted

## Context

`GET /api/dashboard/weekly` returned a `variation` map with a `direction` derived from fixed stable thresholds (weight 0.5 kg, body fat mass 0.4 kg, muscle mass 0.3 kg) and a `display` block that fell back to the latest recorded week when the current week was empty. The Início redesign reads only `current` and `previous` and computes the variation chip itself, so both were unused and disagreed with the UI rule.

## Decision

The endpoint returns only `{ current, previous }`, each a weekly summary with averages, counts and `recordedDates`. The UI computes the variation between the two weeks and the "Estável" rule: a change is stable when it rounds to zero at the displayed precision (`docs/product/ui-direction.md`). The fixed thresholds and the latest-recorded-week fallback are removed. Tendências will compute its own comparison over its period.

## Consequences

The API no longer exposes deltas, relative percentages or direction. Percentage metrics are still shown in percentage points by the UI. This supersedes the threshold and `display` fallback rules that were documented in `docs/technical/database.md`, `docs/technical/api.md` and `docs/product/requirements.md`; no earlier ADR defined them.
