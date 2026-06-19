# BodyLog V2 Implementation Plan

This file tracks the V2 implementation strategy at the version/spec level.

Executable tasks live as plain markdown files under `specs/v2/tasks/`. Do not turn this file into a detailed task board.

## Phase 1 — Code Polish

Goal: clean up internal architecture so the codebase is easier to extend.

Focus areas:

- backend domain model refactor: `Measurement` domain object, `WeekSummary`
  and `WeekComparison` value objects (T-029);
- repository returns domain objects, not raw DB row types;
- service layer operates on domain objects.

## Phase 2 — UI/UX Polish

Goal: consistent component library usage and improved mobile experience.

This phase is split into sequencing-sensitive tasks grouped around the redesign.
The groups must run in order because they touch the same surfaces (API entry
point, frontend shell, dashboard component, project layout) and would otherwise
conflict.

**Before the redesign:**

- **T-030 — API Liveness / Not-Found Pages**: drop the `service` field /
  `x-bodylog-api` header, add `GET /` as a liveness endpoint, remove health
  endpoints, and add a frontend not-found page.
- **T-031 — Force Fresh Data on Every PWA Open**: refetch on open/resume and stop
  serving stale cached data (manifest-only, no service worker).
- **T-032 — Increase History Window to 30 Items**.
- **T-033 — Restructure `infra/` Folder**: move `migrations/`, local-db
  `scripts/`, and add an `errors/` location, updating all references.
- **T-034 — Reusable Confirmation Dialog**: generalize the delete dialog and use
  it for both delete and logout.
- **T-035 — Structured Error Handling**: shared error module + consistent
  `{ name, message, action, statusCode }` shape across API and frontend (lives in
  T-033's `infra/errors/`).

**The redesign:**

- **T-036 — Apply Design System Redesign**: apply the
  `antonbsa/bodylog-design-system` tokens, typography, and component visuals
  across the web app, aligned with Radix Themes.

**After the redesign:**

- **T-037 — Measurement Form Polish**: mobile keyboard ergonomics, no-zoom,
  character fill, animated loading badge, clearer disabled inputs, persisted form
  state, and a bold delete date.
- **T-038 — Replace Callouts with Toast Notifications**: remove all `Callout`s;
  success/failure toasts for create/edit/delete/export/import, with failures
  staying open and exposing the full error (built on T-035's error shape).

## Phase 3 — Non-Blocking MVP Features

Goal: deliver deferred MVP features that do not require multi-user or Postgres.

Focus areas:

- TBD based on priority during V2 planning.
