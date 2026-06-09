# T-005 — Create Project Structure

## Status

Done

## Description

Create the initial npm workspace project structure for the separate API and frontend applications.

The API Worker now lives under `apps/api`. The frontend has a TypeScript workspace placeholder under `apps/web` and will be configured with React/Vite in T-006.

## Why

This task advances BodyLog V1 during the Project Base phase.

## Scope

Set up the repository structure, TypeScript configuration, unit test tooling, E2E test tooling, and root scripts needed before frontend and domain implementation continue.

## Out of Scope

Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.

Do not implement the React/Vite frontend screen in this task.

Do not select or install a UI component library in this task.

## Validation

Automated checks:

- `npm run typecheck`
- `npm run test:api`
- `npm run test:e2e`
- `npm --workspace @bodylog/api run deploy -- --dry-run --outdir /tmp/bodylog-wrangler-dry-run`

`npm install` completed and updated the lockfile for workspaces and Playwright. npm audit reported one critical vulnerability in the dependency tree; no forced audit fix was applied because that can introduce breaking dependency changes outside this task.

## Acceptance Criteria

- [x] Create frontend/backend structure.
- [x] Configure TypeScript.
- [x] Configure unit test tooling.
- [x] Configure E2E test tooling.
- [x] Configure main scripts.
- [x] Add initial technical README notes if needed.

## Decision Summary

- Use npm workspaces under `apps/*`.
- Keep the root package as the main command entry point.
- Move Hono Worker code to `apps/api/src`.
- Add a frontend workspace placeholder under `apps/web`.
- Keep automated tests under the root `tests/` directory.
- Use Vitest for API/unit tests.
- Use Playwright for E2E tooling.

## Modified Files

- `README.md`
- `apps/api/package.json`
- `apps/api/src/index.ts`
- `apps/api/tsconfig.json`
- `apps/web/package.json`
- `apps/web/src/env.d.ts`
- `apps/web/tsconfig.json`
- `docs/technical/architecture.md`
- `docs/technical/decisions/0023-use-npm-workspaces-project-structure.md`
- `docs/technical/deployment.md`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `specs/v1/implementation-plan.md`
- `specs/v1/open-questions.md`
- `tests/api/index.test.ts`
- `tests/e2e/tooling.spec.ts`
- `tests/e2e/tsconfig.json`
- `tests/tsconfig.json`
- `tsconfig.base.json`
- `tsconfig.json`
- `vitest.config.ts`
- `wrangler.toml`

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
