# tests

Conventions for the test tiers under root `tests/`.

## Tiers

- `tests/api` (Vitest, `npm run test:unit`): domain logic (derived values, validation, week grouping, averages, comparison), repositories, and routes called in-process through `app.request(path, init, env)` over the SQLite-backed D1 in `tests/api/sqlite-d1.ts` (Node's `node:sqlite` with the real migrations). `tests/api/test-env.ts` builds that env and writes users, `sessions` rows and measurements straight to the tables; a request authenticates with the cookie it returns. The OAuth providers' HTTP calls are stubbed with `vi.stubGlobal("fetch", ...)`. No server or port.
- `tests/web` (Vitest, same command): pure functions from `apps/web/src/utils/`. No DOM.
- `tests/infra` (Vitest, same command): Node scripts under `infra/scripts/`, run as child processes with a fake `npx` first on `PATH`, so no test reaches Cloudflare; the local seed SQL runs on the SQLite-backed D1 instead.
- `tests/e2e` (Playwright, `npm run test:e2e`): complete user flows in Chromium against the production build (`vite build`, then `vite preview` on port 5174), with every `/api/*` call mocked through `page.route`; specs import `test` from `tests/e2e/fixtures.ts`, which answers any unmocked `/api/*` call with a 500, so a missing mock shows up as the app's error state. It exercises the UI, never the real API or D1, so a flow that depends on API behavior also needs a `tests/api` test. UI behind `import.meta.env.DEV` never renders there; check it by hand under `npm run dev`.
- `tests/e2e-api` (Playwright, `npm run test:e2e:api`, config `playwright.real-api.config.ts`): a few flows (session, registration, history) against the real API on one origin, `http://localhost:8788`, where `wrangler dev --env e2e` serves the built web app and the test-only Worker entry `apps/api/src/e2e.ts`. Each test starts with `signInFreshUser(context, measurements)` from `tests/e2e-api/fixtures.ts`, which calls `POST /api/test/session` to create its own user, data and session, so tests run in any order and in parallel; seed past dates as fixed values. The local D1 and the web build it serves live in the gitignored `.e2e-state/`, deleted and migrated at the start of every run, separate from the dev D1 in `apps/api/.wrangler/`. It complements the mocked tier instead of replacing it: a new UI flow goes in `tests/e2e`, and this tier only gets flows whose value is the real web–API contract.

## Iterate with filters

Each full run is CI's job; while iterating, filter by file or name, then run each affected full suite once after a large chunk of work:

```bash
npx vitest run --config vitest.config.ts tests/api/measurement-api.test.ts -t "missing measurement"
npx playwright test tests/e2e/registration.spec.ts -g "for editing"
```

## E2E server reuse

- Symptom: e2e results don't match your code (a fix seems to have no effect, or another branch's UI shows up). Why it slips: `playwright.config.ts` sets `reuseExistingServer: true`, so a server already on port 5174, possibly from another worktree or serving an older build, is used instead of building and starting yours.
- Verify before trusting a run: `lsof -i :5174` shows nothing, or shows a process started from your worktree. A server held by another session is contention: leave it running and tell the owner instead of killing it.
- The real-API tier sets `reuseExistingServer: false`, so a run fails fast when port 8788 is taken instead of testing against another run's D1; `lsof -i :8788` shows who holds it.

## UI screenshots

The screenshot a UI issue is validated with comes from a temporary spec under `tests/e2e` that reuses that tier's mocks, at 390 px width in light and dark, saved outside the repo; delete the spec before committing. Symptom: the capture stops at the tab bar and cuts off the section you wanted. Why it slips: tab screens scroll inside an inner container under a `100dvh` root, so `fullPage: true` still captures one viewport, and the spec passes either way. Verify by opening each PNG; capture the element with `locator.screenshot()` or scroll it into view first.

## SQLite is not D1

An API test passing proves the SQL runs on Node's SQLite, not on D1; [apps/api/AGENTS.md](../apps/api/AGENTS.md) "SQL that only SQLite has run" has the real check.
