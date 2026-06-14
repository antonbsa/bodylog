# 0026 — Use Radix UI Primitives

## Status

Accepted

## Context

BodyLog V1 needs small, accessible UI primitives without turning the frontend into a large design-system project.

The measurement history implementation also needs to be refactored from spacious card-like rows into a compact literal table with date as the first column and actions as the last column.

## Decision

Use Radix UI primitives as the V1 component library.

Apply Radix first only where it is needed for the measurement history table refactor.

Create a separate V1 task to migrate the other existing app UI components to Radix primitives after the history table refactor is accepted.

## Consequences

- The history table refactor may introduce the first Radix dependency.
- Other app surfaces should not be migrated opportunistically during the history table change.
- Future component work should prefer Radix primitives where they provide accessible behavior, while keeping styling aligned with the existing dark, mobile-first UI direction.
