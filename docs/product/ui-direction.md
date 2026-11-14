# UI Direction

## Purpose

Current-state description of the mobile UI. The approved interactive prototype is the visual reference: `docs/product/prototype/mobile-redesign.html` (open it in a browser; it has a "Protótipo" panel to jump between screens and states and to switch theme). This document records what the prototype does and the rules behind it; it does not repeat every pixel value. The reasoning behind the decisions lives in the ADRs linked below, and the history of the redesign in `docs/product/mobile-redesign-brief.md`.

Mobile is the target and must be fully functional as an installed iPhone PWA. Desktop only needs to stay consistent with mobile. Registration is the product: it must be fast, practical and accessible above everything else.

Decisions: `0030-allow-charts-in-trends.md`, `0031-use-neutral-variation-color.md`, `0032-add-waist-sleep-disposition-and-notes-fields.md`, `0033-use-bottom-navigation.md`, `0034-support-light-dark-and-system-themes.md`, `0035-use-seven-day-weekly-target.md`. The component library decision is still `0026-use-radix-ui-components.md`; the project tokens own every color and Radix Themes is kept only for behavior and the components not yet redone, following the resolved theme (see the update section in that ADR).

## Principles

- Minimal: low density, generous whitespace, no gradients, no glow, no decorative filler (greetings, health scores, mascots, 3D figures, judgment labels such as "Good" or "Normal").
- Changes are never classified as good or bad.
- All interface copy is `pt-BR`, casual, direct and short. Repo text stays English.
- Touch targets are at least 44px. Inputs use 16px or larger text so iOS does not zoom.
- Zoom is disabled (pinch, double-tap and focus auto-zoom) at the owner's choice, to behave like a native app; form controls stay at 16px or more.
- Respect `prefers-reduced-motion`.

## Navigation

Bottom tab bar: Início, Histórico, a central add button, Tendências, Ajustes (`0033-use-bottom-navigation.md`).

- The bar sits in the layout flow (full-height flex column, not `position: fixed`), with safe-area bottom padding, a solid background and a thin top border.
- Each tab is an icon (Phosphor) above a 12px label. The active tab uses the accent color and `aria-current="page"`.
- In the tab layout, switching tabs and opening or closing the registration screen replace the history entry instead of pushing, because the iOS edge-swipe gesture follows browser history and native tab apps do not stack tabs. Cancelar returns to the origin tab (kept in location state), save and delete go to Início, and a future desktop layout without the bottom bar may use normal history.
- Only the tab content area rubber-bands at its edges on iOS; the page itself does not, so the tab bar never moves. The registration screen scrolls the page, so it has no rubber-band.
- The central button is a 52px accent circle on the same plane as the bar, without a label, `aria-label="Registrar medida"`. It opens today's registration. No floating action button and no gear menu.
- The bar is hidden on Login and on the registration screen.
- Each main screen starts with a large bold page title that takes focus on navigation.

## Screens

### Login

The "BodyLog" title, a password field labeled "Senha" and an "Entrar" button. An empty submit shows "Digite a senha."; a wrong password shows "Senha incorreta. Tente de novo." in a reserved slot under the field and marks the field invalid. Successful login goes to Início.

### Início

1. Today card, titled "Hoje · qui, 12 nov".
   - Without a record: "Sem medida hoje." with the last record ("Última: ter, 10 nov · 72,6 kg.") and a full-width "Registrar hoje" button.
   - With a record: a ghost "Editar" button, today's weight as a large value, and a three-column grid with gordura, músculo, metabolismo, cintura, sono and disposição (an em dash when a value is missing).
2. "Esta semana" card.
   - Header with the count of recorded days up to today as `4/7`. Below it, seven day dots with the letters S T Q Q S S D (Monday to Sunday): filled means recorded, hollow means missing, dimmed means future.
   - The current day has its letter in the accent color (bold) and an accent ring around its dot, separated from the dot by a surface-colored gap.
   - A line with the comparison week and its count: "vs 2–8 nov · 6/7".
   - One row per metric, in this order: peso, gordura, músculo, cintura, sono, disposição. Each row shows the weekly average (partial current week) and a neutral variation chip against the previous full week.

While loading, Início draws both cards with dashes and hollow dots so nothing shifts; a failed request shows its message and "Tentar de novo" inside the affected card, in the space the content would take. The weekly card uses `current` and `previous` only, so it always describes the actual current week.

The weekly block has no metabolism or derived values: metabolism shows only in the Today card, the registration screen and Tendências, and BMI, fat kg and muscle kg in edit mode and Tendências (BMI).

### Histórico

- Weeks listed newest first, each in its own card with a title row: the period and the count of recorded days, for example "9–15 nov · 4/7". Weeks start on Monday.
- Column headings above the list: Peso, Gordura, Músculo.
- The first row of a card is a "Média" row on a tinted background with the week's average weight (kg), body fat (%) and muscle (%), aligned to the daily columns.
- Then one row per recorded day, newest first: date with weekday ("seg 09/11"), weight, fat, muscle, and a small note icon (with a screen-reader label) when the record has notes. A missing value is an em dash.
- Tapping a row opens that date in the registration screen in edit mode. No inline actions.
- Paging: only weeks with records are listed, 8 weeks per page. A "Carregar mais" button below the last card appends the next 8 older weeks and disappears on the last page; it stays in place and shows "Carregando…" while loading. Weeks are paged whole, so each average matches the one in Início.
- Empty: a card with "Nenhuma medida ainda." and a "Registrar hoje" button that opens the registration screen for today.
- Loading and error: one placeholder week card with dashes keeps a real card's height; a failed load shows the message and "Tentar de novo" inside it.

### Registro

Full-screen route (for example `/registro?data=YYYY-MM-DD`), outside the tab layout. The page scrolls with the document: the header (Cancelar and date bar) is sticky at the top and the footer is fixed at the bottom. The scrollbar is hidden, since the document scrollbar would run under both and a page cannot inset it.

- Header: "Cancelar", then the date bar with a previous-day arrow, the date label ("qui, 12 nov") and a next-day arrow. The arrows are 44px circles; next is disabled on today. Tapping the date label (a button) opens a bottom-sheet calendar (react-day-picker, ADR 0038) styled after the iOS calendar: month title with previous/next buttons, weeks starting on Monday, the selected day as a filled accent circle, today in the accent color and a small dot under each day that already has a measurement (read aloud as ", com medida"). Future days are disabled and the calendar cannot go past the current month. Choosing a day closes the sheet and goes to that date through the same discard check as the arrows; choosing the current day just closes it.
- A badge states the mode: "Nova medida" or "Editando medida de DD/MM". Selecting a date with a record loads it for editing; a date without one shows an empty form.
- Sections in order, each in a card:
  1. Balança: peso (kg), gordura (%), músculo (%), metabolismo (kcal).
  2. Calculados, only in edit mode: IMC, gordura (kg) and músculo (kg), read only, computed from the current weight and percentages.
  3. Medidas: cintura (cm).
  4. Como você está: sono (h, captioned "noite passada") and disposição.
  5. Notas: a multi-line text area with the placeholder "Opcional".
- Only weight is required.
- "Excluir medida" appears at the end only in edit mode (see states below).
- Footer: a full-width submit button fixed at the bottom: "Salvar" when creating and "Atualizar" when editing an existing record ("Salvando…" and "Atualizando…" while submitting).
- While the iOS keyboard is open the footer is hidden (the keyboard is detected when the visual viewport is more than 100px shorter than the layout viewport); the user closes the keyboard with "OK" to reach Salvar/Atualizar. iOS PWAs cannot pin elements to the visible area while the keyboard is open without an inner-scroll container, which breaks native focus scrolling and keyboard field navigation, so for the same reason the sticky header can also scroll out of view while the keyboard is open. The page keeps bottom padding equal to the footer height, and iOS scrolls the focused field into view natively; the app adds no scroll of its own on focus.

#### Input patterns

- Numeric fields use a right-to-left digit mask with a fixed decimal: digits fill from the right and the comma is inserted automatically, so typing `724` shows `72,4`. One decimal for weight, fat, muscle, waist and sleep; none for metabolism. Leading zeros are dropped and input is capped at 4 digits (3 for sleep). Typed digits always append regardless of the caret position, delete removes the last digit, delete over a selection clears the field, and pasting a number such as `72,4` or `72.4` fills the field. The caret stays at the end.
- Every numeric input uses `inputMode="numeric"` (digits-only keypad), left-aligned labels with the value right-aligned in Geist Mono, and the unit beside the field.
- Each numeric field shows the previous record's value as a discreet hint ("anterior: 72,6"), never prefilled. For disposição the hint is the previous value as well.
- Sleep has − and ＋ stepper buttons in 0.5 h steps around an editable digits-only input, bounded to 0–24 h. Pressing the buttons does not take focus from a focused input, so the iOS keyboard stays open; they remain focusable buttons for keyboard and screen-reader use. The field starts empty; the first tap on either button fills the previous recorded value (7,0 when there is none) and later taps step from the current value.
- Disposição is five segmented buttons, 1 to 5, with captions only at the ends: "Indisposto" (1) and "Disposto" (5). Tapping the selected value clears it.
- Field advance on iPhone relies on the keyboard accessory arrows; the digits-only keypad has no "Next" key.
- Notes are trimmed on save.

#### Validation

Hard limits that block saving: weight 20–300 kg, fat and muscle 1–80%, metabolism 500–5000 kcal, waist 30–250 cm, sleep 0–24 h. The error appears in a reserved slot under the field (no layout shift) once the field has been changed and left, or on save (an error already shown updates live while retyping), for example "Use um valor entre 20 e 300 kg."; a missing weight shows "Informe o peso.". The field is marked `aria-invalid`. On save with errors, focus moves to the first invalid field and it is scrolled into view. There are no "unusual value" warnings beyond the previous-value hint.

#### Discard, date navigation and delete

- Changing the date (arrows or date picker) or tapping "Cancelar" with unsaved changes opens a dialog: "Descartar alterações?" / "Os valores digitados nesta medida serão perdidos.", with "Continuar editando" (initial focus, also what Escape does) and a danger "Descartar". Without changes the date loads or the screen closes immediately. Cancel returns to the tab the user came from.
- "Excluir medida" opens "Excluir medida de DD/MM?" / "Esta medida será removida do histórico.", with "Cancelar" (initial focus, also Escape) and a danger "Excluir". Confirming deletes, returns to Início and shows the toast "Medida de DD/MM excluída".
- Dialogs are `alertdialog` with a scrim, trapped focus, the page behind marked inert, and focus returned to the opener.
- Saving returns to Início and shows the toast "Medida de DD/MM salva"; the Today card reflects the new values.

### Tendências

(`0030-allow-charts-in-trends.md`)

- A metric selector (peso, gordura, músculo, cintura, sono, disposição, metabolismo, IMC) and a segmented period control: 14d, 30d, 90d, 1 ano, Tudo.
- A summary card with the average over the period and a neutral chip comparing the first and last week of the period ("Sem comparação" with fewer than two weeks).
- One line chart (hand-drawn SVG, about 240px tall): daily points in a muted neutral tone, the weekly average as an accent line with weekly dots, light grid lines and Geist Mono axis labels. No "ideal" bands. Touching or dragging over the chart moves a marker and shows that day's value and its week average in a line above the chart; the legend names "Dia" and "Média semanal".
- When fewer than 3 points exist in the period the card shows "Ainda não há dados suficientes para este período." and, when the metric has data, the date it starts. When the metric's history is shorter than the period, the chart starts at the first record and a note says so.
- A collapsed "Ver médias semanais como tabela" section lists week, average and days as an accessible table alternative.

### Ajustes

One card with: Tema (segmented Sistema, Claro, Escuro), "Exportar CSV", "Importar CSV" (opens the file picker) and a danger "Sair". Status feedback uses toasts (for example "CSV exportado", "24 medidas importadas"), not in-flow callouts.

## Variation display

(`0031-use-neutral-variation-color.md`)

A neutral chip with an arrow icon, a word and the magnitude: "Subiu 0,4 kg", "Caiu 0,3 p.p.", "Estável" (an equals icon), or "Sem comparação" when either week has no value. "Estável" means the change rounds to zero at the displayed precision (one decimal), with no per-metric thresholds; the magnitude is the difference of the rounded averages. Units: kg, p.p. for body fat and muscle percentages, cm, h and pts for disposição. The chip is gray on every metric; it never uses green or red, and the accent is never used for variations or data values.

## Visual system

### Themes and tokens

(`0034-support-light-dark-and-system-themes.md`)

Colors are CSS custom properties on `:root`. Light is the base; the dark values apply under `prefers-color-scheme: dark` unless light is forced, and when dark is chosen explicitly (`data-theme`). Ajustes offers System, Light and Dark.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f4f4f1` | `#111111` |
| `--surface` (cards) | `#ffffff` | `#1c1c1c` |
| `--surface-2` (chips, inputs) | `#f1f1ee` | `#272727` |
| `--fg` | `#161615` | `#f0f0f0` |
| `--fg-2` (secondary text) | `#5c5c57` | `#a6a6a6` |
| `--fg-3` (hints) | `#6b6b66` | `#949494` |
| `--line` | `#e6e6e1` | `#2e2e2e` |
| `--bar` (tab bar, footer) | `#ffffff` | `#161616` |
| `--danger` | `#b42318` | `#f2938b` |
| `--accent` | `#0969da` | `#58a6ff` |
| `--accent-fg` (on accent) | `#ffffff` | `#0b1a2e` |
| `--accent-tint` | `#ddf4ff` | `#172a42` |

Dark uses neutral grays (no blue tint) and cards have no border or shadow, separated by surface tone. Light cards are white with a very soft shadow and about 16px radius. The prototype also defines segmented-control and chart-dot tokens; take them from the prototype's `:root` blocks.

### Accent

The default accent is "Azul vivo": `#58a6ff` in dark and `#0969da` in light (`#58a6ff` on white is about 2.6:1 contrast). It is used only for the primary button, focus rings, the active tab and central add button, the selected disposição value, the today marker on Início, the mode badge tint and the weekly line of the trend chart. It is exposed as `--accent`, `--accent-fg` and `--accent-tint` so it changes in one place. The prototype's other accents (lime, muted blue, amber, switchable only from its prototype panel) were evaluation candidates and are not a product option.

### Typography

Geist for text and Geist Mono with tabular figures for every number, both self-hosted. Large bold titles (34px), the today weight at 44px, metric rows at 22px, units small and secondary next to the value.

### Icons

Phosphor. The prototype draws simple stand-ins on a 24px grid with a 1.6px stroke (2px for the active tab).

### Toasts

A pill above the tab bar, inverted colors (`--fg` on `--bg`), about 2.6 seconds, `role="status"`. Used for save, delete, import and export feedback.

Failures (save, delete, export, import, and a CSV import with row errors) use the same pill but stay until the user closes them with a "Fechar" (×) button, show the full error text and are announced with `role="alert"`. On Registro, which has no tab bar, the toast sits above the bottom action area; a failed save or delete stays on Registro. A new toast replaces the current one.

## Formatting

`pt-BR`: decimal comma, `72,4 kg`, `18,6%`, dates as `DD/MM` in labels and `seg 09/11` in lists, week ranges as `9–15 nov`. Unavailable values are an em dash. Internal storage and API payloads stay numeric values and ISO dates.

## States

- Empty: Início and Histórico offer "Registrar hoje"; Tendências shows the "not enough data" message. The empty Histórico is not drawn in the prototype.
- Validation and error: inline and reserved-space, see Registro.
- Confirmation: discard and delete dialogs, see Registro.
- Feedback: toasts.
- Loading, submitting and request-error states are not drawn in the prototype and are defined in the implementation tasks, following the same patterns: reserved space, no layout shift, errors in text and not color alone.

## Open points

- None open.
