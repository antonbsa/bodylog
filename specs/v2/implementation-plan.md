# BodyLog V2 Implementation Plan

This file tracks the V2 implementation strategy at the version/spec level.

Executable tasks live as plain markdown files under `specs/v2/tasks/`. Do not turn this file into a detailed task board.

## Phase 1 — Code Polish

Goal: clean up internal architecture so the codebase is easier to extend.

Focus areas:

- backend domain model refactor: `Measurement` domain object, `WeekSummary`
  and `WeekComparison` value objects;
- repository returns domain objects, not raw DB row types;
- service layer operates on domain objects.

## Phase 2 — UI/UX Polish

Goal: consistent component library usage and improved mobile experience.

Focus areas:

- Radix UI adoption across remaining components;
- UX improvements identified during V1 production use.

## Phase 3 — Non-Blocking MVP Features

Goal: deliver deferred MVP features that do not require multi-user or Postgres.

Focus areas:

- TBD based on priority during V2 planning.
