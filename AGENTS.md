# Project Guidance

BodyLog is a personal, single-user, mobile-first tracker for daily bioimpedance records and weekly progress, replacing a spreadsheet. V1 favors delivery over product completeness.

## Project Map

- Monorepo: `apps/api` (Hono on Cloudflare Workers + D1, also serving the built web app), `apps/web` (React/Vite PWA with Radix Themes), `infra` (D1 migrations, local-db scripts, shared error classes), `tests/{api,web,e2e}`, plus root `domain/` and `types/` shared by both apps.
- Package-specific rules live in nested files, loaded when you work there: [apps/api/AGENTS.md](apps/api/AGENTS.md), [apps/web/AGENTS.md](apps/web/AGENTS.md), [infra/AGENTS.md](infra/AGENTS.md), [tests/AGENTS.md](tests/AGENTS.md).
- Docs are indexed by reader moment in [docs/README.md](docs/README.md); terms are in [GLOSSARY.md](GLOSSARY.md).
- Product: [product](docs/product.md) (goal, flows, requirements, scope); [future ideas](docs/product/future-ideas.md) are context only, never work to implement unasked. UI work also reads [ui-direction](docs/product/ui-direction.md) and the visual reference [mobile-redesign.html](docs/product/prototype/mobile-redesign.html).
- Technical: [architecture](docs/architecture/overview.md), [HTTP API](docs/reference/api-contract.md), [database](docs/reference/database.md), [deploying](docs/operations/deploying.md). Decisions: [docs/decisions/](docs/decisions/README.md) (ADRs). Version-level specs and acceptance criteria: `specs/v1/`.
- Where guidance goes: needed on most edits → this file; scoped to a directory → that directory's `AGENTS.md` (plus a `CLAUDE.md` containing `@AGENTS.md`); a decision → ADR; stable product or technical knowledge → `docs/`; version-level scope → `specs/`.
- Agent instructions follow the code: a change that moves, renames or removes a package, directory, script or convention updates the instruction that names it in the same change. Symptom: an `AGENTS.md` sends the agent to a path or command that no longer exists. Why it slips: tests and lint don't read prose, and nested files load only when someone works in that directory. Verify with `grep -rn "<old name>" AGENTS.md apps/*/AGENTS.md infra/AGENTS.md tests/AGENTS.md .claude`.

## Workflow

Issue → ADR if a decision changes → implementation → review → PR → release.

1. **Issue.** Executable work is tracked only as GitHub issues (ADR 0036): one parent issue per initiative with native sub-issues, each holding Context, Scope, Out of scope, Acceptance criteria, Validation and Open points (`.github/ISSUE_TEMPLATE/`). Read the selected issue and its parent with `gh issue view <n>` before coding. New work is drafted as issue text and shown to the owner; create the issue only after the owner approves it. `specs/*/tasks/` files are history: leave them as they are and note superseded tasks in the issues.
2. **Decision.** When the work changes an accepted decision, add or update an ADR under `docs/decisions/` (frontmatter rules in its README, then `npm run docs:index`) before broad coding. Any change to behavior, scope, the API or the data model updates the current-state docs it affects (product, architecture, API contract, database) in the same change; a refactor with no behavior change needs none.
3. **Implement** only the selected issue, with its tests. When the issue leaves the approach open, show the owner a plan first. An ambiguity that blocks the work is a question for the owner; one that doesn't is resolved with the simplest option the specs allow and reported as an assumption.
4. **Review** the diff against the issue's acceptance criteria and these instructions; UI issues are validated with a screenshot compared against the prototype.
5. **PR.** The parent issue's Workflow says whether its sub-issues share one branch and PR (ADR 0036's default) or get one each. Report validation notes and modified files to the owner; post them on GitHub only when the owner asks, since comments are public and unreviewed.
6. **Release.** Production deploys are the owner's call: `deploy.yml` deploys after CI passes on `main`, and `gh release create` runs only with `--draft`, since publishing a release becomes the production deploy (#39).

## Language

- Chat replies follow the language the user writes in that turn.
- Everything that lands in the repo is English: code, identifiers, comments, commits, docs, issue/PR text. User-visible app text is Brazilian Portuguese.

## Code Comments

A comment carries only what the code can't say: the why (business rule, third-party bug, trade-off, workaround), a pitfall that looks safe to simplify, or an invariant the types don't express. One line is the target, two the ceiling.

- A function's description goes in `/** */` directly above it; `//` is for comments inside bodies. Add `@param`/`@returns` only for meaning the types don't carry.
- A durable decision gets a one-line ADR pointer after the fact (`// ... (ADR 0040)`). The story of a change goes in the commit or PR.
- Update or delete comments the change outgrew, and say so in the summary.

## Commits

- Conventional Commits: `feat:` runtime behavior, `fix:` bug fixes, `docs:` docs/specs/agent instructions, `test:` test-only, `chore:` tooling/deps/formatting/maintenance (and any docs + tooling mix), `refactor:` restructuring without behavior change.
- Subject: imperative, ≤72 chars, no trailing period; it must stand alone in `git log --oneline`.
- Body is optional; skip it when the subject says everything. When present: 1–4 `- ` bullets, one line each, no hard wrap. Each says why or what's non-obvious (constraint, rejected alternative, side effect), never a file-by-file how.
- Context that has a home elsewhere stays in its issue/ADR/PR; the commit points to it in a footer (`Refs: #35, ADR 0040`). Only the first commit of a branch carries the footer.
- Commits and PR descriptions carry the user's authorship only: no `Co-Authored-By` trailer or attribution line (`attribution` in `.claude/settings.json` turns off Claude's defaults).
- When your work changed git-tracked files, end the final response with one suggested commit message; with no tracked change, write nothing about commits. While iterating on the same uncommitted work, keep updating that one suggestion to cover the whole change set.
- Mention only git-tracked files, in the commit suggestion and the rest of the reply; gitignored paths (`.env.local`, `.agents/`) stay out of it.

## Markdown

Don't hard-wrap prose: one paragraph, one line. Fenced code, tables and list continuations keep their own formatting.

Relative links and heading anchors in `README.md`, `GLOSSARY.md`, `docs/**` and every `AGENTS.md` are checked by `npm run check-docs` (CI's Docs Link Check job). Run it after moving, renaming or retitling a doc or heading: GitHub renders a broken anchor as a plain link, so nothing else fails.

## Env Vars

- `.env.development` at the repo root is committed with placeholder secrets; `wrangler dev` reads it through `--env-file`, and Vite reads root env files (`envDir: "../.."`).
- `.env.local` and `.env.production` (gitignored) hold real values that exist nowhere else. Never delete, move or overwrite them, directly or through `git clean`/`rm -rf`/"reset to clean"; `.claude/settings.json` and the guard hooks (Tooling) block the obvious paths. If a task seems to need one changed, stop and ask.
- Production secrets (`APP_PASSWORD`, `SESSION_SECRET`) are Cloudflare secrets set with `npx wrangler secret put <NAME> --env production` from `apps/api`; document a new one in [secrets](docs/operations/secrets.md) and never commit its value.

## Engineering

- Build the simplest thing that fully meets the current requirement, end to end; add capability on top of something that already works. No speculative abstractions, config or indirection.
- Small is fine, throwaway isn't: the simplest version should be one you'll extend, not one you'll replace.
- Before writing your own code, use what the project's dependencies already offer, then a well-maintained library; a new dependency needs a stated reason.
- For a design with no precedent in the codebase, follow how established products solve it.
- V1 stack (ADRs 0013–0017, 0040): TypeScript everywhere, React + Vite, Hono on Cloudflare Workers, D1, deployed to Cloudflare only (no Vercel compatibility); auth is one password from secrets; V2 plans serverless Postgres, which is why SQL stays behind repositories.
- Shared code: request/response shapes are declared once in root `types/`, and rules both apps run (measurement limits, notes normalization, derived values) live in root `domain/`. Each app imports only its own `src/` plus these roots. Symptom: `apps/web` imports from `apps/api/src` (or the reverse). Why it slips: the import typechecks and bundles, so CI stays green. Verify with `grep -rn "api/src" apps/web/src` and `grep -rn "web/src" apps/api/src`, both returning nothing.

## Product Rules

- Single user, mobile-first, a body metrics tracker rather than a generic fitness app; no multi-user support or complex auth.
- One measurement per date. Selecting a date with a record loads it for editing; a date without one shows an empty form for creation. Only weight is required.
- Weeks run Monday to Sunday. The current-week comparison is the partial current week vs the previous full week.
- Percentage metric changes are shown in percentage points. A change may be labeled as increased, decreased or stable, never as good or bad, and the app gives no recommendations or health interpretation.
- Charts exist only on the Tendências screen (ADR 0030): one line chart at a time, with no ideal bands or targets.
- Out of V1: Google Sheets integration, offline-first behavior.

## Tests

- Every behavior change ships with automated tests; a task that can't have them yet documents why and is validated by hand.
- Test files live under root `tests/` (never in `src/`); tiers and how to run them are in [tests/AGENTS.md](tests/AGENTS.md).
- CI (`.github/workflows/ci.yml`) runs typecheck, lint, `test:unit` and `test:e2e` on every PR and push to `main`.

## Tooling

- Node is pinned in `.nvmrc` and enforced by `engine-strict=true` with the `engines` range in `package.json`: run `nvm use` before any `npm install` or npm script, or installs fail with `EBADENGINE`.
- Agents don't start long-running dev servers or watchers (`npm run dev`, `dev:api`, `dev:web`, `wrangler dev`, `vite` in watch mode) unless the user asks; the owner runs them. Finite commands (typecheck, lint, tests, builds, local migrations, one-off CLI checks) are fine.
- Git hooks (husky) are installed by `npm install` through `prepare: husky`. `pre-commit` runs lint-staged (`lint-staged.config.mjs`): `eslint --fix` + `prettier --write` on the staged files, then the typecheck projects those TS files can affect. `commit-msg` rejects a `Co-Authored-By:` trailer (see Commits). Symptom: the commit differs from what you staged, or a commit fails on a typecheck of a file you didn't touch. Why it slips: the hook rewrites staged files and typechecks every project that consumes them (a `types/` change runs api, web and tests). Verify with `git diff --cached` after the hook and by running the failing `npm run typecheck:<project>` yourself.
- `.claude/hooks/guard-bash.mjs` and `guard-write.mjs` (PreToolUse, registered in `.claude/settings.json`) hard-enforce rules from this file and the nested ones: draft-only releases, no Bash writes to `.env.local`/`.env.production`, a confirmation for any local `d1 execute` beyond one `SELECT` or any delete of `.wrangler` state, no edits in the `main` checkout, no moving a worktree. They exist because `ask` permission rules never prompt in bypass mode, while a hook's `ask` always does. A denial names the rule it enforces; follow it instead of rephrasing the command around the guard. Symptom of a broken guard: the command just runs. Why it slips: a hook that crashes or matches nothing fails open, silently. After changing a guard, pipe a payload into it (`echo '{"tool_name":"Bash","tool_input":{"command":"..."}}' | node .claude/hooks/guard-bash.mjs`) for each case it should deny, ask and pass, and check the printed `permissionDecision` (no output means pass). The hooks run from the directory the session started in, so a session started in the `main` checkout uses `main`'s copy.

## Worktrees and `.agents/`

- Tracked files change in a worktree on a feature branch, never in the `main` checkout. Create one with `git worktree add -b <branch-name> .agents/worktrees/<branch-name> origin/main`, then `nvm use && npm install` inside it. A session working in a worktree gives its absolute path to every subagent it delegates to.
- Name the branch after the work (`serve-the-web-app-from-the-api-worker`), with no `issue-<n>` prefix, and keep the directory name equal to the branch name at creation.
- A worktree's path is fixed for its whole life: when the work outgrows the name, rename the branch (`git branch -m`) and leave the directory; `guard-bash.mjs` denies `git worktree move` and `mv` under `.agents/worktrees/`. Symptom: Orca loses the session and its chat, since it tracks each worktree by path. Why it slips: git, the build and the tests all work normally from the new path. Verify: `git worktree list` still shows the path the session was opened at.
- `eslint.config.mjs` `ignores` keeps `.agents/**`. Symptom: `npm run lint` in the `main` checkout reports errors in files that aren't on `main`, or crawls through a worktree's `dist/`. Why it slips: flat config doesn't read `.gitignore` and its ignores are root-anchored, while a worktree's own lint never sees its siblings. Verify: `npx eslint --print-config .agents/worktrees/x/a.ts` prints `undefined`.
- `.agents/` is gitignored scratch space (worktrees, drafts, handoffs), not project state. Don't read or factor in its contents unless a task points at a specific file; decisions live in `docs/decisions/`.
