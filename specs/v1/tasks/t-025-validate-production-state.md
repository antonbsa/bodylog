# T-025 — Validate Production State

## Status

To Do

## Description

Validate that the completed V1 works in the real Cloudflare production environment after feature implementation, deployment configuration, and deployment automation are already in place.

This task is a validation task, not a feature implementation task. It should confirm that the production deployment is actually usable, authenticated, connected to the production database, and capable of running the core V1 workflows end to end.

## Why

V1 is only done when BodyLog is usable as a deployed personal app, not only when it works locally. The production state depends on Cloudflare Pages, the Worker API, D1, migrations, secrets, CORS, cookies, and deployment automation all working together.

## Scope

- Validate the deployed Cloudflare Pages frontend.
- Validate the deployed Cloudflare Worker API.
- Validate frontend-to-API communication in production.
- Validate production D1 binding and applied migrations.
- Validate required secrets and configuration are present without exposing values.
- Validate authentication and session behavior in production.
- Validate core V1 user flows against production.
- Validate deployment automation for `main`.
- Record production URLs, commands, and validation notes without committing secrets or personal data.

## Out of Scope

- Do not add new V1 product features.
- Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility.
- Do not commit production secrets, personal records, exported backups, or production database files.
- Do not change the deployment strategy unless production validation proves the selected strategy cannot work.

## Validation

Run the relevant automated checks before validating production. Then perform manual or automated production smoke validation and record the exact checks performed.

If a production issue is found, document the failing check and either fix it in the smallest related task scope or create a follow-up task when the fix is not appropriate for this validation task.

## Production Issue Notes

### Installed iOS PWA session persistence and password autofill

Finding:

- When installed to the iPhone home screen from the production frontend, the app required entering the password again after closing and reopening.
- iOS Passwords did not offer to save or autofill the password on the login screen.

Assumption:

- The production frontend and API were using separate Cloudflare default sites (`pages.dev` and `workers.dev`), which makes API session cookies cross-site. iOS standalone web apps can drop or omit those cookies.

Fix:

- Production should use same-site custom domains:
  - Frontend: `https://bodylog.antonbsa.dev`
  - API: `https://api.bodylog.antonbsa.dev`
- The API now sets production session cookies as `Secure` + `SameSite=Lax` when the request URL and configured `PRODUCTION_FRONTEND_ORIGIN` are same-site under that custom-domain layout.
- The API keeps the existing `Secure` + `SameSite=None` fallback for separate Cloudflare default domains.
- The login form now includes a stable `username` autocomplete field and password input metadata so iOS Passwords can associate the saved credential with the app.

Validation to run after deployment:

- Configure the frontend custom domain in Cloudflare Pages.
- Configure the API custom domain/route for the Worker.
- Set `PRODUCTION_FRONTEND_ORIGIN=https://bodylog.antonbsa.dev`.
- Build/deploy the frontend with `VITE_API_BASE_URL=https://api.bodylog.antonbsa.dev`.
- Install the app from `https://bodylog.antonbsa.dev` on iPhone, log in, close it, reopen it, and confirm the session is still authenticated.
- Save the `bodylog` credential in iOS Passwords for `bodylog.antonbsa.dev` and confirm the password field offers autofill.

Automated checks:

- `npm run test:api -- tests/api/auth.test.ts`
- `npm run typecheck`
- `npm run test:e2e -- tests/e2e/tooling.spec.ts`
- `npm run lint`
- `npm run build:web`
- `npm run test:api`
- `npm run test:e2e`
- `npx prettier --check apps/api/src/index.ts apps/web/src/screens/LoginScreen.tsx tests/api/auth.test.ts tests/e2e/tooling.spec.ts docs/technical/deployment.md specs/v1/tasks/t-025-validate-production-state.md`

Modified files:

- `apps/api/src/index.ts`
- `apps/web/src/screens/LoginScreen.tsx`
- `docs/technical/deployment.md`
- `specs/v1/tasks/t-025-validate-production-state.md`
- `tests/api/auth.test.ts`
- `tests/e2e/tooling.spec.ts`

## Acceptance Criteria

- [ ] Production frontend URL is documented and reachable.
- [ ] Production API URL is documented and reachable.
- [ ] Production frontend loads without build/runtime errors.
- [ ] Production frontend uses the production API base URL.
- [ ] Production API allows requests from the production frontend origin.
- [ ] Production API rejects unauthenticated data-route access.
- [ ] Login works in production using the configured secret password.
- [ ] Authenticated session persists through the expected production cookie behavior.
- [ ] Logout works in production.
- [ ] Production D1 binding is configured for the Worker.
- [ ] Production D1 migrations have been applied.
- [ ] Create measurement works against production.
- [ ] Existing-date edit behavior works against production.
- [ ] Delete measurement works against production.
- [ ] Measurement list works against production.
- [ ] Weekly dashboard works against production.
- [ ] CSV export works against production.
- [ ] CSV import works against production using non-sensitive test data.
- [ ] Basic PWA installability is validated from the production frontend.
- [ ] CI checks pass before production deployment.
- [ ] Deployment automation can deploy the frontend and API from `main`.
- [ ] Required production secrets and configuration are documented by name only.
- [ ] No production secrets or personal data are committed.

## Definition of Done

- [ ] Acceptance criteria are met
- [ ] Implementation matches the approved spec or plan
- [ ] Relevant docs or specs were updated when needed
- [ ] Automated checks and production validation were completed
- [ ] No unrelated changes were introduced
- [ ] Task notes include validation results, production URLs, and any follow-up issues
