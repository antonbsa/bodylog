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

- `npm run deploy:api -- --dry-run --outdir /tmp/bodylog-worker-dry-run --var "PRODUCTION_FRONTEND_ORIGIN:https://bodylog.pages.dev" --keep-vars`

Results:

- All automated checks passed.
- The Worker dry-run passed and showed `PRODUCTION_FRONTEND_ORIGIN` injected as a hidden environment variable.
- Cloudflare Pages deployment was not executed locally because it requires real Cloudflare credentials and would publish production assets. The workflow command and required configuration are documented.
- Follow-up config split validation moved the API Worker config to `apps/api/wrangler.toml`, added the Pages config at `apps/web/wrangler.toml`, and changed local API dev to load root `.env.development` explicitly with `--env-file` instead of a named Wrangler environment.
- Follow-up validation passed:
  - `npm run deploy:api -- --dry-run --outdir /tmp/bodylog-worker-dry-run --var "PRODUCTION_FRONTEND_ORIGIN:https://bodylog.pages.dev" --keep-vars`
  - `npm --workspace @bodylog/api run deploy -- --dry-run --outdir /tmp/bodylog-worker-workspace-dry-run --var "PRODUCTION_FRONTEND_ORIGIN:https://bodylog.pages.dev" --keep-vars`
  - `npx wrangler d1 migrations apply body_metrics_tracker --config apps/api/wrangler.toml --local --persist-to <tmpdir>`
  - `npx wrangler d1 execute body_metrics_tracker --config apps/api/wrangler.toml --local --persist-to <tmpdir> --command "SELECT COUNT(*) AS count FROM measurements"`
  - `BODYLOG_D1_PERSIST_TO=<tmpdir> npm run db:setup:local -- --today 2026-06-11`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run deploy:web -- --help`
- Follow-up deploy script ownership validation passed:
  - `npm run deploy:api -- --dry-run --outdir /tmp/bodylog-worker-dry-run --var "PRODUCTION_FRONTEND_ORIGIN:https://bodylog.pages.dev" --keep-vars`
  - `npm run deploy:web -- --help`
  - `npm --workspace @bodylog/web run deploy -- --help`

## Acceptance Criteria

- [x] Deployment workflow is created after the Cloudflare deployment strategy is chosen.
- [x] Deployment workflow runs on direct pushes to `main`.
- [x] Deployment workflow runs automated checks before deploy.
- [x] Deployment workflow deploys to the selected Cloudflare target.
- [x] Required deployment secrets are documented.
- [x] Deployment workflow does not commit or expose secrets.

## Implementation Notes

- Added `.github/workflows/deploy.yml`.
- The deploy workflow runs after successful CI runs from pushes to `main`, and
  on manual dispatch.
- The workflow validates required GitHub secrets and variables before running checks.
- The workflow runs typecheck, lint, API tests, E2E tests, and a production frontend build before deploy.
- The workflow deploys the API Worker with `PRODUCTION_FRONTEND_ORIGIN` from the GitHub `PRODUCTION_FRONTEND_ORIGIN` variable.
- The workflow deploys `apps/web/dist` to Cloudflare Pages using the GitHub `CLOUDFLARE_PAGES_PROJECT_NAME` variable.
- Added `npm run deploy:web` for Cloudflare Pages deploys.
- Updated the root `npm run deploy:api` script to call Wrangler directly so workflow deployment flags pass through correctly.
- Split Wrangler configuration by deploy target.
- `apps/api/wrangler.toml` handles Worker API deploy, local dev, D1 binding config, and the root D1 migrations directory.
- `apps/web/wrangler.toml` handles Cloudflare Pages deploy settings.
- Root deploy scripts delegate to app-owned workspace deploy scripts.
- Removed the root `wrangler.toml`.
- Updated local API dev to load `.env.development` through `--env-file`, which avoids the missing `[env.development]` warning without duplicating Worker vars and D1 bindings under a named environment.
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
- `apps/api/wrangler.toml`
- `apps/api/package.json`
- `apps/web/package.json`
- `apps/web/wrangler.toml`
- `docs/technical/architecture.md`
- `docs/technical/deployment.md`
- `package.json`
- `infra/scripts/local-db/wrangler.ts`
- `specs/v1/open-questions.md`
- `specs/v1/tasks/README.md`
- `specs/v1/tasks/t-013-implement-login.md`
- `specs/v1/tasks/t-023-configure-deployment-automation.md`
- `tests/api/auth.test.ts`
- `tests/api/config.test.ts`
- `wrangler.toml`

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
