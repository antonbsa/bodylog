# AGENTS.md

This file defines how AI coding agents should work on this repository.

## Project Goal

Build a personal, mobile-first body metrics tracker that replaces a spreadsheet workflow for daily bioimpedance records and weekly progress analysis.

The V1 priority is delivery, not product completeness.

## Required Context Before Coding

Before implementing any task, read these files:

1. `docs/product/overview.md`
2. `docs/product/requirements.md`
3. `docs/product/scope.md`
4. `docs/technical/architecture.md`
5. `docs/technical/database.md`
6. `docs/technical/api.md`
7. `specs/v1/spec.md`
8. `specs/v1/implementation-plan.md`
9. `specs/v1/acceptance-criteria.md`
10. The selected task file under `specs/v1/tasks/`

Use `docs/product/future-ideas.md` only to understand future ideas. Do not implement future ideas unless explicitly requested.

## Documentation and Task Conventions

- Use `docs/` for stable product, technical, architectural, and planning knowledge.
- Use `specs/` for version-level specifications, acceptance criteria, implementation strategy, open questions, and executable task files.
- Keep requirements and architecture as current-state living documents.
- Capture important decisions as ADR-style files under `docs/technical/decisions/`.
- Do not add execution task tracking under `docs/`.

## Task Workflow

This project uses plain markdown task files under `specs/v1/tasks/`.

Before implementing a task:

1. Read the related docs/specs.
2. Read the selected task file under `specs/v1/tasks/`.
3. Update the task with an implementation plan when the task is not clear enough.
4. Implement only the selected task.
5. Update the task with validation notes and modified files.
6. Do not introduce unrelated changes.

When creating new work:

1. Add stable knowledge to `docs/`.
2. Add feature/version scope to `specs/`.
3. Add executable work as a markdown task under `specs/v1/tasks/`.

## V1 Technical Decisions

- Frontend: React + Vite + TypeScript
- Backend: Hono + TypeScript
- Runtime: Cloudflare Workers
- Database: Cloudflare D1
- Deploy target: Cloudflare only
- Automation: CI workflows for PRs to `main`, direct pushes to `main`, and deployment
- Authentication: simple single-user password using secrets/environment variables
- V2 planned database migration: serverless Postgres

Do not add Vercel compatibility to V1.

## Scope Rules

Do:

- Keep the app mobile-first.
- Keep the implementation small and understandable.
- Preserve TypeScript across frontend and backend.
- Implement one requirement at a time.
- Add automated tests together with implemented behavior.
- Keep data access isolated behind a repository/service layer.
- Declare cross-boundary request/response shapes once in the root `types/` package; do not redeclare per-app copies in `apps/web` or `apps/api`.
- Update docs when implementation decisions change.
- Prefer boring, explicit code over unnecessary abstraction.

Do not:

- Turn the project into a generic fitness tracker.
- Add multi-user support.
- Add complex authentication.
- Add charts in V1.
- Add Google Sheets integration in V1.
- Add offline-first behavior in V1.
- Add recommendations or automatic health interpretation.
- Introduce dependencies without a clear reason.

## Product Rules

- V1 must allow one measurement per date.
- If a selected date already has a record, load it into the form for editing.
- If a selected date has no record, show an empty form for creation.
- Only weight is required in V1.
- Week starts on Monday and ends on Sunday.
- Current week comparison is partial current week vs previous full week.
- Percentage metric changes must be displayed in percentage points.
- The system may indicate whether a metric increased, decreased, or stayed stable, but must not classify changes as good or bad in V1.

## Ambiguity Handling

If ambiguity blocks implementation, document the question before proceeding.

If ambiguity does not block implementation, choose the simplest option that satisfies the current specs and document the assumption.

## Expected Workflow

1. Read the relevant specs.
2. Identify the requirement/task being implemented.
3. Make the smallest useful change.
4. Add or update automated tests that cover the behavior.
5. Run the relevant automated checks.
6. Validate against acceptance criteria.
7. Update docs if behavior changed.

## Node Version

This repo pins Node via `.nvmrc` (currently `24.16.0`) and enforces it with
`engine-strict=true` plus a `package.json` `engines` range. Run `nvm use` (or
otherwise use Node 24) before any `npm install` / npm script, or installs fail
with `EBADENGINE`.

## Local Development Servers

Do not start long-running development servers or watchers unless the user explicitly asks for them.

Agents must not run commands such as:

- `npm run dev`
- `npm run dev:api`
- `npm run dev:web`
- `wrangler dev`
- `vite --watch` or similar watcher/server commands

The project owner handles local dev servers manually.

Agents may still run finite validation commands such as typecheck, lint, tests, builds, migrations, and one-off CLI checks when they are relevant to the task.

## Worktree Configuration

All agents and sub-agents must configure git worktrees under `.agent-state/worktrees/` to keep temporary worktrees organized and hidden from search and file navigation.

When using git worktree operations (including tools like Gitlens Start Work or Gitlens Start Review):

- Specify the worktree path as `.agent-state/worktrees/<descriptive-name>` relative to the repository root
- This keeps the workspace clean and prevents cluttering the editor's file explorer and search results
- The `.agent-state` folder is already excluded in `.vscode/settings.json`

## Commit Message Rules

Use Conventional Commits.

Preferred prefixes:

- `feat:` for runtime product behavior.
- `fix:` for bug fixes.
- `docs:` for documentation, specs, task checklists, planning files, and agent instructions.
- `test:` for test-only changes.
- `chore:` for tooling, dependency, formatting, or repository maintenance.
- `refactor:` for code restructuring with no behavior change.

Use `docs:` for documentation-only changes under `docs/`, `specs/`, and `AGENTS.md`, including spec changes and task status updates. Use `chore:` when the change also updates tooling, dependencies, or package scripts.

When completing work that actually changed project files, include one suggested commit message at the end of the final response.
While iterating on the same uncommitted work, update that single suggestion so it reflects the full accumulated change set. Do not replace it with a different message that only describes the latest iteration.
Suggest a new separate commit message only after a commit has been made, or when the user explicitly starts separate work that should be committed independently.
Do not include a commit message suggestion for planning, explanation, review, or advice-only responses with no file changes.
The suggestion must follow these commit message rules.

## Testing Expectations

- Place automated test files under the root `tests/` directory, not inside `src/`.
- Unit-test domain logic such as derived calculations, validation, weekly grouping, weekly averages, and weekly comparison.
- Test repository and API behavior where persistence, authentication, routing, or serialization rules are implemented.
- Add E2E coverage for complete user-facing flows once the frontend route exists.
- Keep tests focused on V1 behavior and acceptance criteria.
- If a task cannot reasonably have automated coverage yet, document the reason and perform a manual validation.

## Automation Expectations

- V1 should include workflow files for automated checks on pull requests targeting `main`.
- V1 should include workflow files for automated checks on direct pushes to `main`.
- V1 should include deployment automation once the Cloudflare deployment strategy is chosen.
- Workflow automation must run the relevant automated checks before deployment.
- Required deployment secrets must be documented and must not be committed.
