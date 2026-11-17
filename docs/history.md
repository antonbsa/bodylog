# Project History

How BodyLog got to its current shape. Current behavior is in [Product](product.md) and [UI direction](product/ui-direction.md); the reasoning behind each change is in the [decisions](decisions/README.md).

## Replacing the Spreadsheet

Started in May 2026 with a lightweight spec-driven workflow (`0001-use-lightweight-sdd.md`), with executable work as markdown task files (`0021-use-markdown-tasks-under-specs.md`). The first release delivered the measurement form, the history list, the weekly dashboard with the partial-week comparison, CSV import and export, single-password auth, a basic PWA and deployment to Cloudflare Pages plus a separate API Worker (`0019-use-cloudflare-pages-and-separate-worker.md`).

## Mobile Redesign

Agreed on 2026-11-11 and shipped on 2026-11-15 as parent issue #23 with sub-issues #24–#30, from a written brief that this section summarizes.

### Why the First Redesign Stalled

- The generated design system had no real brief: its "Problems" and "Desired Changes" input was left blank, so the generator decided on its own.
- It was built from tokens and components outward, not from the daily ritual. Hierarchy was wrong and the measurement entry flow, the core of the app, was not practical, fast or accessible enough.
- It dropped data the owner tracks (week-over-week comparison context, derived values) and left many states undesigned: edit existing date, delete, empty, loading, error, validation, light theme.
- A follow-up attempt merged several tasks and a form rewrite into one pass, was never compared visually against the mocks, and regressed date entry to day-by-day stepping only.

### Principles

- Mobile is the target and must be fully functional on an installed iPhone PWA; desktop only needs to stay consistent with mobile.
- Registration is the product: fast, practical and accessible above everything else.
- Minimalism: low density, generous whitespace, no vibrant colors, gradients, glow or decorative filler (greetings, health scores, mascots, judgment labels).
- Changes are never classified as good or bad.

References: a minimal body measurements app (neutral near-black surfaces, a single accent, large page titles, neutral delta chips, a bottom tab bar with a central add button) and an airy light-theme health tracker shot (white cards with a large radius and very soft shadow, big numerals with small units), without its greeting, health score, judgment labels or 3D figures.

### What Changed

- A bottom tab bar (Início, Histórico, Tendências, Ajustes) with a central add button replaced the single dashboard (`0033-use-bottom-navigation.md`), and registration became a full-screen route with a calendar bottom sheet (`0038-use-react-day-picker-for-registration-calendar.md`).
- Light, dark and system themes (`0034-support-light-dark-and-system-themes.md`) and one neutral tone for every variation (`0031-use-neutral-variation-color.md`).
- New optional fields: waist, sleep, disposition and notes (`0032-add-waist-sleep-disposition-and-notes-fields.md`).
- A 7-day weekly target with real day dots replaced the Baixa/Média/Alta reliability label (`0035-use-seven-day-weekly-target.md`).
- One line chart at a time on Tendências, reversing the "no charts" rule (`0030-allow-charts-in-trends.md`).
- Weekly variation computed in the UI (`0039-compute-weekly-variation-in-the-ui.md`) and server state through TanStack Query (`0037-use-tanstack-query-for-server-state.md`).

### How It Was Run

An interactive HTML prototype with fake data, now [`product/prototype/mobile-redesign.html`](product/prototype/mobile-redesign.html), was tested on the iPhone and approved before any code. Task tracking moved to GitHub issues only (`0036-track-tasks-only-as-github-issues.md`): one sub-issue per task, each validated by a screenshot against the prototype before closing, all on one branch with one commit per task.

## Since Then

Parent issue #32 aligns delivery and the repo workflow with `antonbsa/twitch-radar`: the API Worker serves the web app (`0040-serve-the-web-app-from-the-api-worker.md`), CI split into reusable workflows, nested `AGENTS.md` files with guard hooks, these docs organized by reader moment, and, still ahead, a preview environment with release-gated production deploys and daily encrypted D1 backups.
