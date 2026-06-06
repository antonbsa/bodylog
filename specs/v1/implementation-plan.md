# BodyLog V1 Implementation Plan

This file tracks the V1 implementation strategy at the version/spec level.

Executable tasks live as plain markdown files under `specs/v1/tasks/`. Do not turn this file into a detailed task board.

## Phase 0 — Technical Validation

Goal: remove risks that could block the architecture.

Completed validation:

- Hono API base on Cloudflare Workers.
- Local and remote D1 validation.
- Initial deployment strategy: Cloudflare Pages frontend with a separate Worker API.

## Phase 1 — Project Base

Goal: create the minimum app structure.

Completed planning:

- V1 UI direction for the single dashboard page, modal measurement form, visual language, and UI constraints.
- npm workspace structure with `apps/api`, `apps/web`, `tests/api`, and `tests/e2e`.

Focus areas:

- frontend/backend project structure;
- React/Vite frontend base;
- TypeScript and test tooling;
- CI checks;
- basic PWA setup;
- documented environment variables and secrets.

## Phase 2 — Database and Domain

Goal: implement persistence and core rules.

Focus areas:

- measurement repository;
- derived metric calculations;
- weekly grouping and averages;
- weekly comparison logic;
- focused unit and repository tests.

## Phase 3 — Authentication

Goal: protect personal data.

Focus areas:

- login endpoint and screen;
- password from environment/secret;
- secure session handling;
- protected data routes;
- logout.

## Phase 4 — Measurement CRUD

Goal: enable daily use.

Focus areas:

- list, fetch-by-date, upsert-by-date, and delete endpoints;
- mobile-first measurement form;
- existing-date edit behavior;
- measurement history list;
- delete confirmation.

## Phase 5 — Weekly Dashboard

Goal: deliver the main analytical value of V1.

Focus areas:

- weekly dashboard API;
- current week and previous week summaries;
- variation display;
- V1 expected-outcome up/down/stable direction indicators;
- partial week and measurement count display.

## Phase 6 — CSV Export

Goal: provide manual backup.

Focus areas:

- CSV export endpoint;
- export UI action;
- documented CSV format validation.

## Phase 7 — CSV Import

Goal: populate historical spreadsheet data.

Focus areas:

- CSV upload endpoint;
- header and row validation;
- upsert by date;
- import summary;
- import UI action.

## Phase 8 — Final Validation

Goal: close a usable V1.

Focus areas:

- full user flow validation;
- mobile UX review;
- PWA installability;
- Cloudflare deployment automation;
- deployed production state validation;
- final docs/spec updates.
