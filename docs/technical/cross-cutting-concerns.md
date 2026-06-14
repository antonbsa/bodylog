# Cross-Cutting Concerns

## Purpose

This document captures concerns that should influence implementation across V1 and future versions.

These concerns are not standalone release scope. They are standing guidance for task implementation, technical decisions, reviews, and future ADRs.

Use ADR-style files under `docs/technical/decisions/` when a concrete decision is made from one of these concerns.

## Dependency Boundaries

BodyLog V1 intentionally uses React, Vite, Hono, Cloudflare Workers, and Cloudflare D1.

The project should not abstract every selected tool just to remain theoretically portable. V1 priority is delivery with a small, understandable implementation.

However, product and domain behavior should not be tightly coupled to infrastructure details when a future migration is already plausible.

Guidelines:

- Keep HTTP concerns in routes and middleware.
- Keep product behavior in services or use cases.
- Keep SQL, D1 bindings, and row mapping inside repositories.
- Keep domain types independent from D1-specific types.
- Isolate authentication/session mechanics behind small helpers instead of spreading cookie and secret handling across routes.
- Introduce provider-style abstractions only when there is a concrete boundary to protect, such as persistence, sessions, or deployment-specific integrations.

## Security and Privacy

BodyLog stores personal body metrics. Even though V1 is single-user, security and privacy should be considered from the beginning.

Guidelines:

- Store passwords, session secrets, and deployment credentials only in environment variables or Cloudflare secrets.
- Protect all data routes with authentication.
- Use secure session handling appropriate for Cloudflare Workers.
- Avoid logging passwords, session tokens, CSV contents, or measurement values.
- Treat CSV import/export as sensitive data movement.
- Do not commit real personal data, exported CSV backups, secrets, or production database files.
- Avoid health interpretation, diagnosis, recommendations, or motivational value judgments in V1.
- Do not design V1 code in a way that assumes future multi-user authorization is already solved.

## Data Correctness

The app replaces a spreadsheet workflow, so trust depends on correct calculations and predictable data handling.

Guidelines:

- Store at most one measurement per date.
- Treat `YYYY-MM-DD` dates consistently across API, database, and CSV.
- Display and accept dates in the UI as `DD/MM/YYYY` for `pt-BR`.
- Keep week calculations aligned with Monday-start weeks.
- Compare partial current week against the previous full week.
- Display percentage metric changes in percentage points.
- Use the documented stable thresholds for weekly direction.
- Ignore missing optional values when calculating averages for that metric.
- Keep derived calculations covered by focused automated tests.
- Document assumptions when date, rounding, tolerance, or import behavior is ambiguous but not blocking.

## Data Ownership and Recovery

The user should be able to keep and move their data without depending on the application forever.

Guidelines:

- Preserve CSV export as the primary V1 backup path.
- Keep the documented CSV format stable unless a migration note is added.
- Validate CSV import clearly and avoid silent data loss.
- Upsert imported records by date.
- Version database migrations.
- Keep future D1-to-Postgres migration awareness in repository and migration design.

## Scope Discipline

V1 is a personal body metrics tracker, not a generic fitness platform.

Guidelines:

- Prefer small, explicit implementation over broad frameworks or speculative architecture.
- Do not add multi-user support, account registration, OAuth, charts, offline-first behavior, Google Sheets integration, recommendations, or health interpretation in V1 unless scope changes explicitly.
- Do not add user-configurable goals in V1; weight variation color uses the documented V1 assumption until goal settings exist.
- Keep future ideas in `docs/product/future-ideas.md` or future version specs, not in executable V1 tasks.
- Let automated tests scale with the risk of the behavior being implemented.

## Mobile Usability

The primary usage context is fast daily logging from a smartphone.

Guidelines:

- Keep forms short and easy to complete.
- Make weight the only required body metric in V1.
- Load an existing record when its date is selected.
- Make missing optional values clear without blocking the workflow.
- Favor readable cards and tables over charts in V1.
- Use the single dashboard page as the authenticated V1 app surface.
- Open measurement creation/editing in a mobile full-viewport modal or equivalent.
- Validate mobile usability before considering desktop-specific polish.

## Operational Safety

The app should remain easy to deploy and maintain as a personal project.

Guidelines:

- Keep deployment Cloudflare-only for V1.
- Run automated checks before deployment.
- Document required secrets without committing their values.
- Keep deployment and environment assumptions current in technical docs.
- Avoid operational complexity that does not directly support V1 delivery.
