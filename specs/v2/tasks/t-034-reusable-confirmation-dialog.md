# T-034 — Reusable Confirmation Dialog (Delete + Logout)

## Status

To Do

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

- `npm run typecheck`
- `npm run lint`
- `npm run test:web`
- `npm run test:e2e`
- `npm run build`
- `git diff --check`

Manual validation:

- Deleting a measurement still asks for confirmation via the shared dialog.
- Logout asks for confirmation and only logs out after confirming.

## Acceptance Criteria

- [ ] A reusable `ConfirmationDialog` component exists with configurable
      title/description/labels/confirm variant and an `isConfirming` state.
- [ ] The delete-measurement flow uses the shared component (no separate
      delete-only dialog remains).
- [ ] Logout requires confirmation and only proceeds after the user confirms.
- [ ] All listed automated checks pass.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
