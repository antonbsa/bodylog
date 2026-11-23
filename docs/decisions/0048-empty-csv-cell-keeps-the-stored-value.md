---
status: Accepted
area: product
amends: ["0043"]
---

# 0048 — Empty CSV Cell Keeps the Stored Value

## Status

Accepted

## Context

ADR 0043 made an empty cell in a present column clear the stored field. A spreadsheet or an agent leaves a cell empty for "unknown" far more often than for "erase this", so a routine import could wipe data the user had already logged, and the preview doesn't show it.

## Decision

- **Empty means keep.** An imported row replaces only the fields whose cell has a value; an empty cell keeps the stored value of that date, like an absent column. This replaces the "an empty cell clears the field" part of the field-preserving overwrite in 0043.
- **Weight.** An empty `weight_kg` on a date that already has a record keeps the stored weight; on a new date the row is invalid, because weight is required.

## Consequences

- Clearing a field is only possible through the form; the import can no longer clear one.
- The importer needs the user's recorded dates to validate a row with an empty weight, so the preview and the import read them before analyzing the file.
- Everything else in 0043 stands.
