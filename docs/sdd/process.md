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
8. Break the work into small tasks under `backlog/`.
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
3. Add or update automated tests for the implemented behavior.
4. Run the relevant checks/tests.
5. Manually validate behavior that cannot reasonably be automated yet.
6. Move or update the task under `backlog/` to reflect what remains.

## Testing Rule

Automated tests are expected to be implemented together with features, not postponed to final validation.

- Test files should live under the root `tests/` directory.
- Domain rules should have unit tests.
- API, repository, and authentication behavior should have backend tests.
- Completed browser flows should have E2E tests.
- Final validation should confirm the full V1 path still works, but it should not be the first time a feature is tested.

## Ambiguity Rule

If ambiguity blocks implementation, stop and document the question.

If ambiguity does not block implementation, choose the simplest option that satisfies the current V1 and document the assumption if it may matter later.

## Scope Control

Ideas that are useful but not required for V1 must go to `docs/product/future-ideas.md`.

Future ideas are not implementation permission. Executable implementation work belongs under `backlog/` and requires explicit selection before being built.
