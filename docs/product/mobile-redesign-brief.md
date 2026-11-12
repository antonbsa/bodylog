# Mobile Redesign Brief

Source of truth for the mobile redesign agreed on 2026-11-11, on branch `feat/mobile-redesign` (created from `main`). It records why the previous redesign stalled, every decision taken, and the sequence to follow. Later steps turn it into `docs/product/ui-direction.md`, ADRs under `docs/technical/decisions/`, and GitHub issues; when those exist, they win over this brief and this file is updated or removed.

## Why the previous redesign stalled

- The generated design system (`/home/antonbsa/www/personal/bodylog-design-system`, frozen as history) had no real brief: the "Problems" and "Desired Changes" of its input were left blank, so the generator decided on its own.
- It was built from tokens and components outward, not from the daily ritual. Hierarchy was wrong and the measurement entry flow, the core of the app, was not practical, fast or accessible enough.
- It dropped data the owner tracks (week-over-week comparison context, derived values) and left many states undesigned: edit existing date, delete, empty, loading, error, validation, light theme.
- The `redesign-2` WIP (uncommitted, kept untouched as optional reference) merged T-036, T-038, T-040 and a form rewrite into one pass, was never compared visually against the mocks, and regressed date entry (day-by-day stepping only).

## Principles

- Mobile is the target and must be 100% functional on an installed iPhone PWA. Desktop only needs to stay consistent with mobile.
- Registration is the product: it must be fast, practical and accessible above everything else.
- Minimalism: low density, generous whitespace, no vibrant colors, no gradients, no glow, no decorative "AI slop" (greetings, health scores, mascots, 3D figures, judgment labels like "Good"/"Normal").
- Changes are never classified as good or bad.
- Analysis happens partly in-app (trends) and partly externally; the app exposes data for external analysis as a later, separate step.

## References

- Liked: BodyLog body measurements app (App Store, id 6747375332). Takeaways: neutral near-black surfaces, a single accent used only for active state and primary action, large bold page titles, simple rows with a small label, a prominent value and a neutral gray delta chip ("↓ 0.4"), bottom tab bar with a central add button.
- Liked: Dribbble shot 27785974 ("AI Health Tracking App UI"). Takeaways: airy light theme, white cards with large radius (~24px) and very soft shadow, one accent, big numerals with small attached units ("110bpm", "7h 45m"). Rejected parts: greeting, health score, green judgment labels, 3D body, AI robot.
- Avoid: dense UIs, vibrant palettes, gradient effects.

## Visual direction

- Themes: light and dark, following the system, with a manual override in Settings (System / Light / Dark).
- Dark theme uses neutral grays (no GitHub blue tint); cards have no border or shadow and are separated by surface tone. Light theme uses white cards with very soft shadow.
- One accent color, used only for the primary action, focus and active state. Three candidates are shown side by side in the prototype (muted lime, cool blue, soft amber) and the owner picks one on the device.
- Typography: Geist for text, Geist Mono with tabular figures for numbers, self-hosted. Inputs at 16px or more (no iOS zoom).
- Radius around 16px on cards. Touch targets at least 44px.
- Variations use one neutral tone: arrow plus text ("Subiu", "Caiu", "Estável") in a neutral chip. Color is reserved for system states (error, focus, primary action).
- Icons: Phosphor (already a project decision).

## Navigation

- Bottom tab bar: Início · Histórico · (＋) · Tendências · Ajustes.
- The bar sits in the layout flow (`h-dvh` flex column, not `position: fixed`) with `env(safe-area-inset-bottom)` padding, solid background and a thin top border, following the pattern in `antonbsa/twitch-radar` (`apps/web/src/components/shell/bottom-tab-bar.tsx`).
- Tabs: Phosphor icon above a 12px label; the active tab uses the accent and `aria-current="page"`.
- Central button: ~52px accent circle on the same plane as the bar (not raised, no notch), no label, `aria-label="Registrar medida"`. It opens today's registration screen.
- No FAB, no gear menu.

## Registration screen

- Full-screen route (for example `/registro?data=YYYY-MM-DD`), not a modal or bottom sheet. Fixed header with "Cancelar" and the date; fixed "Salvar" button above the keyboard.
- Date: defaults to today. ±1 day arrows beside it; tapping the date opens the native `input type="date"` (calendar popover on iOS). A badge states the mode: "Nova medida" or "Editando medida de DD/MM".
- Selecting a date that has a record loads it for editing; otherwise the form is empty (existing product rule).
- Sections and fields, in this order (only weight is required):
  1. Balança: peso (kg), gordura (%), músculo (%), metabolismo (kcal).
  2. Medidas: cintura (cm). New field.
  3. Como você está: sono (h, the previous night, captioned "noite passada"), disposição (1–5). New fields.
  4. Notas: free text. New field.
- Numeric entry: right-to-left mask with a fixed decimal (digits fill from the right, comma inserted automatically; typing `724` gives `72,4`). One fixed decimal for weight, fat, muscle, waist and sleep; no decimal for metabolism. Every numeric input uses `inputMode="numeric"` (digits-only keypad).
- Sleep: −/＋ stepper in 0.5 h steps around an editable digits-only input. It starts empty; the first tap starts from the previous recorded value.
- Disposição: five segmented buttons (1–5), with captions only at the ends: "Indisposto" (1) and "Disposto" (5).
- Each numeric field shows the previous measurement's value discreetly ("anterior: 72,6") as a hint, never prefilled.
- Field advance on iPhone relies on the keyboard accessory arrows (‹ ›); the digits-only keypad has no "Next" key.
- Validation: hard limits that block saving, with the message in a reserved inline slot (no layout shift): weight 20–300 kg, fat and muscle 1–80%, metabolism 500–5000 kcal, waist 30–250 cm, sleep 0–24 h. No extra "unusual value" warnings beyond the previous-value hint.
- Read-only derived values (BMI, fat kg, muscle kg) are shown in edit mode, so no separate detail screen is needed.
- Cancel with unsaved changes asks "Descartar alterações?"; with no changes it just closes. This replaces the T-037 idea of keeping form state in memory between openings.
- Delete lives only in edit mode: a discreet "Excluir medida" button at the end, with a confirmation dialog.
- After saving: return to Início, show a toast ("Medida de DD/MM salva"), and the Today card reflects the new values.

## Início

1. Today card: without a record, a large "Registrar hoje" action; with a record, today's values and "Editar".
2. "Esta semana" block:
   - Header with seven day dots (S T Q Q S S D) showing the days actually recorded (filled = recorded, hollow = missing, dimmed = future), plus "4/7", and the comparison week with its count ("vs 3–9 nov · 6/7").
   - Rows for peso, gordura %, músculo %, cintura, sono and disposição: metric, weekly average, neutral variation chip against the previous full week.
   - Metabolism and derived values (BMI, fat kg, muscle kg) are not on Início; they appear in edit mode and in Tendências.
- The registration target is now 7 days per week (was 5). The Baixa/Média/Alta reliability label is removed.

## Histórico

- List grouped by week (weeks start on Monday). Week header: "3–9 nov · média 72,4 kg".
- Row: date with weekday, weight, fat %, muscle %, and a discreet icon when the record has a note. Tapping a row opens it in edit mode. No inline actions.

## Tendências

- One line chart at a time; the metric is picked in a selector.
- Periods: 14d · 30d · 90d · 1 ano · Tudo. 14 days is the minimum window considered meaningful for a trend.
- Daily points drawn discreetly, weekly average line emphasized. Neutral color plus the accent. No "ideal" bands.
- This reverses the "no charts" rule; an ADR records it.

## Ajustes

- Theme (System / Light / Dark), export CSV, import CSV, log out.
- Status feedback uses toasts instead of in-flow callouts.

## Data and business rule changes

- New optional fields: `waistCm` (1 decimal), `sleepHours` (1 decimal, UI steps of 0.5), `disposition` (integer 1–5), `notes` (free text). They require a D1 migration, shared types in `types/`, API validation, and CSV export/import support.
- Weekly averages and comparison include waist, sleep and disposition, with neutral variation (cm, h, points). Notes appear only in Histórico and edit mode.
- The weekly summary API returns the recorded dates of each week, so Início can draw the real day dots.
- Weekly registration target becomes 7 days; reliability docs (`docs/product/ui-direction.md`, `docs/product/requirements.md`, `docs/product/scope.md`) are rewritten accordingly.
- Weeks run Monday to Sunday; the current partial week is compared with the previous full week (unchanged).

## Out of scope for this redesign

- Exposing data for external analysis (API token, MCP, etc.). It becomes its own issue, as the last step before calling the MVP done.
- Offline-first logging (T-039) stays after the redesign.
- Cleanup of branches `redesign` and `redesign-2`; the owner handles it. They may be read as reference, never modified.

## Process

- Task tracking lives exclusively in GitHub issues: one umbrella issue ("Mobile redesign") with native sub-issues, one per task, each with scope, acceptance criteria and validation (including a screenshot compared against the prototype). No new task files under `specs/`; existing task files stay untouched for the owner to remove later.
- T-036, T-038 and T-040 are superseded by the new sub-issues; what still applies from T-037 is absorbed by the registration task. This is recorded in the issues, not in the old task files.
- `AGENTS.md` is updated so agents track tasks only as GitHub issues and keep `docs/` for stable knowledge.
- Git: everything on `feat/mobile-redesign`, one commit per task, a single PR at the end linked to the umbrella issue.

## Sequence

1. Done. Prototype: HTML with fake data covering Login; Início with and without today's record; Registro new, editing, validation error and discard confirmation; Histórico; Tendências with metric and period switching; Ajustes. Light/dark toggle and the three accent options. Published as a private claude.ai page for testing on the iPhone and saved in the repo next to the docs.
2. Done. Owner tested on the iPhone and approved the prototype.
3. Done. `docs/product/ui-direction.md` and ADRs 0030–0036 (charts, neutral variation color, new fields, bottom navigation, themes, 7-day target, issue-only task tracking). Where the approved prototype and `ui-direction.md` differ from this brief, they win.
4. Done. `AGENTS.md` updated for issue-only task tracking.
5. Done. Parent issue #23 "Mobile redesign" with sub-issues #24–#30, created after the owner approved the text.
6. Implement task by task, in this order, each validated by screenshot against the prototype before it is closed:
   1. New fields: database, API, types, CSV.
   2. Visual foundation: tokens, themes, fonts, bottom bar and routes.
   3. Registration screen.
   4. Início.
   5. Histórico.
   6. Tendências.
   7. Ajustes and toasts.

## Reusable pieces from the `redesign-2` WIP

Optional references in `/home/antonbsa/www/personal/bodylog` (uncommitted), to copy and adapt only if they fit: `apps/web/src/styles/tokens.css` and `fonts.css` (self-hosted Geist), `apps/web/src/utils/measurement-format.ts` and the date helpers in `apps/web/src/utils/date-format.ts`, `apps/web/src/components/Toast.tsx` with `tests/e2e/toast.spec.ts`, `apps/web/src/components/InlineAlert.tsx`, and `apps/web/src/hooks/useMediaQuery.ts`. Discard its single large `styles.css`, the hand-built settings menu and the day-by-day-only date stepper.
