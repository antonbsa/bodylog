# 0008 — Use Date Form Create-or-edit Behavior

## Status

Accepted

## Context

The user should not need to think about whether a date already exists before entering data.

## Decision

When a selected date already has a record, the form loads that record for editing. When the selected date has no record, the form is empty for creation.

## Consequences

The API should support upsert-by-date behavior. The frontend must check or load the selected date before editing.
