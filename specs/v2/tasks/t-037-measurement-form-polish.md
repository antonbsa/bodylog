# T-037 — Measurement Form Polish

## Status

To Do

## Description

Polish the measurement form for mobile ergonomics and clearer state, as part of
the post-redesign UI/UX pass. The form lives in
`apps/web/src/screens/components/MeasurementForm.tsx`.

This addresses friction surfaced during V1 production use: mobile zoom on input
focus, no keyboard "next/submit" flow, weak loading and disabled-input states,
and loss of form state when the modal closes. Today the field state and per-date
lookup cache (`measurementByDateCache`, `MeasurementForm.tsx:45`; `fields`
`useState`, `MeasurementForm.tsx:46`) live inside the component, so they are
discarded when the modal unmounts. The mode badge already exists
(`MeasurementForm.tsx:169-171`) but only renders a static "Editando"/"Criando"
label with no loading state.

The delete-confirmation date is rendered as a plain interpolated string
(`AuthenticatedDashboard.tsx:388-392` builds the description;
`DeleteConfirmationDialog.tsx:26` renders it as plain text), so making the date
bold requires passing a node rather than a string.

## Why

Daily logging happens on a phone. Zooming on focus, lacking a keyboard
next/submit flow, and losing entered data on modal close all make the form
slower than the spreadsheet it replaces. Clearer disabled and loading states
reduce uncertainty during date lookups, and a bold date in the delete
confirmation makes the destructive target unambiguous.

## Scope

### Form (`MeasurementForm.tsx`)

- Prevent mobile zoom on input focus and blur — keep the viewport at 100% / fit
  at all times (e.g. ensure inputs use a >=16px effective font size and the app
  shell viewport disallows user scaling). Do not regress desktop.
- Add a mobile keyboard "next" affordance that advances focus through the inputs
  in order, and a "submit"/"done" action on the last input that submits the
  form.
- Apply a right-to-left masked numeric input ("Nubank-style" currency input) to
  the form's numeric/decimal fields (weight, body fat %, muscle %, etc. —
  `inputMode="numeric"` / `inputMode="decimal"` fields in `MeasurementForm.tsx`).
  See Assumptions for the exact algorithm.
- Loading state in the mode badge: while a date lookup is loading, show a
  rotating icon inside the badge with **no** label/text; when loaded, remove the
  icon and show the correct label ("Editando" / "Criando"). The badge width must
  animate between the icon-only and text states.
- Improve the disabled-input visual so a disabled field is clearly more evident
  than today's default.
- Persist the last form/measurement state across modal open/close so reopening
  restores the previously entered/loaded data instead of starting cold. Move the
  state (and/or per-date lookup cache) out of the component's local lifetime.
  See Assumptions for the chosen storage location.

### Delete confirmation date (bold)

- Render the date in the delete confirmation in **bold**. This requires the
  dialog (the reusable confirmation component from T-034) to accept a node — not
  a plain string — for the date portion, and the caller in
  `AuthenticatedDashboard.tsx` to pass the bold date.

### Tests

- Add or update automated tests for the badge loading-to-label transition, the
  bold delete date, and form-state persistence across open/close.

## Out of Scope

- Do not change the backend, API contract, or response shapes.
- Do not implement the toast notifications (that is T-038).
- Do not add new metrics, charts, Google Sheets integration, offline-first
  behavior, multi-user support, or Vercel compatibility.
- Do not add health interpretation or good/bad classification.

## Dependencies

- **T-036 (redesign)** must land first; this task assumes the redesigned form,
  tokens, and badge styling exist and aligns the new states with them.
- **T-034 (reusable confirmation dialog)** owns the dialog the bold-date change
  modifies; this task extends it to accept a node for the date.

## Assumptions

All decisions below were confirmed by the owner.

- **"Nubank character fill"** is the right-to-left masked numeric input pattern
  (sometimes called "masked currency input"): digits are always stored as a
  plain integer string, and the decimal separator is a fixed display artifact —
  never a character the user types. Algorithm:
  1. **Append** — each digit typed is appended to the right of an internal
     digit string (e.g. `"1"` → `"14"` → `"145"`).
  2. **Pad** — the string is left-padded with zeros to at least 3 characters
     (`"001"`, `"014"`, `"145"`).
  3. **Format** — a decimal separator is inserted 2 positions from the right,
     and thousands separators are added every 3 digits on the integer part for
     display (`pt-BR` formatting: comma decimal, dot thousands).
  Apply this to the form's numeric/decimal fields; deleting removes the
  rightmost digit and re-runs pad + format. Non-digit keystrokes are ignored.
- **Persisted form-state location:** an in-memory app-level store (lifted above
  the modal, e.g. a context/store that outlives the dialog) rather than
  `localStorage`, since body metrics are sensitive
  (`docs/technical/cross-cutting-concerns.md`) and the data only needs to survive
  open/close within a session.
- **Mobile zoom prevention:** achieved primarily via >=16px input font size and
  the app viewport configuration; scaling is only constrained for the app shell.
  This iOS-specific zoom behavior produces an inconsistent, jarring UX for this
  app and must be avoided regardless of platform.

## Validation

Run the relevant automated checks:

- `npm run test:web`
- `npm run typecheck`
- `npm run lint`
- `npm run build:web`
- `git diff --check`

Manual validation (owner handles dev servers):

- On a mobile device/emulator, no zoom on input focus or blur.
- Keyboard "next" advances inputs; the final action submits.
- The badge shows a spinning icon (no text) while loading, then animates its
  width to the correct label.
- Disabled inputs are clearly distinguishable.
- Reopening the form restores the previous state.
- The delete dialog shows the date in bold.

## Acceptance Criteria

- [ ] Focusing or leaving a form input never zooms the viewport on mobile.
- [ ] A mobile keyboard action advances through inputs in order and submits on
      the last input.
- [ ] Numeric/decimal fields use the right-to-left masked numeric input pattern
      (digits appended right, padded, formatted with `pt-BR` decimal/thousands
      separators).
- [ ] The mode badge shows a rotating icon with no label while loading, then
      removes the icon and shows the correct "Editando"/"Criando" label, with a
      width animation between the two states.
- [ ] Disabled inputs are visually more evident than the current default.
- [ ] Form/measurement state persists across modal open/close and is restored on
      reopen.
- [ ] The delete confirmation shows the date in bold.
- [ ] Automated tests cover the badge transition, bold delete date, and
      form-state persistence.
- [ ] All listed automated checks pass.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
