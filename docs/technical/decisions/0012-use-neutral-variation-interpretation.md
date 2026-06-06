# 0012 — Avoid Health Interpretation in V1

## Status

Accepted, amended by `0022-decide-v1-ui-direction.md`

## Context

Whether a weight increase or decrease is desirable depends on the user's current goal and context. V1 does not include configurable goal settings.

Muscle increase and body fat decrease are expected to be visually positive for the initial personal V1 use case.

## Decision

In V1, show whether a metric went up, down, or stayed stable.

Use the expected-outcome color semantics documented in `docs/product/ui-direction.md`, while keeping copy factual and short.

Do not add health advice, diagnosis, recommendations, or motivational interpretation in V1.

## Consequences

The UI can use color to make expected movement easier to scan, but it must avoid health, training, or diet recommendations in V1.

Future configurable goal settings may change weight color semantics.
