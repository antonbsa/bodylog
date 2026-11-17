---
status: Accepted
area: product
---

# 0007 — Enforce One Record per Date

## Status

Accepted

## Context

The current workflow is based on one daily measurement under similar conditions.

## Decision

Allow at most one measurement record per date.

## Consequences

The database needs a unique date constraint. The product flow can use date selection as the create-or-edit key.
