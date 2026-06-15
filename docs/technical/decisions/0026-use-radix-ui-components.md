# 0026 — Use Radix UI Components

## Status

Accepted

## Context

BodyLog V1 needs small, accessible UI components without turning the frontend into a large design-system project.

The measurement history implementation also needs to be refactored from spacious card-like rows into a compact literal table with date as the first column and actions as the last column.

## Decision

Use Radix UI / Radix Themes components as the V1 component library.

Apply Radix first only where it is needed for the measurement history table refactor. The initial table refactor uses `@radix-ui/themes` and the Radix Themes `Table` component, which renders semantic table structure.

Create a separate V1 task to migrate the other existing app UI components to Radix components after the history table refactor is accepted.

## Consequences

- The history table refactor introduces the first Radix dependency.
- Other app surfaces should not be migrated opportunistically during the history table change.
- Future component work should prefer Radix components where they provide accessible behavior or useful structure, while keeping styling aligned with the existing dark, mobile-first UI direction.
