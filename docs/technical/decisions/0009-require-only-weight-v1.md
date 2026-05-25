# 0009 — Require Only Weight in V1

## Status

Accepted

## Context

Some measurements may not include every bioimpedance value, but weight is the minimum useful daily metric.

## Decision

Only weight is required in V1.

## Consequences

Optional metrics must accept missing values. Derived calculations and averages must handle `null` values cleanly.
