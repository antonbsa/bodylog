# Deploying

Production is one Cloudflare Worker, `bodylog`, serving the built web app and the API from `https://bodylog.antonbsa.dev` (`0040-serve-the-web-app-from-the-api-worker.md`). Standing up the Cloudflare side is in [Environment setup](environment-setup.md); the secrets it needs are in [Secrets](secrets.md).

## Automatic Deploys

`.github/workflows/deploy.yml` runs on every push to `main` (and by manual dispatch). It calls the `Code quality` and `Automated tests` workflows, and only after both pass runs `npm run deploy` with the `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` repository secrets. Only one deploy runs at a time (`concurrency: deploy-production`).

The workflow does not apply D1 migrations: apply them by hand before merging a change that needs them (see below).

## Deploying Manually

```sh
npm run deploy
```

`npm run deploy` builds `apps/web` and runs `wrangler deploy --env production` from `apps/api`, uploading `apps/web/dist` as the Worker's static assets. The top level of `apps/api/wrangler.toml` is local dev only; production always goes through `--env production`.

Locally, authenticate Wrangler once through the browser with `npx wrangler login`. In a non-interactive environment, such as CI or an agent session, Wrangler needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set before deploying.

## Checking the Config Without Deploying

```sh
npm run build
cd apps/api && npx wrangler deploy --dry-run --env production
```

The dry run lists the static assets and the `DB` binding.

## Applying a Migration

Migrations are versioned under `infra/migrations/` (for example `0001_create_measurements.sql`). Apply pending ones to production with:

```sh
npm run db:migrate:remote
```

Query production ad hoc with:

```sh
npm run db:query:remote -- "SELECT COUNT(*) AS count FROM measurements"
```

Both scripts pass `--env production`; without it, `--remote` targets the placeholder local database and fails instead of reaching production data.
