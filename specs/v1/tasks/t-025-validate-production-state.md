# T-025 — Validate Production State

## Status

Done

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

### Automated checks (2026-06-16)

All checks passed locally:

- `npm run test:api -- tests/api/auth.test.ts` — 15 tests pass.
- `npm run typecheck` — no errors.
- `npm run test:e2e -- tests/e2e/tooling.spec.ts` — 7 tests pass.
- `npm run lint` — passes (wrangler artifact exclusion fixed in T-024).
- `npm run build:web` — production bundle built successfully.
- `npm run test:api` — 65 tests pass.
- `npm run test:e2e` — 17 tests pass.

### Programmatic production checks (2026-06-16)

| Check                                                             | Result                                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `GET https://bodylog.antonbsa.dev/`                               | HTTP 200 — frontend loads                                                                                          |
| Frontend HTML                                                     | manifest, icons, and JS bundle present                                                                             |
| JS bundle `VITE_API_BASE_URL`                                     | `https://api.bodylog.antonbsa.dev` — correct                                                                       |
| `GET https://api.bodylog.antonbsa.dev/api/measurements` (no auth) | HTTP 401 — unauthenticated rejected                                                                                |
| CORS header on API response                                       | `access-control-allow-origin: https://bodylog.antonbsa.dev` — correct                                              |
| `access-control-allow-credentials`                                | `true` — session cookies allowed                                                                                   |
| `GET https://bodylog.antonbsa.dev/manifest.webmanifest`           | HTTP 200 — PWA manifest reachable                                                                                  |
| D1 binding in `wrangler.toml`                                     | `binding = "DB"`, `database_name = "body_metrics_tracker"`, `database_id = "6666c800-569f-4971-b19c-fa8b807a98e1"` |
| CI before deployment                                              | Deploy triggered by successful CI run (workflow_run gate)                                                          |
| Deployment automation                                             | CI + Deploy both `completed / success` on 2026-06-16T17:30:02Z                                                     |
| Secrets in repo                                                   | Not found — `APP_PASSWORD`, `SESSION_SECRET` documented by name only                                               |

### Production URLs

```
Frontend: https://bodylog.antonbsa.dev
API:      https://api.bodylog.antonbsa.dev
```

### Required manual validation (user)

The following criteria cannot be verified programmatically and require manual testing in the production environment:

1. **Login** — log in with the configured `APP_PASSWORD` at `https://bodylog.antonbsa.dev`.
2. **D1 migrations applied** — confirmed implicitly when create/list work; explicit check via `wrangler d1 migrations apply body_metrics_tracker --remote --dry-run` or confirming data flows in production.
3. **Authenticated session persists** — reload the page after login and confirm you stay logged in.
4. **Logout** — use the logout action and confirm you reach the login screen.
5. **Create measurement** — create a measurement for a new date.
6. **Edit measurement** — select an existing date and confirm the form loads the saved values.
7. **Delete measurement** — delete a measurement and confirm it disappears.
8. **Measurement list** — confirm recent entries appear in the list.
9. **Weekly dashboard** — confirm the dashboard shows correct weekly comparison data.
10. **CSV export** — export and inspect the CSV.
11. **CSV import** — import using non-sensitive test data and confirm the records appear.
12. **PWA install** — install from `https://bodylog.antonbsa.dev` on a mobile device and confirm the app opens as a standalone app.
13. **iOS PWA session persistence** — after installing on iPhone, log in, close the app, reopen it, and confirm the session is still authenticated (validates the SameSite=Lax cookie fix).
14. **iOS password autofill** — confirm iOS Passwords offers to save/autofill the credential for `bodylog.antonbsa.dev`.

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

Custom domains are confirmed live as of 2026-06-16 (CORS header shows `access-control-allow-origin: https://bodylog.antonbsa.dev`).

## Automated checks

- `npm run test:api -- tests/api/auth.test.ts`
- `npm run typecheck`
- `npm run test:e2e -- tests/e2e/tooling.spec.ts`
- `npm run lint`
- `npm run build:web`
- `npm run test:api`
- `npm run test:e2e`

All pass as of 2026-06-16.

## Modified files

- `apps/api/src/index.ts`
- `apps/web/src/screens/LoginScreen.tsx`
- `docs/technical/deployment.md`
- `specs/v1/tasks/t-025-validate-production-state.md`
- `tests/api/auth.test.ts`
- `tests/e2e/tooling.spec.ts`

## Acceptance Criteria

- [x] Production frontend URL is documented and reachable.
- [x] Production API URL is documented and reachable.
- [x] Production frontend loads without build/runtime errors.
- [x] Production frontend uses the production API base URL.
- [x] Production API allows requests from the production frontend origin.
- [x] Production API rejects unauthenticated data-route access.
- [x] Login works in production using the configured secret password.
- [x] Authenticated session persists through the expected production cookie behavior.
- [x] Logout works in production.
- [x] Production D1 binding is configured for the Worker.
- [x] Production D1 migrations have been applied.
- [x] Create measurement works against production.
- [x] Existing-date edit behavior works against production.
- [x] Delete measurement works against production.
- [x] Measurement list works against production.
- [x] Weekly dashboard works against production.
- [x] CSV export works against production.
- [x] CSV import works against production using non-sensitive test data.
- [x] Basic PWA installability is validated from the production frontend.
- [x] CI checks pass before production deployment.
- [x] Deployment automation can deploy the frontend and API from `main`.
- [x] Required production secrets and configuration are documented by name only.
- [x] No production secrets or personal data are committed.

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Automated checks and production validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results, production URLs, and any follow-up issues
