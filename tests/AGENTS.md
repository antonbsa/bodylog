# tests

Conventions for the test tiers under root `tests/`.

## Tiers

- `tests/api` (Vitest, `npm run test:unit`): domain logic (derived values, validation, week grouping, averages, comparison), repositories, and routes called in-process through `app.request(path, init, env)` with a hand-written fake D1 and a signed session cookie. No server or port.
- `tests/web` (Vitest, same command): pure functions from `apps/web/src/utils/`. No DOM.
- `tests/e2e` (Playwright, `npm run test:e2e`): complete user flows in Chromium against the Vite dev server on port 5174, with every `/api/*` call mocked through `page.route`. It exercises the UI, never the real API or D1, so a flow that depends on API behavior also needs a `tests/api` test.

## Iterate with filters

Each full run is CI's job; while iterating, filter by file or name, then run each affected full suite once after a large chunk of work:

```bash
npx vitest run --config vitest.config.ts tests/api/measurement-api.test.ts -t "missing measurement"
npx playwright test tests/e2e/registration.spec.ts -g "for editing"
```

## E2E server reuse

- Symptom: e2e results don't match your code (a fix seems to have no effect, or another branch's UI shows up). Why it slips: `playwright.config.ts` sets `reuseExistingServer: true`, so a Vite server already on port 5174, possibly from another worktree, is used instead of starting yours.
- Verify before trusting a run: `lsof -i :5174` shows nothing, or shows a process started from your worktree. A server held by another session is contention: leave it running and tell the owner instead of killing it.

## Fake D1 in `tests/api`

The fake D1 classes in the API tests dispatch on the start of the SQL text. A repository query whose text changes needs the matching fake updated, and the fake passing proves nothing about real D1; [apps/api/AGENTS.md](../apps/api/AGENTS.md) "SQL that only the fake D1 has run" has the real check.
