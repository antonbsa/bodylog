# 0020 — Use Backlog Directory for Executable Tasks

## Status

Accepted

## Context

The project uses lightweight SDD. Long-term docs and execution-level task tracking had started to mix under `docs/implementation`, which makes the documentation harder to maintain and review.

## Decision

Use `docs/` for product, technical, architectural, and planning knowledge. Use `backlog/` for executable implementation tasks, task progress, and delivery tracking.

## Consequences

Implementation task files live under `backlog/`. `docs/implementation` keeps high-level planning and validation context, but detailed task tracking should not be added back there.
