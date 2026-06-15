# T-027 — Apply Radix UI to Existing Components

## Status

To Do

## Description

Migrate existing V1 frontend UI components to Radix UI / Radix Themes components where Radix provides useful accessible behavior or structure.

This task exists because Radix UI / Radix Themes was selected during the measurement history table refactor, but that refactor should apply Radix only to history-table-related changes.

## Why

This task keeps component-library adoption deliberate and prevents the history table refactor from expanding into an app-wide UI rewrite.

## Scope

- Review existing frontend components after the history table refactor lands.
- Apply Radix UI / Radix Themes components to suitable existing components such as dialogs, forms, buttons, and other interactive controls.
- Keep the current dark, mobile-first visual direction.
- Preserve all visible `pt-BR` copy.
- Keep component changes small and behavior-preserving unless the selected component requires a minor accessibility improvement.
- Update or add tests for any changed interactive behavior.

## Out of Scope

- Do not redesign the app.
- Do not change product behavior.
- Do not add charts, multi-user behavior, Google Sheets integration, offline-first behavior, or Vercel compatibility.
- Do not refactor the measurement history table in this task if that refactor has already been completed separately.
- Do not migrate components that do not benefit from Radix components.

## Validation

Run the relevant automated checks for the changed area. If automated coverage is not practical yet, record the manual validation performed in this task.

## Acceptance Criteria

- [ ] Existing UI components that benefit from Radix components are identified.
- [ ] Selected components use Radix UI / Radix Themes components.
- [ ] Existing visual direction is preserved.
- [ ] Existing product behavior is preserved.
- [ ] Relevant E2E or component-level tests are updated.
- [ ] No unrelated UI redesign is introduced.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
