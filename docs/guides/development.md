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

## Local D1 Data

Local development uses Cloudflare D1 through Wrangler.

Prepare a local database for feature work:

```sh
npm run db:setup:local
```

This command applies local D1 migrations and seeds the default mock measurements only when the local `measurements` table is empty. It is safe to run repeatedly.

`npm run dev` does not run migrations or seed data. Keep database setup explicit so starting local servers does not unexpectedly change development data.

Seed or update the default mocked measurements:

```sh
npm run db:seed:local
```

Reset local measurements and seed them again:

```sh
npm run db:reset:local
```

`db:reset:local` is local-only but intentionally destructive: it clears local measurements before recreating the default seed data.

The seed script generates dates relative to the current date. For deterministic checks, pass an explicit date:

```sh
npm run db:seed:local -- --today 2026-06-11
```

See `scripts/local-db/README.md` for the seed data shape and command details.
