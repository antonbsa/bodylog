# BodyLog V2 Specification

## Purpose

BodyLog V2 polishes the V1 foundation: cleaner internal architecture, improved
UI/UX, and extra non-blocking MVP features that were deliberately deferred from
V1.

## Scope

V2 includes:

- backend domain model refactor to encapsulate business rules in domain objects;
- UI/UX polish and Radix UI adoption across all components;
- offline-first logging for the installed PWA;
- non-blocking MVP features deferred from V1.

V2 excludes:

- multi-user support;
- complex authentication;
- Google Sheets integration;
- health recommendations or automatic interpretation;
- serverless Postgres migration (planned for V3).

## Source Documents

- Product (overview, requirements, scope, user flows): `docs/product.md`
- Architecture: `docs/architecture/overview.md`
- API contract: `docs/reference/api-contract.md`
- Database model: `docs/reference/database.md`
- Technical decisions: `docs/decisions/`
- Future ideas: `docs/product/future-ideas.md`

## Success Criteria

- Backend business logic is encapsulated in domain objects, not free functions.
- UI components use Radix UI primitives consistently across the app.
- All V1 acceptance criteria remain satisfied after V2 changes.
- New non-blocking MVP features are delivered without expanding scope into
  multi-user or Postgres migration territory.
