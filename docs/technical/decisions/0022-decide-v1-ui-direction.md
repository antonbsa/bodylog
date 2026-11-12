# 0022 — Decide V1 UI Direction

## Status

Superseded by `0030-allow-charts-in-trends.md`, `0033-use-bottom-navigation.md` and `0034-support-light-dark-and-system-themes.md`

## Context

Frontend screen implementation needs a clear direction before dashboard, form, and history work begins.

The app should replace a spreadsheet workflow for quick mobile logging and weekly progress review. It should not become a generic fitness tracker or add advanced interpretation in V1.

## Decision

Use the UI direction documented in `docs/product/ui-direction.md`.

Key decisions:

- the authenticated V1 app is a single dashboard page;
- dashboard sections include weekly summary cards, measurement history, and actions;
- the measurement form opens from the dashboard as a full-viewport mobile modal or constrained desktop modal;
- dark mode is the only V1 theme;
- visible labels and interface copy use `pt-BR`;
- summary uses cards, history uses a table or table-like layout, and inputs use forms;
- icons use Phosphor Icons;
- typography uses Geist with Inter fallback;
- visual references are GitHub, Vercel, and Cloudflare product interfaces;
- component library selection is deferred until frontend setup or first concrete UI implementation.

## Consequences

Frontend tasks should implement one dashboard experience instead of separate authenticated dashboard/history pages in V1.

The UI should avoid charts, strong gradients, heavy glassmorphism, gamified visuals, generic motivational copy, and AI-assistant-style patterns.

Future versions can add separate pages, i18n, configurable goals, desktop-optimized dashboards, charts, and richer interpretation.
