---
status: Superseded
area: process
supersedes: ["0020"]
superseded-by: ["0036"]
---

# 0021 — Use Markdown Tasks Under Specs

## Status

Superseded by `0036-track-tasks-only-as-github-issues.md`

## Context

The project needs task tracking, but V1 is still small. A separate task-management tool and generated backlog structure add more process than the project currently needs.

The useful part of the previous task structure is the content shape: task title, status, scope, acceptance criteria, definition of done, and validation notes.

## Decision

Use plain markdown files under `specs/v1/tasks/` for executable V1 tasks.

Keep `docs/` for durable product, technical, and architectural knowledge. Keep `specs/v1/` as the version-level package containing the V1 spec, acceptance criteria, implementation plan, open questions, and tasks.

## Consequences

The repository avoids an extra task-management dependency and keeps V1 planning easy to inspect in plain markdown.

Task files should stay small and should not duplicate the full product requirements. Detailed product and technical truth remains in `docs/`; task files point to specific implementation work.
