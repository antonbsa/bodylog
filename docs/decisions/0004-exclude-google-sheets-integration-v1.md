---
status: Accepted
area: product
---

# 0004 — Exclude Google Sheets Integration from V1

## Status

Accepted

## Context

Google Sheets integration would add external API complexity, authentication concerns, and delivery risk.

## Decision

Do not include automatic Google Sheets integration in V1.

## Consequences

CSV export is the V1 backup mechanism. Automatic spreadsheet sync remains a future idea.
