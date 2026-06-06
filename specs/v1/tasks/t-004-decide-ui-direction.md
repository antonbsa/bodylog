# T-004 — Decide UI Direction

## Status

Done

## Description

Decide and document the V1 UI direction before frontend screens are implemented.

The accepted direction is a mobile-first, dark-mode, single-dashboard interface with weekly summary cards, recent measurement history, and a modal/full-viewport measurement form.

## Why

This task advances BodyLog V1 during the Project Base phase.

## Scope

Document the basic visual direction, navigation pattern, design references, constraints, and downstream implementation assumptions for V1 frontend tasks.

## Out of Scope

Do not add multi-user behavior, advanced analytics, Google Sheets integration, offline-first behavior, or Vercel compatibility for this task.

Do not install UI dependencies or implement frontend screens in this task.

## Validation

Validated the supplied UI definition against the current product and technical docs, resolved conflicts with project owner input, and updated the stable docs/specs that were still pending or suggested.

Automated checks:

- `npm run typecheck`
- `npm test`

## Acceptance Criteria

- [x] Basic visual direction is documented.
- [x] Navigation pattern is documented.
- [x] Any design references or constraints are documented.
- [x] Decision is made before implementing frontend UI screens.

## Decision Summary

- V1 authenticated app is a single dashboard page.
- Dashboard contains weekly summary cards, recent measurement history, and actions.
- Measurement form opens from the dashboard as a full-viewport mobile modal or constrained desktop modal.
- Dark mode only for V1.
- All visible labels and interface copy use `pt-BR`.
- UI references: GitHub, Vercel, and Cloudflare.
- Icons: Phosphor Icons.
- Typography: Geist with Inter fallback.
- Component library selection is deferred until frontend setup or first concrete UI implementation.
- V1 uses expected-outcome color semantics for summary variations, without health advice, diagnosis, recommendations, or motivational interpretation.
- Registration reliability uses absolute weekly record count: low `<=2`, medium `3-4`, high `>=5`.
- Stable thresholds: weight `<0.5 kg`, body fat mass `<0.4 kg`, muscle mass `<0.3 kg`.

## Modified Files

- `README.md`
- `docs/product/future-ideas.md`
- `docs/product/requirements.md`
- `docs/product/scope.md`
- `docs/product/ui-direction.md`
- `docs/product/user-flows.md`
- `docs/technical/architecture.md`
- `docs/technical/api.md`
- `docs/technical/cross-cutting-concerns.md`
- `docs/technical/database.md`
- `docs/technical/decisions/0012-use-neutral-variation-interpretation.md`
- `docs/technical/decisions/0022-decide-v1-ui-direction.md`
- `specs/v1/acceptance-criteria.md`
- `specs/v1/implementation-plan.md`
- `specs/v1/open-questions.md`
- `specs/v1/spec.md`
- `specs/v1/tasks/t-012-implement-weekly-logic.md`
- `specs/v1/tasks/t-016-implement-measurement-form.md`
- `specs/v1/tasks/t-017-implement-measurement-list.md`
- `specs/v1/tasks/t-019-implement-weekly-dashboard-api.md`
- `specs/v1/tasks/t-020-implement-dashboard-ui.md`

## Definition of Done

- [x] Acceptance criteria are met
- [x] Implementation matches the approved spec or plan
- [x] Relevant docs or specs were updated when needed
- [x] Tests or manual validation were completed
- [x] No unrelated changes were introduced
- [x] Task notes include validation results
