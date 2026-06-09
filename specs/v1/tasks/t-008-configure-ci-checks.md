# T-008 — Configure CI Checks

## Status

Done

## Description
Add GitHub Actions CI for the V1 npm workspace.

## Why
This task advances BodyLog V1 during the Project Base phase.
## Scope
Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.
## Out of Scope
Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.
## Validation
Run the relevant automated checks for the changed area. If automated coverage is not practical yet, record the manual validation performed in this task.

Automated checks:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e`

Local validation notes:

- Initial `npm run typecheck` failed before dependencies were installed because React packages were missing from `node_modules`.
- Ran `npm ci`, then `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` successfully.
- Initial `npm run test:e2e` failed because the local Playwright Chromium binary was missing.
- Ran `npx playwright install chromium`, then reran `npm run test:e2e` successfully.

## Implementation Notes

- Added a single GitHub Actions workflow at `.github/workflows/ci.yml`.
- The workflow runs for pull requests targeting `main`.
- The workflow runs for direct pushes to `main`.
- Push events on `main` that are associated with a pull request are skipped by a scope guard job.
- The CI job installs dependencies with `npm ci`, installs Playwright Chromium dependencies, then runs typecheck, lint, unit/API tests, frontend build, and E2E tests.
- CI does not require repository secrets.

## Modified Files

- `.github/workflows/ci.yml`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-008-configure-ci-checks.md`

## Acceptance Criteria

- [x] Workflow runs on pull requests targeting `main`.
- [x] Workflow runs on direct pushes to `main`.
- [x] Workflow installs dependencies reproducibly.
- [x] Workflow runs typecheck.
- [x] Workflow runs unit/API tests.
- [x] Workflow runs E2E tests once E2E tooling exists.
- [x] Required workflow secrets, if any, are documented.


## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
