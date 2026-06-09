# T-006 — Configure Frontend

## Status

Done

## Description

Configure the `apps/web` workspace as the React + Vite + TypeScript frontend base.

This task creates only the initial renderable frontend shell. Authenticated flows, dashboard data, measurement UI, PWA manifest/icons, CI, and deployment automation stay in their later dedicated tasks.

## Implementation Plan

- Add React, React DOM, Vite, and the Vite React plugin to the web workspace.
- Add web workspace scripts for local development, typecheck, and production build.
- Add a minimal Vite config, HTML entrypoint, React entrypoint, and mobile-first initial page.
- Add minimal global styles aligned with the documented V1 dark UI direction.
- Add root scripts for running and building the web workspace if needed.
- Validate typecheck, tests, E2E tooling, and frontend build.

## Why
This task advances BodyLog V1 during the Project Base phase.
## Scope
Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.
## Out of Scope
Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.
## Validation

Automated checks:

- `npm run build:web`
- `npm run typecheck`
- `npm run test:api`
- `npm run test:e2e`

The first E2E run failed because the local Playwright Chromium binary was missing. Ran `npx playwright install chromium`, then reran `npm run test:e2e` successfully.

## Implementation Notes

- Configured `apps/web` with React, React DOM, Vite, and the Vite React plugin.
- Added web workspace scripts for dev, build, preview, and typecheck.
- Added root scripts for `dev:web`, `build`, and `build:web`.
- Added a minimal Vite HTML entrypoint and React render path.
- Added a static mobile-first initial page using the documented dark V1 UI direction and `pt-BR` visible copy.
- Added Playwright web server configuration and a browser smoke test for the initial page.
- Ignored Playwright output directories.

## Modified Files

- `.gitignore`
- `README.md`
- `apps/web/index.html`
- `apps/web/package.json`
- `apps/web/src/App.tsx`
- `apps/web/src/env.d.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `specs/v1/implementation-plan.md`
- `specs/v1/tasks/README.md`
- `tests/e2e/tooling.spec.ts`
- `specs/v1/tasks/t-006-configure-frontend.md`


## Acceptance Criteria

- [x] React + Vite working.
- [x] TypeScript working.
- [x] Build working.
- [x] Initial page renders.


## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
