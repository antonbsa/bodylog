---
status: Accepted
area: web
amends: ["0022"]
---

# 0034 — Support Light, Dark and System Themes

## Status

Accepted

## Context

`0022-decide-v1-ui-direction.md` made dark mode the only theme. The redesign was tested on an iPhone, where following the system setting is expected, and a light theme was part of the references the owner liked.

## Decision

Support light and dark themes, following the system by default, with a manual override in Ajustes: Sistema, Claro, Escuro.

- Colors are CSS custom properties on `:root`; the dark values apply under `prefers-color-scheme: dark` unless the user forced light, and under an explicit dark choice.
- Dark uses neutral grays (no blue tint), with cards separated by surface tone instead of border or shadow. Light uses white cards with a very soft shadow.
- One accent color, "Azul vivo": `#58a6ff` in dark and `#0969da` in light (`#58a6ff` on white is about 2.6:1, too low). It is used only for the primary action, focus, active state and the weekly average line of the trend chart, and never colors data values or variations.
- The accent is tokenized (`--accent`, `--accent-fg`, `--accent-tint`) so it can change in one place. The other candidates tried in the prototype (lime, muted blue, amber) were for evaluation and are not user options.
- Typography is Geist for text and Geist Mono with tabular figures for numbers, self-hosted.

## Consequences

"Dark mode only", the GitHub-like palette and Inter fallback from `0022-decide-v1-ui-direction.md` no longer apply. Every screen and state must be checked in both themes, and text must keep adequate contrast in each.

`docs/product/ui-direction.md` holds the token values and the prototype is the visual reference.
