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

## Preview

Preview has its own values, distinct from production, so a preview session never works in production:

```sh
cd apps/api
npx wrangler secret put APP_PASSWORD --env preview
npx wrangler secret put SESSION_SECRET --env preview
```

Each deploy checks that both secrets exist in its environment (`npm run check-secrets:preview` or `check-secrets:production`, via `infra/scripts/deploy/check-secrets.mjs`) and fails before migrations, naming any that is missing. A new secret is added to `REQUIRED_SECRETS` there.

## Local Development

`.env.development` at the repo root is committed with placeholder values for both secrets and the non-secret vars; `wrangler dev` reads it through `--env-file`. `.env.local` and `.env.production` are gitignored and hold real values that exist nowhere else: never delete, move or overwrite them.

## CI

The deploy workflows read `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from the GitHub repository secrets ([Environment setup](environment-setup.md#github-repository-secrets)).

## Adding a Secret

Document a new secret on this page with what it is for and how to set it, and never commit its value.

## Backup Secrets

The daily D1 backup ([backup and restore](backup-and-restore.md)) reads two more GitHub Actions secrets, `B2_KEY_ID` and `B2_APPLICATION_KEY`: a Backblaze B2 application key limited to the backup bucket. Its non-secret settings are repository variables ([Environment setup](environment-setup.md#backup-storage)).

The `age` private key that decrypts the dumps is not a GitHub or Cloudflare secret: it lives only in the owner's password manager, and only its public key is committed, in `infra/backups/age-recipient.txt`. Losing the private key makes every dump unreadable; rotating it means committing the new public key, and dumps made before the change still need the old private key until the bucket's 30-day retention drops them.
