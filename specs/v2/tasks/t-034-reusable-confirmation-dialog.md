# T-034 — Reusable Confirmation Dialog (Delete + Logout)

## Status

Done

## Description

Generalize the delete-only dialog
(`apps/web/src/screens/components/DeleteConfirmationDialog.tsx`) into a reusable
`ConfirmationDialog` component, and use it for **both** the delete-measurement
flow and a new logout-confirmation flow.

Logout is wired at `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
("Sair") through `onLogout` and currently fires immediately with no
confirmation.

## Why

Logging out is destructive of the current session and is currently one
accidental tap away. A single reusable confirmation component removes the
duplication between delete and any future confirm flow and ensures consistent
behavior and styling (which the T-036 redesign can then style once).

## Scope

- Create a reusable `ConfirmationDialog` component (generalize
  `DeleteConfirmationDialog`: configurable title, description, confirm/cancel
  labels, confirm variant, and an `isConfirming` state).
- Use it for the delete-measurement flow, replacing `DeleteConfirmationDialog`.
- Add a logout confirmation that calls `onLogout` only after the user confirms.

## Out of Scope

- Do not restyle beyond what is needed for parity (the T-036 redesign owns
  visuals).
- Do not change the delete or logout behavior itself beyond adding the
  confirmation step.
- Do not add other confirm flows not requested here.

## Assumptions

- The component is named `ConfirmationDialog` and lives under
  `apps/web/src/screens/components/` (same folder as the current dialog).
  **Confirmed by the owner.**

## Validation

Run the relevant automated checks:

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test:e2e`
- [x] `npm run build`
- [x] `git diff --check`

Manual validation:

- Delete confirmation behavior is covered by the existing E2E flow, now using
  the shared dialog.
- Logout confirmation is covered by E2E assertions for opening, canceling, and
  confirming the dialog; logout is only requested after confirmation.

Notes:

- `npm install` was required first because this dedicated worktree did not have
  `node_modules`; Node `24.16.0` matched `.nvmrc`.
- `npm install` completed with existing dependency deprecation and audit
  warnings.

## Acceptance Criteria

- [x] A reusable `ConfirmationDialog` component exists with configurable
      title/description/labels/confirm variant and an `isConfirming` state.
- [x] The delete-measurement flow uses the shared component (no separate
      delete-only dialog remains).
- [x] Logout requires confirmation and only proceeds after the user confirms.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results

## Modified Files

- `apps/web/src/screens/components/ConfirmationDialog.tsx`
- `apps/web/src/screens/components/DeleteConfirmationDialog.tsx` (removed)
- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `apps/web/src/screens/AuthenticatedApp.tsx`
- `tests/e2e/tooling.spec.ts`
- `specs/v2/tasks/t-034-reusable-confirmation-dialog.md`
- `.agent-state/v2-parallel/T-034.md`
