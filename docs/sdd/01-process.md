# SDD Process

## Goal

Define a lightweight process for moving from idea to working V1 without over-documenting the project.

## Process Flow

1. Define the problem and product goal.
2. Define the V1 scope.
3. Write functional requirements.
4. Write minimum non-functional requirements.
5. Describe core user flows.
6. Define the initial data model.
7. Define the technical architecture.
8. Break the work into small tasks.
9. Implement one task at a time.
10. Validate implementation against acceptance criteria.
11. Update specs when behavior or decisions change.

## Main Rule

No meaningful implementation should start without:

- a clear goal;
- an associated requirement or decision;
- acceptance criteria;
- a small implementation task.

## Documentation Update Rules

Update docs when:

- a requirement changes;
- a feature moves in or out of V1;
- an API contract changes;
- the data model changes;
- a technical decision changes;
- implementation behavior diverges from the spec.

Do not update docs for:

- minor refactors that do not change behavior;
- internal naming changes with no product impact;
- temporary local debugging steps.

## Implementation Loop

For each task:

1. Read the relevant requirement and acceptance criteria.
2. Implement the smallest useful change.
3. Run checks/tests when available.
4. Manually validate the behavior if tests do not exist yet.
5. Mark the task as complete or record what remains.

## Ambiguity Rule

If ambiguity blocks implementation, stop and document the question.

If ambiguity does not block implementation, choose the simplest option that satisfies the current V1 and document the assumption if it may matter later.

## Scope Control

Ideas that are useful but not required for V1 must go to `docs/product/04-backlog.md`.

Backlog items are not implementation permission. They require explicit selection before being built.
