# BodyLog V1 Specification

## Purpose

BodyLog V1 provides the minimum useful system for recording daily body measurements, reviewing measurement history, and understanding weekly progress without using a spreadsheet.

## Scope

V1 includes:

- mobile-first personal measurement logging;
- one measurement per date;
- create, edit, delete, and list measurement records;
- weekly averages and current partial week comparison against the previous full week;
- CSV import and export;
- simple single-user authentication;
- basic PWA installability;
- Cloudflare-only deployment using Workers, Pages, and D1.

V1 excludes:

- multi-user support;
- complex authentication;
- Google Sheets integration;
- advanced charts;
- offline-first behavior;
- health recommendations or automatic interpretation;
- serverless Postgres migration.

## Source Documents

- Product overview: `docs/product/overview.md`
- Requirements: `docs/product/requirements.md`
- Scope: `docs/product/scope.md`
- User flows: `docs/product/user-flows.md`
- UI direction: `docs/product/ui-direction.md`
- Architecture: `docs/technical/architecture.md`
- API contract: `docs/technical/api.md`
- Database model: `docs/technical/database.md`
- Cross-cutting concerns: `docs/technical/cross-cutting-concerns.md`
- Technical decisions: `docs/technical/decisions/`

## Success Criteria

- The user can log a daily measurement faster than using the spreadsheet.
- Existing records load when their date is selected for editing.
- The dashboard shows weekly averages, registration reliability, and V1 expected-outcome movement colors.
- CSV import can populate historical records.
- CSV export provides a portable backup.
- The app is usable from a smartphone.
- The app is deployed on Cloudflare and protected by simple authentication.
