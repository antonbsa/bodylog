---
status: Accepted
area: platform
---

# 0016 — Use Cloudflare D1 as the V1 Database

## Status

Accepted

## Context

The app is a small personal project deployed on Cloudflare. A native Cloudflare database keeps V1 infrastructure simple.

## Decision

Use Cloudflare D1 as the V1 database.

## Consequences

D1-specific access should stay inside repositories. Migrations must be versioned, and the design should preserve a reasonable path to a later Postgres migration.
