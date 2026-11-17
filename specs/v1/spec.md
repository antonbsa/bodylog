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
- charts outside the Tendências screen and advanced chart features (`0030-allow-charts-in-trends.md`);
- offline-first behavior;
- health recommendations or automatic interpretation;
- serverless Postgres migration.

## Source Documents

- Product (overview, requirements, scope, user flows): `docs/product.md`
- UI direction: `docs/product/ui-direction.md`
- Architecture: `docs/architecture/overview.md`
- API contract: `docs/reference/api-contract.md`
- Database model: `docs/reference/database.md`
- Cross-cutting concerns: `docs/architecture/overview.md#cross-cutting-concerns`
- Technical decisions: `docs/decisions/`

## Success Criteria

- The user can log a daily measurement faster than using the spreadsheet.
- Existing records load when their date is selected for editing.
- The dashboard shows weekly averages, the registration count against the 7-day target, and neutral variation (`0035-use-seven-day-weekly-target.md`, `0031-use-neutral-variation-color.md`).
- CSV import can populate historical records.
- CSV export provides a portable backup.
- The app is usable from a smartphone.
- The app is deployed on Cloudflare and protected by simple authentication.
