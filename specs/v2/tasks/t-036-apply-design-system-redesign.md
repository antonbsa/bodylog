# T-036 — Apply Design System Redesign

## Status

To Do

## Description

Apply the new BodyLog design system across the existing web app, restyling the
current screens and components so their visuals (color tokens, typography,
spacing, radius, surfaces, and Radix Themes configuration) match the redesign
baseline maintained in the design-system repository.

This is the redesign. It runs **after** the pre-redesign foundation tasks
(T-030…T-035) and **before** the post-redesign behavior tasks (T-037, T-038) to
minimize merge conflicts: this task changes visuals only.

The source of truth is the private design-system repo
`antonbsa/bodylog-design-system`, which encodes the v2 redesign decisions: dark,
dense, data-forward UI; a GitHub-style slate palette; Geist for interface text
and Geist Mono for every number; metric-relative outcome colors; tinted summary
cards with the weight metric dominant; flat surfaces with no gradients; and a
hard "no layout shift" rule.

## Why

V1 shipped a functional but GitHub-style-on-Radix interface assembled
incrementally. The owner's change request ("apply new design") replaces that
with a deliberate design system: a documented token set, a defined type scale,
metric-tinted summary surfaces, and consistent semantic color usage — a coherent
visual baseline before the behavioral feature work in T-037 / T-038.

## Source of Truth — Design System Repository

Repository: `antonbsa/bodylog-design-system` (private; accessed via the GitHub
API). There is no Figma or live codebase attached — the redesign DC HTML files
and the `tokens/` + `components/` directories are the source of truth.

Access recipe (read any file's content):

```sh
# List a directory
gh api repos/antonbsa/bodylog-design-system/contents/<dir> --jq '.[].name'

# Read a file's content (base64-decoded)
gh api repos/antonbsa/bodylog-design-system/contents/<path> --jq .content | base64 -d
```

Key paths to pull during implementation:

- `README.md` — full design language brief and component index.
- `SKILL.md` — portable quick-orientation summary.
- `styles.css` — global entry point that `@import`s all token files.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radius.css`,
  `shadows.css`, `fonts.css`, `base.css` (the canonical CSS custom properties;
  never hard-code hex — use these variables).
- `guidelines/` — specimen HTML cards for color/type/spacing/radius/shadows/logo.
- `components/` — React primitives, one card per dir (`*.jsx`, `*.d.ts`,
  `*.prompt.md`): `buttons/` (`Button`, `IconButton`), `forms/` (`TextField`,
  `DateField`), `feedback/` (`Badge`, `Toast`), `data/` (`MetricCard`,
  `ReliabilitySteps`, `HistoryRow`), `navigation/` (`SettingsMenu`).
- `ui_kits/bodylog-app/index.html` — cosmetic full-app recreation (vanilla JS;
  reference only).

Large/binary reference files (do not dump): `BodyLog.dc.html`,
`BodyLog Redesign.dc.html`, `BodyLog App.html`, `_ds_bundle.js`,
`screenshots/`, `uploads/`.

## Design System Key Points

Captured from the repo so the implementer has a concrete summary in-task. Token
files remain canonical; use the CSS custom properties, never hard-coded hex.

- **Surfaces & borders:** app `--bg #0d1117`; cards/inputs `--surface #161b22`;
  hovered/expanded `--surface-raised #1b222b`; inset `--surface-inset #0d1117`.
  Borders `--border #30363d`, dividers `--border-subtle #21262d`. Flat fills,
  1px borders; shadows only for floating layers. No gradients/images/textures.
- **Text ramp (4 steps):** `--text-primary #f0f6fc`, `--text-secondary #c9d1d9`,
  `--text-muted #8b949e`, `--text-faint #6e7681`.
- **Brand & semantic colors:** brand blue `--brand #58a6ff` (wordmark/info/
  selected date only); green = good/primary (`--action #238636`,
  `--action-hover #2ea043`, `--success-text #7ee787`); red = danger/negative
  (`--danger #f85149`, `--danger-text #ff7b72`); amber = stable/low reliability
  (`--warning #d29922`). **Outcome color is metric-relative**: `--outcome-up`
  (green), `--outcome-down` (red), `--outcome-flat` (amber) — color follows the
  metric, not a good/bad judgment (consistent with the V1 neutral-variation
  rule).
- **Metric-tint surfaces:** dominant summary tiles use a faint metric-colored
  fill + 1px tinted border: weight (danger tint `--tint-weight-*`), fat (success
  tint `--tint-fat-*`), muscle (warning tint `--tint-muscle-*`). Soft fills:
  `--fill-danger-soft`, `--fill-warning-soft`, `--fill-success-soft`.
- **Typography:** `--font-sans` Geist (UI), `--font-mono` Geist Mono (all
  numbers, dates, wordmark). Weights 400/500/600/700. Scale (px): caption 12,
  body-sm 13, body 14, base 15, lg 17, xl 19, 2xl 21, display-sm 26, display 34,
  metric 46 (dominant weight), metric-lg 60 (hero); big values mono with tight
  tracking.
- **Spacing & radius:** compact mobile rhythm (workhorses 8/12/14/16px, screen
  gutter 18px, card padding 16px, field gap 9px). Radius: controls 12
  (`--radius-md`), cards 14 (`--radius-lg`), summary tiles 18 (`--radius-xl`),
  bottom-sheet 24 (`--radius-2xl`), pills 999 (`--radius-pill`).
- **Layout & motion:** single column, mobile-first, ~390px content width; weight
  tile spans 2 columns with fat + muscle side-by-side beneath; touch targets
  > =44px; minimal motion; **no layout shift** (overlays never reflow, error
  > space pre-reserved).
- **Iconography:** the design system specifies Lucide/Feather outline icons, but
  this project keeps using **Phosphor Icons** (V1's existing icon library) — no
  icon-library migration. Where a design-system mockup shows a Lucide/Feather
  icon, implement it with the equivalent Phosphor icon instead, matching the 2px
  outline look (16–20px) as closely as Phosphor allows. Unicode arrows `↑ ↓ →`
  in outcome badges; no emoji. Wordmark `BodyLog` in Geist Mono.
- **Copy:** Brazilian Portuguese; terse noun labels; sentence case; mono pt-BR
  numbers (`kg`, `%`, `p.p.`, `IMC`). Outcomes `↓ Caiu` / `→ Estável` /
  `↑ Subiu`; reliability `Baixa` / `Média` / `Alta`.
- **Component primitives (reference):** `Button`, `IconButton`, `TextField`,
  `DateField`, `Badge`, `Toast`, `MetricCard`, `ReliabilitySteps`, `HistoryRow`,
  `SettingsMenu`. Map their **visual** intent onto the existing Radix Themes
  components; their new interactive behavior belongs to T-037 / T-038.

## Scope

Apply the design system visually across the existing web app. Visual application
only.

- Port the design-system token CSS custom properties into the web app
  (from `tokens/` into `apps/web/src/styles.css` or an imported token layer) and
  load Geist + Geist Mono. Reference tokens via variables; do not hard-code hex.
- Align the Radix Themes `<Theme>` configuration in `apps/web/src/main.tsx`
  with the design system (dark appearance, slate gray, accent/radius matching the
  tokens). Bridge Radix Themes CSS variables to the design-system tokens where
  practical.
- Restyle the following components/screens to the design language (surfaces, type
  scale, spacing, radius, semantic + metric-tint colors, Geist Mono for numbers),
  preserving current behavior and `pt-BR` copy:
  - `apps/web/src/components/Button.tsx`
  - `apps/web/src/screens/LoginScreen.tsx`
  - `apps/web/src/screens/AuthenticatedApp.tsx`
  - `apps/web/src/screens/components/AuthenticatedDashboard.tsx`
  - `apps/web/src/screens/components/MeasurementForm.tsx`
  - `apps/web/src/screens/components/MeasurementHistoryTable.tsx`
  - the confirmation dialog (from T-034) and any not-found screen (from T-030)
  - `apps/web/src/styles.css`
- Apply metric-tint summary surfaces with the weight card dominant (2-col span;
  fat + muscle side-by-side beneath).
- Apply the four-step text ramp, type scale (mono numbers/dates/wordmark), token
  spacing/radius, and semantic + metric-relative outcome colors.
- Map design-system component intent onto the existing Radix Themes components
  rather than introducing new headless primitives. Where the design system
  specifies Lucide/Feather icons, use the equivalent **Phosphor Icons** icon
  instead (no icon-library migration — see Design System Key Points).
- Self-host the Geist and Geist Mono `.woff2` font files in the web app (do not
  load fonts from a Google Fonts CDN at runtime).
- Trim the mobile measurement history table to the design system's reduced
  column set (date · weight · body fat % · muscle %, hiding IMC / fat-kg /
  resting-metabolism columns on narrow viewports) and add a detail view/expansion
  for the hidden columns, per the design system's mobile history guidance. This
  is in scope here because it is not covered by any other task.
- Keep the implementation mobile-first and within the ~390px content rhythm.

## Out of Scope

- **No behavior changes.** Behavioral work belongs to the surrounding tasks.
  Reserved for T-037 / T-038: the new form interaction (next-input / submit,
  character fill, badge loading animation, persisted state), and replacing
  Callouts with toast notifications. T-036 may restyle the _current_
  presentation of these areas, but must not change how they behave.
- Do not change the API contract or data shapes.
- Do not migrate the icon library away from Phosphor Icons.
- Do not add new screens/routes/features beyond the mobile history detail view
  described in Scope, and do not add multi-user support, charts, Google Sheets
  integration, offline-first behavior, Postgres, or Vercel compatibility.

## Assumptions

All decisions below were confirmed by the owner.

- Tokens are ported into the web app as **copied values** (CSS custom
  properties from `tokens/`), not by consuming the design-system repo as a
  package or dependency. The design-system repo is reference only; this
  project's copied tokens become the source of truth going forward.
- Radix Themes remains the component layer (per ADR-0026); the design system is
  applied by configuring `<Theme>` and bridging Radix CSS variables to the
  tokens, not by replacing Radix with the repo's cosmetic `.jsx` primitives.
- The existing component files are kept as-is (no rename to `MetricCard` /
  `HistoryRow` / etc., no import of the repo's `.jsx` primitives); only their
  visual intent is applied.
- Dark appearance only (consistent with `docs/product/ui-direction.md`); no light
  theme is introduced here.
- Geist and Geist Mono are self-hosted (`.woff2` bundled with the app), not
  loaded from a Google Fonts CDN.
- Phosphor Icons remains the icon library; design-system Lucide/Feather icons
  are implemented with their Phosphor equivalents.
- Existing `pt-BR` copy and product behavior are preserved.
- The redesign DC/UI-kit HTML files are reference only; no markup is copied
  verbatim into production code.

## Validation

Run the relevant automated checks:

- `npm run --prefix apps/web typecheck`
- `npm run lint`
- `npm run build:web`
- `npx playwright test` (the existing E2E suite asserts accessible roles/names/
  text, not styling, so the restyle should not break it; update only if a
  styling change legitimately alters a selector hook, and justify it in notes)
- `git diff --check`
- Manual visual check against the design-system guidelines / UI kit at ~390px:
  surfaces, type scale, mono numbers, metric tints, outcome colors, no layout
  shift on overlays.

## Acceptance Criteria

- [ ] Design-system token CSS custom properties (colors, typography, spacing,
      radius, shadows) are present and used via variables, not hard-coded hex.
- [ ] Geist (UI) and Geist Mono (numbers/dates/wordmark) are loaded and applied.
- [ ] The Radix Themes `<Theme>` configuration aligns with the design system
      (dark, slate, matching accent/radius tokens).
- [ ] All listed components/screens are restyled with behavior and `pt-BR` copy
      preserved.
- [ ] Summary cards use metric-tint surfaces with the weight card dominant and
      fat + muscle side-by-side beneath.
- [ ] The four-step text ramp and type scale are applied; numbers/dates/wordmark
      use Geist Mono; semantic and metric-relative outcome colors are applied.
- [ ] Geist and Geist Mono are self-hosted, not loaded from a CDN.
- [ ] Phosphor Icons remains the icon library; no Lucide/Feather dependency was
      added.
- [ ] The mobile measurement history table shows the trimmed column set with a
      detail view/expansion for hidden columns.
- [ ] No gradients, images, or textures are introduced; overlays cause no layout
      shift.
- [ ] No API contract or data shape changed.
- [ ] Existing E2E tests pass (unmodified, or with only justified selector-hook
      updates).

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Tests or manual validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results
