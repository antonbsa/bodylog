# AGENTS.md

This file defines how AI coding agents should work on this repository.

## Project Goal

Build a personal, mobile-first body metrics tracker that replaces a spreadsheet workflow for daily bioimpedance records and weekly progress analysis.

The V1 priority is delivery, not product completeness.

## Required Context Before Coding

Before implementing any task, read these files:

1. `docs/product/00-product-brief.md`
2. `docs/product/01-requirements.md`
3. `docs/product/03-scope.md`
4. `docs/technical/00-architecture.md`
5. `docs/technical/01-data-model.md`
6. `docs/technical/02-api-contract.md`
7. `docs/implementation/01-tasks.md`

Use `docs/product/04-backlog.md` only to understand future ideas. Do not implement backlog items unless explicitly requested.

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

## Commit Message Rules

Use Conventional Commits.

Preferred prefixes:

- `feat:` for runtime product behavior.
- `fix:` for bug fixes.
- `docs:` for documentation, specs, task checklists, planning files, and agent instructions.
- `test:` for test-only changes.
- `chore:` for tooling, dependency, formatting, or repository maintenance.
- `refactor:` for code restructuring with no behavior change.

Use `docs:` for changes under `docs/` and `AGENTS.md`, including spec changes and task status updates.

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
