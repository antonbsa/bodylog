# Development Guide

## Documentation and Task Workflow

This project separates stable knowledge from executable work.

- Use `docs/` for product, architecture, technical decisions, and durable project documentation.
- Use `specs/` for version-level specifications, acceptance criteria, implementation strategy, open questions, and executable tasks.
- Use `specs/v1/tasks/` for V1 task files.

## Task Files

Tasks are plain markdown files. Keep them small, explicit, and tied to the V1 spec or a documented decision.

Suggested task structure:

```txt
# T-000 — Task Title

## Status

To Do

## Description

## Acceptance Criteria

## Definition of Done

## Validation Notes
```

## Implementation Loop

1. Read the related docs and specs.
2. Read the selected task under `specs/v1/tasks/`.
3. Clarify the implementation plan in the task when needed.
4. Implement only the selected task.
5. Run relevant automated checks.
6. Update the task with validation notes and modified files.
