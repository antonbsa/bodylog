# T-038 — Replace Callouts with Toast Notifications

## Status

To Do

## Description

Remove every in-page `Callout` banner and report action outcomes as toast
notifications instead, as part of the post-redesign UI/UX pass.

All `Callout` usages live in
`apps/web/src/screens/components/AuthenticatedDashboard.tsx`:

- history load error, initial-loading, and the create/edit/delete status message
  (`AuthenticatedDashboard.tsx:341-360`);
- saved (create/edit) success message (`:556-560`);
- export error (`:562-566`);
- import error, partial, and success (`:568-588`);
- weekly dashboard load error and loading (`:590-602`).

Success toasts auto-dismiss; failure toasts stay open until manually closed and
surface the complete error, expandable for details.

## Why

`Callout` banners stack in the page flow, push content around (conflicting with
the redesign's "no layout shift" rule), and do not reliably draw attention to
success or failure. Failures also collapse the detailed error (notably CSV
import errors) into a single line. Toasts give consistent, non-reflowing
feedback and let failures expose the full error for troubleshooting.

## Scope

- Remove every `Callout` usage from `AuthenticatedDashboard.tsx` (and any other
  surface still using `Callout` after T-036).
- Introduce a toast notification system aligned with the design system (see
  Assumptions for the chosen primitive, since Radix Themes does not ship a
  Toast). A single app-level toast provider/region renders the queue.
- Show a **success** toast for: measurement creation, editing, deletion, CSV
  export, and CSV import.
- Show a **failure** toast for the error path of each of those actions. Failure
  toasts must:
  - stay open until manually closed (no auto-dismiss);
  - include the complete error description, expandable for details (built on
    T-035's structured error shape).
- Keep pure-loading states (history loading, dashboard loading) out of toasts;
  represent them with inline/skeleton UI from the redesign rather than
  re-introducing banners.
- Add or update automated tests covering success/failure toast rendering per
  action and failure toasts persisting until dismissed.

## Out of Scope

- Do not change the backend, API contract, or response shapes.
- Do not add reminder/scheduled notifications (the unrelated "Notifications"
  future idea about daily logging reminders).
- Do not add health interpretation or good/bad classification to toast copy.
- Do not change the form behavior (that is T-037), or add charts, Google Sheets
  integration, offline-first behavior, multi-user support, or Vercel
  compatibility.

## Dependencies

- **T-036 (redesign)** must land first; align toast styling with the design
  system tokens (the design system defines a `Toast` primitive).
- **T-035 (structured error handling)** provides the error shape the
  "complete error description, expandable for details" failure toast consumes.
  If T-035 is not complete when this starts, surface the raw error message and
  document the gap rather than inventing a parallel error format.

## Assumptions

All decisions below were confirmed by the owner.

- **Toast primitive:** add `@radix-ui/react-toast` (Radix Themes ships no Toast)
  and style it with the design-system tokens, rather than a heavier toast
  library. **Confirmed.**
- **Success toast duration:** auto-dismiss after a short fixed timeout (~4s) with
  a manual close affordance; failure toasts never auto-dismiss.
- **Error exposure:** the failure toast shows the user-facing `message` from
  T-035's structured error, with an expandable section showing the full
  structured detail, avoiding leaking secrets/tokens/raw measurement values per
  the security guidance.

## Validation

Run the relevant automated checks:

- `npm run test:web`
- `npm run typecheck`
- `npm run lint`
- `npm run build:web`
- `git diff --check`

Manual validation (owner handles dev servers):

- Trigger create/edit/delete/export/import success and confirm a success toast
  that auto-dismisses.
- Trigger the failure path of each and confirm a failure toast that stays open
  until manually closed and exposes the full error, expandable for details.
- Confirm no `Callout` banners remain and loading states use inline/skeleton UI.

## Acceptance Criteria

- [ ] No `Callout` component remains in the web app.
- [ ] Create, edit, delete, export, and import successes each show a success
      toast (auto-dismissing).
- [ ] Create, edit, delete, export, and import failures each show a failure toast
      that stays open until manually closed and exposes the complete error,
      expandable for details.
- [ ] Failure toasts build on T-035's structured error shape (or document the
      gap if T-035 is incomplete).
- [ ] Pure-loading states use inline/skeleton UI, not toasts or banners.
- [ ] Automated tests cover success/failure toast behavior and failure-toast
      persistence.
- [ ] All listed automated checks pass.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
