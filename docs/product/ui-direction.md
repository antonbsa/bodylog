# UI Direction

## Purpose

This document defines the V1 interface direction before frontend screen implementation starts.

V1 should be a simple, mobile-first daily logging and weekly progress interface that replaces the spreadsheet workflow without becoming a generic fitness tracker.

## Information Architecture

The authenticated V1 app is a single dashboard page.

The dashboard contains:

- current week summary cards;
- recent measurement history;
- primary action to register a new measurement;
- CSV import/export actions when those V1 features are implemented.

The measurement form opens from the dashboard. On mobile it should behave as a full-viewport modal or sheet. On desktop it can use a constrained modal while keeping the same form behavior.

Separate authenticated pages for deeper history, settings, or import/export can be added later, but they are not part of the V1 UI direction.

## Initial Screen

When the authenticated user opens the app, the first screen should answer:

- What is my current week average weight?
- What are my current week average body fat and muscle values?
- Did those values go up, down, or stay stable compared with the previous full week?
- Can I quickly register today's measurement?

The weight summary is the primary metric. Body fat and muscle summaries are secondary metrics.

## Dashboard Summary

The summary section uses cards, not charts.

### Weight Card

The weight card is the main summary card and should be visually stronger than the body fat and muscle cards.

It displays:

- current partial week average weight;
- primary variation in kg;
- secondary relative variation in percent when available;
- current week registration count, displayed as `registered / available days so far`.

### Body Fat Card

The body fat card displays:

- current partial week average body fat percentage;
- corresponding body fat mass in kg when available;
- primary variation in percentage points;
- secondary body fat mass variation in kg when available.

### Muscle Card

The muscle card displays:

- current partial week average muscle percentage;
- corresponding muscle mass in kg when available;
- primary variation in percentage points;
- secondary muscle mass variation in kg when available.

## Weekly Comparison

The dashboard compares the partial current week against the previous full week.

If the previous week has no records, variation should be unavailable and displayed as `-`.

If the previous week has records but too few to be reliable, the comparison can still be displayed, but the previous week reliability state must also be visible.

## Registration Reliability

Weekly registration reliability is based on the absolute number of records in a week, regardless of how many days are available so far in the current week.

Reliability states:

- low: less than or equal to 2 records;
- medium: 3 or 4 records;
- high: more than or equal to 5 records.

The current week registration count should use:

```txt
registered records / available days so far in the current week
```

Example: if it is Tuesday and two records exist, display `2/2`, but reliability is still low because the absolute count is 2.

## Variation Rules

Each summary metric should indicate whether it increased, decreased, or stayed stable.

Stable thresholds:

- weight: less than `0.5 kg`;
- body fat mass: less than `0.4 kg`;
- muscle mass: less than `0.3 kg`.

For display:

- weight primary variation is kg;
- weight secondary variation is relative percentage;
- body fat primary variation is percentage points;
- body fat secondary variation is kg;
- muscle primary variation is percentage points;
- muscle secondary variation is kg.

Percentage metrics must display absolute percentage change as percentage points, not as relative percent, when comparing the displayed percentage value.

## Variation Color Semantics

V1 uses expected outcome color semantics for the summary cards:

- muscle increase: green;
- muscle decrease: red;
- body fat increase: red;
- body fat decrease: green;
- weight increase: green;
- weight decrease: red;
- stable: muted neutral with a slight directional tint when useful.

This is a V1 visual assumption because explicit user goals are not configured yet. Copy must stay factual and short. The app must not provide health advice, recommendations, diagnosis, or motivational interpretation in V1.

Future versions may add goal settings that change the weight color semantics.

## Measurement History

The history section uses a table or compact table-like list.

Default ordering is newest first.

Default visible amount is 20 rows. If more records exist, show an action to load 20 more.

Columns:

- `Data`;
- `Peso`;
- `IMC`;
- `BF (%)`;
- `BF (kg)`;
- `Músculo (%)`;
- `Músculo (kg)`;
- `RM`.

Each row includes an edit action. In edit mode, the form should expose update and delete actions. Delete requires confirmation.

On narrow screens, the implementation can use a responsive table pattern that preserves the same information without forcing horizontal scrolling as the only usable path.

## Measurement Form

The form opens with today's date pre-filled when creating a new measurement.

Fields:

- date;
- weight;
- body fat percentage;
- muscle percentage;
- resting metabolism.

Required fields:

- date;
- weight.

The form should use mobile-friendly inputs:

- date input should use `DD/MM/YYYY` in the UI and prevent future dates;
- numeric inputs should use decimal keyboards where supported;
- the user should be able to move quickly to the next input;
- weight accepts comma or period as decimal separator;
- weight supports one or two decimal places;
- weight is always in kg.

If the selected date already has a record, the form loads that record and enters edit mode.

Absurd values should show a warning before saving, but they should not block saving unless a later implementation task defines hard invalid limits.

## Empty, Loading, and Error States

Minimum component states:

- loading;
- empty;
- error;
- disabled;
- submitting.

When no data exists:

- summary cards show `-` for unavailable values;
- the history table shows a plain empty placeholder;
- registration reliability still follows the reliability rule based on the available count.

## Visual Direction

The UI should feel quiet, direct, and practical.

Use:

- dark mode only in V1;
- plain surfaces;
- adequate contrast;
- slightly rounded borders;
- restrained accent colors;
- clear data hierarchy;
- cards for summary metrics;
- table or table-like layout for history;
- form layout for data entry.

Avoid:

- strong gradient backgrounds;
- purple or blue neon gradients;
- heavy glassmorphism;
- glowing borders;
- generic motivational copy;
- floating AI assistant patterns;
- decorative animated blobs;
- gamified fitness visuals;
- complex animations.

## Language and Tone

All visible V1 labels and interface copy should be in `pt-BR`.

Tone should be casual, direct, short, and non-technical.

i18n is deferred to a later version.

## Formatting

Use `pt-BR` display formatting:

- weight: `72,5 kg`;
- variation: `+0,6 kg`;
- date: `04/06/2026`;
- body fat and muscle: `14,8%`;
- unavailable values: `-`.

Internal storage and API payloads should remain numeric values and ISO dates.

## UI Foundations

Icons:

- use Phosphor Icons for V1 UI icons.

Typography:

- use Geist as the primary font;
- use Inter as the fallback font.

Palette:

- use a dark neutral palette similar to GitHub, Vercel, and Cloudflare product interfaces;
- keep background and surfaces neutral;
- reserve green, red, orange, and blue for semantic UI feedback.

Suggested initial palette:

| Token | Color |
|---|---|
| Background | `#0d1117` |
| Surface | `#161b22` |
| Surface elevated | `#21262d` |
| Border | `#30363d` |
| Text primary | `#f0f6fc` |
| Text secondary | `#8b949e` |
| Accent | `#58a6ff` |
| Success | `#3fb950` |
| Warning | `#d29922` |
| Danger | `#f85149` |

Component library:

- do not install or commit to a full component library during T-004;
- choose the component library during frontend setup or the first concrete UI implementation task;
- candidates may include shadcn/ui, Radix primitives, or another small React-compatible option that fits the V1 direction.
