# Secrets

BodyLog has two runtime secrets, both read by the Worker:

```txt
APP_PASSWORD     the single user's login password
SESSION_SECRET   signs the session cookie
```

## Production

Set them as Cloudflare Worker secrets from `apps/api`, never in `wrangler.toml` or the repository:

```sh
cd apps/api
npx wrangler secret put APP_PASSWORD --env production
npx wrangler secret put SESSION_SECRET --env production
```

Changing `SESSION_SECRET` invalidates every existing session, so the installed PWA asks for the password again.

## Local Development

`.env.development` at the repo root is committed with placeholder values for both secrets and the non-secret vars; `wrangler dev` reads it through `--env-file`. `.env.local` and `.env.production` are gitignored and hold real values that exist nowhere else: never delete, move or overwrite them.

## CI

The deploy workflow reads `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from the GitHub repository secrets ([Environment setup](environment-setup.md#github-repository-secrets)).

## Adding a Secret

Document a new secret on this page with what it is for and how to set it, and never commit its value.
