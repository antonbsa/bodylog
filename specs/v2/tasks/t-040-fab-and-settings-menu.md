# T-040 — Floating Action Button & Settings Menu

## Status

To Do

## Description

Adopt the design system's app-shell structure for actions: replace today's row
of header buttons with a floating action button (FAB) for the primary action and
a top-right `SettingsMenu` gear dropdown for account actions (CSV export/import
and logout).

This is the structural/behavioral counterpart to the T-036 redesign, which only
restyled the existing buttons in place. It is split out so the redesign (T-036)
stays visual-only and this layout change does not collide with the toast work in
T-038.

## Why

The design system (`antonbsa/bodylog-design-system`) defines the v2 app shell
with the primary action in a fixed FAB and the account actions consolidated into
a top-right `SettingsMenu` dropdown (`components/navigation/SettingsMenu`),
instead of a stacked row of header buttons. This declutters the header, keeps the
data-forward summary at the top, and prepares the structure the design system was
built for. T-036 deliberately left this out because it changes layout and
behavior, not just visuals.

## Source of Truth — Design System Repository

Repository: `antonbsa/bodylog-design-system` (private; accessed via the GitHub
API — see T-036 for the access recipe).

Key references:

- `components/navigation/SettingsMenu.{jsx,d.ts,prompt.md}` — the top-right
  dropdown for account actions (CSV export/import, logout); anchored
  `position:absolute; top:52px; right:18px`, paired with a gear `IconButton`,
  dismissed by an invisible backdrop on outside tap.
- `components/buttons/IconButton.*` — the gear trigger.
- `README.md` — "move account actions into a top-right settings menu" and the FAB
  notes ("The FAB and settings menu are fixed within the screen"; floating layers
  may use shadow; no layout shift).

Use the design-system tokens already ported into the app by T-036; do not
re-port tokens or add an icon-library dependency (Phosphor Icons stays — use the
Phosphor gear equivalent).

## Scope

- Add a fixed floating action button for the primary action (`Registrar medida`)
  consistent with the design system (fixed within the ~390px screen, >=44px
  touch target, shadow allowed as a floating layer, no layout shift).
- Add a top-right `SettingsMenu` gear dropdown mapping the design-system intent
  onto Radix Themes (e.g. `DropdownMenu`), containing the account actions:
  CSV export, CSV import, and logout.
- Move `Exportar CSV`, `Importar CSV`, and `Sair` out of the header button row
  into the `SettingsMenu`. Preserve their current behavior (export download,
  hidden file input for import, logout confirmation via `ConfirmationDialog`).
- Remove the `Atualizar dados` manual refresh button: the design system relies on
  the existing auto-refresh-on-focus/visibility behavior in `AuthenticatedApp`,
  which must be preserved.
- Keep all existing `pt-BR` copy, the one-measurement-per-date behavior, and the
  API contract unchanged.
- Keep the implementation mobile-first within the ~390px content rhythm; the FAB
  and menu must not cause layout shift.
- Update E2E coverage for the relocated actions (the primary action now via the
  FAB; CSV export/import and logout now via the `SettingsMenu`).

## Out of Scope

- No visual redesign beyond what T-036 already established (reuse the ported
  tokens, type scale, and component styling).
- No toast work — outcome messaging stays as-is here and is handled by T-038.
- No new account/multi-user features; the `SettingsMenu` only hosts the existing
  CSV and logout actions even though the design system anticipates a future
  multi-user model.
- No icon-library migration (Phosphor Icons stays).
- Do not change the API contract or data shapes.

## Assumptions

- The design-system tokens and fonts are already present (ported by T-036); this
  task only changes structure/behavior.
- Radix Themes remains the component layer; the `SettingsMenu` and FAB are built
  by mapping design-system intent onto Radix primitives, not by importing the
  repo's cosmetic `.jsx`.
- Centered Radix dialogs remain (no bottom-sheet conversion) unless a separate
  task introduces sheets.

## Validation

Run the relevant automated checks:

- `npm run --prefix apps/web typecheck`
- `npm run lint`
- `npm run build:web`
- `npx playwright test`
- `git diff --check`
- Manual check at ~390px: FAB fixed and reachable, `SettingsMenu` opens/closes
  (including outside-tap dismiss), CSV export/import and logout work from the
  menu, auto-refresh on focus still works, and no layout shift occurs.

## Acceptance Criteria

- [ ] A fixed FAB triggers the primary `Registrar medida` action.
- [ ] A top-right `SettingsMenu` gear dropdown hosts CSV export, CSV import, and
      logout, with their existing behavior preserved.
- [ ] The header no longer renders the stacked action button row.
- [ ] The `Atualizar dados` button is removed and auto-refresh-on-focus still
      works.
- [ ] No icon-library dependency was added (Phosphor Icons only).
- [ ] No API contract or data shape changed.
- [ ] Overlays (FAB, menu) cause no layout shift.
- [ ] E2E tests are updated for the relocated actions and pass.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
