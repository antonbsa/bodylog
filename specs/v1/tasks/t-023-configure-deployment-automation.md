# T-023 — Configure Deployment Automation

## Status

Done

## Description

Configure GitHub Actions deployment automation for the selected Cloudflare
Pages frontend plus separate Cloudflare Worker API deployment strategy.

This task also adds the production CORS configuration needed for the deployed
Pages frontend to call the Worker API with credentialed session requests.

## Why
This task advances BodyLog V1 during the Final Validation phase.
## Scope
Complete the implementation work described by the task title and acceptance criteria. Keep changes focused on V1 behavior and the related project documentation.
## Out of Scope
Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.
## Validation

Automated checks:

- `npm run test:api -- tests/api/auth.test.ts tests/api/config.test.ts`
- `npm run typecheck:api && npm run typecheck:tests`
- `npm run typecheck`
- `npm run test:api`
- `VITE_API_BASE_URL=https://bodylog-api.antonbsa.workers.dev npm run build`
- `npm run lint`
- `npm run test:e2e`
- `git diff --check`

Deployment validation:

- `npm run deploy:api -- --dry-run --outdir /tmp/bodylog-worker-dry-run --var "FRONTEND_ORIGIN:https://bodylog.pages.dev" --keep-vars`

Results:

- All automated checks passed.
- The Worker dry-run passed and showed `FRONTEND_ORIGIN` injected as a hidden environment variable.
- Cloudflare Pages deployment was not executed locally because it requires real Cloudflare credentials and would publish production assets. The workflow command and required configuration are documented.


## Acceptance Criteria

- [x] Deployment workflow is created after the Cloudflare deployment strategy is chosen.
- [x] Deployment workflow runs on direct pushes to `main`.
- [x] Deployment workflow runs automated checks before deploy.
- [x] Deployment workflow deploys to the selected Cloudflare target.
- [x] Required deployment secrets are documented.
- [x] Deployment workflow does not commit or expose secrets.

## Implementation Notes

- Added `.github/workflows/deploy.yml`.
- The deploy workflow runs on direct pushes to `main` and manual dispatch.
- The workflow validates required GitHub secrets and variables before running checks.
- The workflow runs typecheck, lint, API tests, E2E tests, and a production frontend build before deploy.
- The workflow deploys the API Worker with `FRONTEND_ORIGIN` from the GitHub `PRODUCTION_FRONTEND_ORIGIN` variable.
- The workflow deploys `apps/web/dist` to Cloudflare Pages using the GitHub `CLOUDFLARE_PAGES_PROJECT_NAME` variable.
- Added `npm run deploy:web` for Cloudflare Pages deploys.
- Updated the root `npm run deploy:api` script to call Wrangler directly so workflow deployment flags pass through correctly.
- Added API CORS handling for local frontend origins and the exact configured production frontend origin.
- Protected route preflight requests now return CORS preflight headers before auth; actual protected route requests still require a valid session.
- Removed deployment open questions because the Pages project name and frontend origin are now external deployment variables.

## Required GitHub Configuration

Secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Variables:

- `CLOUDFLARE_PAGES_PROJECT_NAME`
- `PRODUCTION_FRONTEND_ORIGIN`
- `VITE_API_BASE_URL`

## Modified Files

- `.github/workflows/deploy.yml`
- `README.md`
- `apps/api/src/config.ts`
- `apps/api/src/index.ts`
- `docs/technical/deployment.md`
- `package.json`
- `specs/v1/open-questions.md`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-023-configure-deployment-automation.md`
- `tests/api/auth.test.ts`
- `tests/api/config.test.ts`


## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
