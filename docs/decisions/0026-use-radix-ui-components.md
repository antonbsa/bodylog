---
status: Accepted
area: web
---

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

## Update — Tokens own the visual, Radix keeps behavior (mobile redesign)

Decided in the visual foundation task of the mobile redesign (sub-issue #25).

- The project's own CSS custom properties (`apps/web/src/styles/tokens.css`) define every color, in light and dark. `@radix-ui/themes` stays only for behavior and for the existing components (Button, TextField, Dialog, AlertDialog, Table, Callout, Card, Badge) until each screen is redone in sub-issues #26–#30; they are not migrated in the foundation task.
- The Radix `Theme` follows the resolved theme (`appearance` is `light` or `dark`, including live OS changes in system mode), and its gray and accent scales are pointed at the tokens in `apps/web/src/styles.css`, so old components do not clash with the new ones.
- New foundation components (layout shell, tab bar, page title, placeholders) use plain CSS with the tokens and do not use Radix Themes.
- Routing uses `react-router` (declarative mode) and icons use Phosphor (`@phosphor-icons/react`).
