# 0033 — Use Bottom Navigation

## Status

Accepted

## Context

`0022-decide-v1-ui-direction.md` chose a single dashboard page with the measurement form as a modal. The redesign adds history, trends and settings, and registration has to work well one-handed on an installed iPhone PWA.

## Decision

Use separate screens with a bottom tab bar: Início, Histórico, a central add button, Tendências and Ajustes.

- The bar is part of the layout flow (a full-height flex column), not `position: fixed`, with safe-area bottom padding, a solid background and a thin top border.
- Each tab is a Phosphor icon above a 12px label; the active tab uses the accent and `aria-current="page"`.
- The central button is a 52px accent circle on the same plane as the bar, labeled "Registrar medida" for assistive technology, and opens today's registration.
- Registration is a full-screen route outside the tab layout (no tab bar), with "Cancelar", the date, and a fixed "Salvar" button. It replaces the modal.
- No floating action button and no gear menu.

## Consequences

The "single dashboard page" and "form as modal" decisions of `0022-decide-v1-ui-direction.md` no longer apply. The frontend needs routes for the four tabs, login and registration (for example `/registro?data=YYYY-MM-DD`).

The first screen question stays the same: current week summary and a quick way to register today.
