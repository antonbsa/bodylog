# Deploying

BodyLog runs as one Cloudflare Worker per environment, each serving the built web app and the API (`0040-serve-the-web-app-from-the-api-worker.md`): `bodylog-preview` for every merge to `main`, and `bodylog` at `https://bodylog.antonbsa.dev` for each published release (`0041-release-gated-production-deploys-with-a-preview-environment.md`). Standing up the Cloudflare side is in [Environment setup](environment-setup.md); the secrets each environment needs are in [Secrets](secrets.md).

## Automatic Deploys

- **Preview.** `.github/workflows/deploy-preview.yaml` runs on every push to `main`. It asks the GitHub API whether the commit came from a merged PR: if so, the `Code quality` and `Automated tests` checks already ran on that PR and are skipped; a direct push runs them first. Then it checks the preview secrets (`npm run check-secrets:preview`), applies pending D1 migrations to `bodylog-preview` and runs `npm run deploy:preview`.
- **Production.** `.github/workflows/deploy-release.yaml` runs when a GitHub release is published. It always re-runs both checks against the tagged commit, checks out the tag, checks the production secrets (`npm run check-secrets:production`), records a D1 Time Travel bookmark in the job summary, applies pending migrations to `bodylog-prod` and runs `npm run deploy`.

Both use the `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` repository secrets. A failed check, missing secret or failed migration stops the job before the deploy. Deploys of one environment queue (`concurrency: deploy-preview` / `deploy-production`) and are never cancelled mid-run.

## Cutting a Release

Releases are tagged `vMAJOR.MINOR.PATCH`, starting at `v0.2.0`; the tag is the version of record, the `package.json` versions are not bumped, and there is no CHANGELOG file.

1. Check that the `main` commit to ship deployed to preview and works there.
2. Pick the next version: patch for fixes only, minor for new behavior or a migration.
3. Draft the release on that commit, with notes generated from the merged PRs:

   ```sh
   gh release create v0.2.0 --target <commit-sha> --generate-notes --draft
   ```

4. Review the draft on GitHub (the notes follow the categories in `.github/release.yml`; PRs labeled `skip-changelog` are left out), call out any migration in the notes, then publish it. Publishing starts the production deploy.

## Undoing a Bad Migration

Before applying migrations, the production deploy writes the output of `wrangler d1 time-travel info DB --env production` to its job summary under "D1 bookmark before migrations". To roll the database back to that point, from `apps/api`:

```sh
npx wrangler d1 time-travel restore DB --env production --bookmark=<bookmark>
```

The restore replaces the whole database, including any measurement written after the bookmark, so export a CSV first if the app was used in between. Then ship code that matches the restored schema (a new release on an earlier commit, or a fix), since the next release re-applies every migration the restored database no longer records.

## Deploying Manually

```sh
npm run deploy           # builds apps/web, then `wrangler deploy --env production` from apps/api
npm run deploy:preview   # same, with `--env preview`
```

Both upload `apps/web/dist` as the Worker's static assets. Neither applies migrations. The top level of `apps/api/wrangler.toml` is local dev only; deployed environments always go through `--env preview` or `--env production`.

Locally, authenticate Wrangler once through the browser with `npx wrangler login`. In a non-interactive environment, such as CI or an agent session, Wrangler needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set before deploying.

## Checking the Config Without Deploying

```sh
npm run build
cd apps/api && npx wrangler deploy --dry-run --env production   # or --env preview
```

The dry run lists the static assets and the `DB` binding.

## Applying a Migration

Migrations are versioned under `infra/migrations/` (named `<YYYYMMDDHHMMSS>_<snake_case_name>.sql`, ADR 0045), and the deploy workflows apply pending ones: preview on merge, production on release. To apply them to production by hand:

```sh
npm run db:migrate:remote
```

Query production ad hoc with:

```sh
npm run db:query:remote -- "SELECT COUNT(*) AS count FROM measurements"
```

Both scripts pass `--env production`; without it, `--remote` targets the placeholder local database and fails instead of reaching production data. For preview, run the same `wrangler d1` commands from `apps/api` with `--env preview --remote`.
