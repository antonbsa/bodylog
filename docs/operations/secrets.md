# Secrets

BodyLog has four runtime secrets, all read by the Worker:

```txt
GITHUB_CLIENT_ID       the GitHub OAuth App's client id
GITHUB_CLIENT_SECRET   the GitHub OAuth App's client secret
GOOGLE_CLIENT_ID       the Google OAuth client's id
GOOGLE_CLIENT_SECRET   the Google OAuth client's secret
```

Each deployed environment has its own GitHub OAuth App, because an OAuth App accepts a single callback URL. Create it under GitHub **Settings → Developer settings → OAuth Apps → New OAuth App**, with the environment's URL as **Homepage URL** and `<that URL>/api/auth/github/callback` as **Authorization callback URL**, then generate a client secret.

For Google, create an OAuth client of type **Web application** in the Google Cloud console (**Google Auth Platform → Clients**), after configuring the consent screen with the `openid`, `email` and `profile` scopes. Publishing the production consent screen (**Audience → Publish app**) requires, under **Branding**, `https://bodylog.antonbsa.dev` as home page, `https://bodylog.antonbsa.dev/privacidade` as privacy policy and `antonbsa.dev` as authorized domain; a consent screen left in **Testing** admits only its listed test users. Unlike a GitHub OAuth App, one client accepts several **Authorized redirect URIs**, so it can list `<URL>/api/auth/google/callback` for each environment; separate clients per environment work too.

## Production

Set them as Cloudflare Worker secrets from `apps/api`, never in `wrangler.toml` or the repository:

```sh
cd apps/api
npx wrangler secret put GITHUB_CLIENT_ID --env production
npx wrangler secret put GITHUB_CLIENT_SECRET --env production
npx wrangler secret put GOOGLE_CLIENT_ID --env production
npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
```

The production callbacks are `https://bodylog.antonbsa.dev/api/auth/github/callback` and `https://bodylog.antonbsa.dev/api/auth/google/callback`. Rotating the client secret signs nobody out: sessions live in D1 and don't depend on it.

## Preview

Preview has its own GitHub OAuth App, whose callback is the preview Worker's `workers.dev` URL plus `/api/auth/github/callback`, and its Google redirect URI is that URL plus `/api/auth/google/callback`:

```sh
cd apps/api
npx wrangler secret put GITHUB_CLIENT_ID --env preview
npx wrangler secret put GITHUB_CLIENT_SECRET --env preview
npx wrangler secret put GOOGLE_CLIENT_ID --env preview
npx wrangler secret put GOOGLE_CLIENT_SECRET --env preview
```

Each deploy checks that all four secrets exist in its environment (`npm run check-secrets:preview` or `check-secrets:production`, via `infra/scripts/deploy/check-secrets.mjs`) and fails before migrations, naming any that is missing. A new secret is added to `REQUIRED_SECRETS` there.

`APP_PASSWORD` and `SESSION_SECRET` are no longer read; delete them from each environment with `npx wrangler secret delete <NAME> --env <preview|production>` once the release that removes them is deployed there.

## Local Development

`.env.development` at the repo root is committed with placeholder GitHub and Google credentials, `DEV_LOGIN_ENABLED="true"` and the non-secret vars; `wrangler dev` reads it, then `.env.local` on top, through two `--envFile` flags; a missing `.env.local` is skipped. `.env.local` and `.env.production` are gitignored and hold real values that exist nowhere else: never delete, move or overwrite them. Real local OAuth credentials are optional ([Environment setup](environment-setup.md#local-github-sign-in)).

## CI

The deploy workflows read `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from the GitHub repository secrets ([Environment setup](environment-setup.md#github-repository-secrets)).

## Adding a Secret

Document a new secret on this page with what it is for and how to set it, and never commit its value.

## Backup Secrets

The daily D1 backup ([backup and restore](backup-and-restore.md)) reads two more GitHub Actions secrets, `B2_KEY_ID` and `B2_APPLICATION_KEY`: a Backblaze B2 application key limited to the backup bucket. Its non-secret settings are repository variables ([Environment setup](environment-setup.md#backup-storage)).

The `age` private key that decrypts the dumps is not a GitHub or Cloudflare secret: it lives only in the owner's password manager, and only its public key is committed, in `infra/backups/age-recipient.txt`. Losing the private key makes every dump unreadable; rotating it means committing the new public key, and dumps made before the change still need the old private key until the bucket's 30-day retention drops them.
