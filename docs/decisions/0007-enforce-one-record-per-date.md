---
status: Accepted
area: product
amended-by: ["0044"]
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

## Update — One record per date per user (ADR 0044)

With multi-user accounts the unique constraint is `(user_id, date)`: each user has at most one measurement per date, and two users can record the same date.
