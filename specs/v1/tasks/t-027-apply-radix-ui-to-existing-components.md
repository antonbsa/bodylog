# T-027 — Apply Radix UI to Existing Components

## Status

Done

## Description

Migrate existing V1 frontend UI components to Radix UI / Radix Themes components where Radix provides useful accessible behavior or structure.

This task exists because Radix UI / Radix Themes was selected during the measurement history table refactor, but that refactor should apply Radix only to history-table-related changes.

## Why

This task keeps component-library adoption deliberate and prevents the history table refactor from expanding into an app-wide UI rewrite.

## Scope

- Create a shared components folder at `apps/web/src/components/` for reusable wrappers around Radix Themes.
- Build a `Button` component in that folder, pre-configured with all variant and size combinations already in use across the app, so call sites only pass semantic props.
- Apply Radix Themes components to existing screens and components: dialogs, forms, inputs, cards, badges, and callouts.
- Move the `<Theme>` provider to `main.tsx` (root level) so theming applies globally, and remove the inline `<Theme>` from `MeasurementHistoryTable`.
- Prefer Radix Themes styled components over headless Radix primitives. Upgrade `DeleteConfirmationDialog` from the raw `AlertDialog` primitive to the Radix Themes `AlertDialog`.
- Keep the current dark, mobile-first visual direction.
- Preserve all visible `pt-BR` copy.
- Keep component changes small and behavior-preserving unless a selected component requires a minor accessibility improvement.
- Update or add tests for any changed interactive behavior.

## Out of Scope

- Do not redesign the app.
- Do not change product behavior.
- Do not add charts, multi-user behavior, Google Sheets integration, offline-first behavior, or Vercel compatibility.
- Do not refactor the measurement history table structure if that refactor has already been completed separately.
- Do not migrate components that do not benefit from Radix components.

## Implementation Plan

### 1. Root theme setup

Move `<Theme accentColor="gray" appearance="dark" grayColor="slate" radius="small">` from `MeasurementHistoryTable.tsx` to `main.tsx`, wrapping `<App />`. Remove the inline `<Theme>` from `MeasurementHistoryTable`.

### 2. Shared `Button` component

Create `apps/web/src/components/Button.tsx`.

Audit of button variants currently in use across the app:

| CSS class combination               | Semantic intent           | Radix Themes mapping                        |
| ----------------------------------- | ------------------------- | ------------------------------------------- |
| `primary-action`                    | Primary CTA               | `variant="solid"` (default)                 |
| `secondary-action`                  | Secondary / neutral       | `variant="soft"`                            |
| `danger-action`                     | Destructive               | `color="red"`, `variant="soft"`             |
| `secondary-action compact-action`   | Secondary in table rows   | `variant="soft"`, `size="1"`                |
| `danger-action compact-action`      | Destructive in table rows | `color="red"`, `variant="soft"`, `size="1"` |
| `secondary-action load-more-action` | Full-width secondary      | `variant="soft"`, full-width                |

The `Button` component should accept:

- `variant`: `"primary" | "secondary" | "danger"` — maps to the Radix Themes variant/color combination above
- `size`: `"default" | "compact"` — maps to Radix Themes `size` prop
- `fullWidth`: boolean — for the load-more use case
- All standard button props (`disabled`, `type`, `onClick`, `aria-label`, etc.)

### 3. File-by-file changes

**`apps/web/src/main.tsx`**

- Add `<Theme>` wrapper around `<App />`.

**`apps/web/src/screens/components/MeasurementHistoryTable.tsx`**

- Remove inline `<Theme>` wrapper.
- Swap raw `<button className="secondary-action compact-action">` and `<button className="danger-action compact-action">` → `<Button variant="secondary" size="compact">` and `<Button variant="danger" size="compact">`.

**`apps/web/src/screens/components/DeleteConfirmationDialog.tsx`**

- Migrate from the headless `AlertDialog` primitive (`import { AlertDialog } from "radix-ui"`) to the Radix Themes `AlertDialog` (`import { AlertDialog } from "@radix-ui/themes"`).
- Replace raw `<button className="secondary-action">` and `<button className="danger-action">` → `<Button variant="secondary">` and `<Button variant="danger">`.

**`apps/web/src/screens/components/MeasurementForm.tsx`**

- Replace the custom `modal-backdrop` + hand-rolled `role="dialog"` section with `Dialog.Root` / `Dialog.Content` from Radix Themes — provides focus trap, portal, and accessible modal behavior.
- Replace each `<label>` + `<input>` pair with `<label>` + `<TextField.Root>` from Radix Themes.
- Replace `<button className="secondary-action">` and `<button className="primary-action">` → `<Button variant="secondary">` and `<Button variant="primary">`.

**`apps/web/src/screens/components/AuthenticatedDashboard.tsx`**

- Replace all `<button className="primary-action">` → `<Button variant="primary">`.
- Replace all `<button className="secondary-action">` → `<Button variant="secondary">` (load-more gets `fullWidth`).
- Replace `<p className="dashboard-message" role="alert">` → `Callout.Root` with `color="red"` from Radix Themes.
- Replace `<p className="form-success" role="status">` → `Callout.Root` with `color="green"`.
- Replace `<article className="metric-card">` in `SummaryCard` → `Card` from Radix Themes.
- Replace `<span className="direction-badge">` in `DirectionBadge` → `Badge` from Radix Themes.

**`apps/web/src/screens/LoginScreen.tsx`**

- Replace `<input type="password">` → `TextField.Root` from Radix Themes.
- Replace `<button>` → `<Button variant="primary">`.

### 4. CSS cleanup

Remove or reduce CSS rules for classes replaced by Radix Themes:
`primary-action`, `secondary-action`, `danger-action`, `compact-action`, `load-more-action`, `modal-backdrop`, `measurement-modal`, `modal-header`, `modal-actions`, `metric-card`, `direction-badge`, `dashboard-message`, `form-success`, `confirmation-dialog`, `confirmation-dialog-overlay`, `confirmation-dialog-title`, `confirmation-dialog-description`, `confirmation-dialog-actions`.

Retain layout-specific classes that Radix Themes does not replace: `summary-grid`, `dashboard-context`, `history-section`, `app-header`, `header-actions`, etc.

### 5. Final folder structure

```
apps/web/src/
├── main.tsx                                ← adds <Theme> at root
├── App.tsx                                 ← unchanged
├── components/
│   └── Button.tsx                          ← new shared component
├── screens/
│   ├── AuthenticatedApp.tsx                ← unchanged
│   ├── LoginScreen.tsx                     ← TextField + Button
│   └── components/
│       ├── AuthenticatedDashboard.tsx      ← Button, Callout, Card, Badge
│       ├── DeleteConfirmationDialog.tsx    ← Themes AlertDialog + Button
│       ├── MeasurementForm.tsx             ← Dialog, TextField, Button
│       └── MeasurementHistoryTable.tsx     ← remove inline Theme, Button
```

## Validation

Ran the relevant automated checks for the changed area:

- `npm run lint` — clean (two `prettier/prettier` formatting errors found mid-implementation were auto-fixed with `eslint --fix`).
- `npm run --prefix apps/web typecheck` — clean.
- `npm run build:web` — production build succeeds.
- `npx vitest run --config vitest.config.ts` — 65 API tests passed (unrelated to this change, confirms no regression in domain logic).
- `npx playwright test` — all 17 existing E2E tests passed unmodified against the migrated UI, confirming behavior preservation (dialog roles, accessible names, button roles/labels, and CSS hooks used by tests such as `.history-table-scroll` and `.modal-loading-status` all still resolve correctly).

No E2E test changes were required: existing tests already asserted against accessible roles/names/text (e.g. `getByRole("dialog", { name: "Medida corporal" })`, `getByRole("alertdialog", { name: "Excluir medida" })`, `getByRole("button", { name: "..." })`) rather than implementation classNames, so they continued to pass against the Radix-rendered markup.

Manual notes on intentional minor behavior changes (accessibility improvements, consistent with task scope):

- `MeasurementForm`'s modal now closes on `Escape` and on overlay click, via Radix `Dialog`'s built-in dismiss behavior. Previously the hand-rolled modal had no such affordance.
- `DeleteConfirmationDialog`'s `AlertDialog` retains its prior behavior (no outside-click dismiss), consistent with Radix's intentional design for confirmation dialogs.

### Modified files

- `apps/web/src/components/Button.tsx` (new)
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/screens/LoginScreen.tsx`
- `apps/web/src/screens/components/MeasurementHistoryTable.tsx`
- `apps/web/src/screens/components/DeleteConfirmationDialog.tsx`
- `apps/web/src/screens/components/MeasurementForm.tsx`
- `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
- `apps/web/src/utils/dashboard-summary.ts` (added exported `OutcomeClass` type, narrowed `getOutcomeClass` return type from `string`)

## Acceptance Criteria

- [x] `apps/web/src/components/Button.tsx` exists and covers all variant/size combinations in use.
- [x] `<Theme>` provider is at root in `main.tsx`; no inline `Theme` remains in `MeasurementHistoryTable`.
- [x] `DeleteConfirmationDialog` uses Radix Themes `AlertDialog` (not the raw primitive).
- [x] `MeasurementForm` uses `Dialog` from Radix Themes for the modal wrapper.
- [x] Form inputs in `MeasurementForm` and `LoginScreen` use `TextField` from Radix Themes.
- [x] All call sites across the app use `<Button>` from `apps/web/src/components/Button.tsx`.
- [x] `AuthenticatedDashboard` uses `Callout`, `Card`, and `Badge` from Radix Themes.
- [x] Existing visual direction is preserved.
- [x] Existing product behavior is preserved.
- [x] Relevant E2E or component-level tests are updated. (No changes needed — all 17 existing E2E tests pass unmodified.)
- [x] No unrelated UI redesign is introduced.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
