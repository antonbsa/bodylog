---
status: Accepted
area: delivery
amended-by: ["0044"]
---

# 0041 — Release-gated Production Deploys with a Preview Environment

## Status

Accepted

## Context

`.github/workflows/deploy.yml` deployed every push to `main` straight to production once the checks passed. It never applied D1 migrations, so a schema change had to be applied to production by hand before its merge, and nothing exercised a change on a real Worker and D1 before production did. `antonbsa/twitch-radar` deploys a `preview` environment on every push to `main` and production only when a GitHub release is published.

Two gates between a merge and production were considered: a GitHub Environment with a required reviewer on the same run, or a release. Both add one deliberate human act. A release also gives each production deploy a tag and GitHub-generated notes from the merged PRs, so knowing what shipped when costs nothing extra.

## Decision

- `apps/api/wrangler.toml` gains `[env.preview]`: worker `bodylog-preview` with its own D1 database `bodylog-preview`, and the same vars, observability and assets as production, re-declared because named environments do not inherit.
- `.github/workflows/deploy-preview.yaml` runs on every push to `main`. It asks the GitHub API whether the commit came from a merged PR; if not (a direct push), it runs the reusable `Code quality` and `Automated tests` workflows first. Then it checks the preview secrets, applies pending D1 migrations to `bodylog-preview` and runs `npm run deploy:preview`.
- `.github/workflows/deploy-release.yaml` runs when a GitHub release is published. It always re-runs both check workflows against the tagged commit, checks out the tag, checks the production secrets, writes a D1 Time Travel bookmark to the job summary, applies pending migrations to `bodylog-prod` and runs `npm run deploy`.
- Each environment's deploy job has its own concurrency group with `cancel-in-progress: false`, so a deploy waits for the previous one and is never cancelled between its migrations and its deploy.
- `infra/scripts/deploy/check-secrets.mjs` fails before any migration when `APP_PASSWORD` or `SESSION_SECRET` is missing from the target Worker, naming the missing secret. It calls Wrangler through `run-wrangler-with-retry.mjs`, which retries only transient Cloudflare API failures.
- Releases are tagged `vMAJOR.MINOR.PATCH`, starting at `v0.2.0`. The tag is the version of record; notes are GitHub-generated from the `.github/release.yml` categories, and there is no CHANGELOG file. PRs labeled `skip-changelog` stay out of the notes.
- Both workflows use the existing `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` repository secrets.

## Consequences

- `main` moving forward never changes production by itself; a migration reaches `bodylog-preview` on merge and `bodylog-prod` only with a release.
- CI applies migrations in both environments, so a migration must work against the data already in each database; a bad one is undone with `wrangler d1 time-travel restore` and the bookmark from the release's job summary.
- Shipping to production takes one more step (tag and publish a release), which is intended friction for a single-owner project.
- Preview has its own empty D1 and its own secrets, so its data and sessions never mix with production.
- The Cloudflare API token must be able to edit Workers scripts and D1 for both Workers.

## Update — GitHub OAuth secrets (ADR 0044)

The required secrets are now `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`; `APP_PASSWORD` and `SESSION_SECRET` are no longer used or checked.
