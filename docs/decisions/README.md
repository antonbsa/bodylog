# Architecture Decision Records

This directory is the only home for accepted project decisions. Other documents state goals, requirements, behavior or implementation facts, and link here instead of carrying decision rationale or rejected alternatives inline.

## Adding or Changing an ADR

Name the file `NNNN-short-slug.md`, title it `# NNNN — Title`, and start it with YAML frontmatter; the `## Status` prose stays for humans:

```yaml
---
status: Accepted # Proposed | Accepted | Rejected | Superseded
area: web # product | platform | web | delivery | process
supersedes: ["0022"] # relations are optional: supersedes, superseded-by, amends, amended-by
---
```

- The first word of the `## Status` prose must match `status`. A partial change to an earlier decision is an amendment: its status stays `Accepted` and the relation is `amends`/`amended-by`. A fully replaced ADR is `Superseded` with `superseded-by`.
- Every relation is recorded on both files (`supersedes` on one, `superseded-by` on the other).
- Areas: `product` (scope and product rules), `platform` (stack, API and data shape, configuration), `web` (the PWA: UI, navigation, client state), `delivery` (CI, hosting, deploy), `process` (docs, tasks, workflow).
- The index below is generated. After adding an ADR or changing its frontmatter, run `npm run docs:index`; `npm run check-docs` (and CI) fails on invalid frontmatter, a missing inverse relation or a stale index.

## Index

<!-- docs-index:start -->

### Product

- [0002 — Design V1 Mobile-first](0002-design-v1-mobile-first.md) · Accepted
- [0003 — Defer Desktop-optimized Dashboard](0003-defer-desktop-optimized-dashboard.md) · Accepted
- [0004 — Exclude Google Sheets Integration from V1](0004-exclude-google-sheets-integration-v1.md) · Accepted
- [0005 — Include CSV Export in V1](0005-include-csv-export-v1.md) · Accepted
- [0006 — Include CSV Import in V1](0006-include-csv-import-v1.md) · Accepted · amended by 0043
- [0007 — Enforce One Record per Date](0007-enforce-one-record-per-date.md) · Accepted · amended by 0044
- [0008 — Use Date Form Create-or-edit Behavior](0008-use-date-form-create-or-edit.md) · Accepted
- [0009 — Require Only Weight in V1](0009-require-only-weight-v1.md) · Accepted
- [0010 — Use Monday Week Start](0010-use-monday-week-start.md) · Accepted
- [0011 — Compare Partial Current Week to Previous Full Week](0011-compare-partial-current-week-to-previous-full-week.md) · Accepted
- [0012 — Avoid Health Interpretation in V1](0012-use-neutral-variation-interpretation.md) · Accepted · amended by 0022, 0031
- [0029 — Include Offline-first Logging in V2](0029-include-offline-first-logging-v2.md) · Accepted
- [0032 — Add Waist, Sleep, Disposition and Notes Fields](0032-add-waist-sleep-disposition-and-notes-fields.md) · Accepted
- [0035 — Use Seven-day Weekly Target](0035-use-seven-day-weekly-target.md) · Accepted
- [0043 — Import CSV by Column Name with a Validated Preview](0043-import-csv-by-column-name-with-validated-preview.md) · Accepted · amends 0006 · amended by 0049
- [0049 — Empty CSV Cell Keeps the Stored Value](0049-empty-csv-cell-keeps-the-stored-value.md) · Accepted · amends 0043

### Platform

- [0013 — Use TypeScript Everywhere](0013-use-typescript-everywhere.md) · Accepted
- [0014 — Use Hono as the API Framework](0014-use-hono-api-framework.md) · Accepted
- [0016 — Use Cloudflare D1 as the V1 Database](0016-use-cloudflare-d1-v1.md) · Accepted
- [0017 — Plan Serverless Postgres Migration for V2](0017-plan-serverless-postgres-migration-v2.md) · Accepted
- [0023 — Use npm Workspaces Project Structure](0023-use-npm-workspaces-project-structure.md) · Accepted
- [0024 — Use Versioned Height Constant](0024-use-versioned-height-constant.md) · Superseded · superseded by 0025
- [0025 — Use User Height Environment Variable](0025-use-user-height-environment-variable.md) · Superseded · supersedes 0024 · superseded by 0046
- [0027 — Use User Time Zone Environment Variable](0027-use-user-time-zone-environment-variable.md) · Superseded · superseded by 0046
- [0044 — Multi-user Accounts with OAuth Sign-in](0044-multi-user-accounts-with-oauth-sign-in.md) · Accepted · amends 0007, 0041
- [0045 — Timestamp-Prefixed D1 Migrations](0045-timestamp-prefixed-d1-migrations.md) · Accepted
- [0046 — Per-user Height and Device Time Zone](0046-per-user-height-and-device-time-zone.md) · Accepted · supersedes 0025, 0027
- [0047 — Read-only Collector Endpoint Authorized by Personal Tokens](0047-read-only-collector-endpoint-authorized-by-personal-tokens.md) · Accepted · amended by 0048
- [0048 — Read-only MCP Server Authorized by Personal Tokens](0048-read-only-mcp-server-authorized-by-personal-tokens.md) · Accepted · amends 0047

### Web

- [0018 — Include Basic PWA in V1](0018-include-basic-pwa-v1.md) · Accepted
- [0022 — Decide V1 UI Direction](0022-decide-v1-ui-direction.md) · Accepted · amends 0012 · amended by 0030, 0033, 0034
- [0026 — Use Radix UI Components](0026-use-radix-ui-components.md) · Accepted
- [0030 — Allow Charts in Trends](0030-allow-charts-in-trends.md) · Accepted · amends 0022
- [0031 — Use Neutral Variation Color](0031-use-neutral-variation-color.md) · Accepted · amends 0012
- [0033 — Use Bottom Navigation](0033-use-bottom-navigation.md) · Accepted · amends 0022
- [0034 — Support Light, Dark and System Themes](0034-support-light-dark-and-system-themes.md) · Accepted · amends 0022
- [0037 — Use TanStack Query for Server State](0037-use-tanstack-query-for-server-state.md) · Accepted
- [0038 — Use react-day-picker for the Registration Calendar](0038-use-react-day-picker-for-registration-calendar.md) · Accepted
- [0039 — Compute Weekly Variation in the UI](0039-compute-weekly-variation-in-the-ui.md) · Accepted

### Delivery

- [0015 — Use Cloudflare-only Deployment for V1](0015-use-cloudflare-only-deployment-v1.md) · Accepted
- [0019 — Use Cloudflare Pages and Separate Worker](0019-use-cloudflare-pages-and-separate-worker.md) · Superseded · superseded by 0040
- [0028 — Use Same-Site Custom Domains for PWA Session](0028-use-same-site-custom-domains-for-pwa-session.md) · Superseded · superseded by 0040
- [0040 — Serve the Web App from the API Worker](0040-serve-the-web-app-from-the-api-worker.md) · Accepted · supersedes 0019, 0028
- [0041 — Release-gated Production Deploys with a Preview Environment](0041-release-gated-production-deploys-with-a-preview-environment.md) · Accepted · amended by 0044
- [0042 — Scheduled Encrypted D1 Exports to Backblaze B2](0042-scheduled-encrypted-d1-exports-to-backblaze-b2.md) · Accepted

### Process

- [0001 — Use Lightweight SDD](0001-use-lightweight-sdd.md) · Superseded · superseded by 0036
- [0020 — Use Backlog Directory for Executable Tasks](0020-use-backlog-directory-for-executable-tasks.md) · Superseded · superseded by 0021
- [0021 — Use Markdown Tasks Under Specs](0021-use-markdown-tasks-under-specs.md) · Superseded · supersedes 0020 · superseded by 0036
- [0036 — Track Tasks Only as GitHub Issues](0036-track-tasks-only-as-github-issues.md) · Accepted · supersedes 0001, 0021

<!-- docs-index:end -->
