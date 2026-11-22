# Backup and Restore

Every measurement lives only in the production D1 database, `bodylog-prod` (binding `DB` under `[env.production]` in `apps/api/wrangler.toml`). Two mechanisms protect it ([ADR 0042](../decisions/0042-scheduled-encrypted-d1-exports-to-backblaze-b2.md)): D1 Time Travel for a bad write or migration, and a daily encrypted export to Backblaze B2 for losing the database or the Cloudflare account. The preview environment is not backed up. Run every `wrangler` command below from `apps/api`.

## Restore to a Point in Time

For a bad write or a bad migration. D1 Time Travel keeps a point-in-time history of the database for the last 30 days:

```sh
npx wrangler d1 time-travel info DB --env production
npx wrangler d1 time-travel restore DB --env production --timestamp=<RFC 3339 or unix seconds>
```

The restore rewrites the database in place and prints the bookmark from just before it; `npx wrangler d1 time-travel restore DB --env production --bookmark=<that bookmark>` undoes the restore. Everything written after the chosen time is lost, so note any measurement logged since then and enter it again.

## Daily Off-Site Copy

`.github/workflows/backup-d1.yaml` runs every day at 06:17 UTC (03:17 in São Paulo) and by manual dispatch from the Actions tab. It:

1. fails early if a required secret or variable is missing, or if `infra/backups/age-recipient.txt` has no `age1...` public key;
2. exports production with `wrangler d1 export DB --remote --env production`;
3. imports the dump into a throwaway local D1 and fails if `measurements` or `d1_migrations` is empty;
4. encrypts it with `age` to the public key in `infra/backups/age-recipient.txt`;
5. uploads `bodylog-prod-<UTC timestamp>.sql.age` to the B2 bucket and writes the object key and size to the job summary.

A failed run emails through GitHub's workflow-failure notification. Runs never overlap. The bucket keeps each dump for 30 days. The dump holds every measurement in plain SQL once decrypted: never commit a decrypted dump or leave one on disk after a restore.

### One-Time Backup Setup

Until every step below is done, keep the workflow disabled (`gh workflow disable backup-d1.yaml`) so the daily run doesn't fail and email every day.

1. **Encryption key.** Run `age-keygen -o bodylog-backup-key.txt`. Replace the comment in `infra/backups/age-recipient.txt` with the `age1...` public key it prints, and commit that change. Store the whole key file (it holds the `AGE-SECRET-KEY-1...` private key) in the password manager, then delete the local copy. Without it, no dump can be decrypted.
2. **Bucket.** In the Backblaze web console, open **B2 Cloud Storage → Buckets → Create a Bucket**. Give it a globally unique name (for example `bodylog-d1-backups-<random suffix>`), set **Files in Bucket** to **Private**, enable **Default Encryption**, leave **Object Lock** disabled, and create it. The bucket card shows its **Endpoint**, for example `s3.us-west-004.backblazeb2.com`.
3. **Retention.** On the bucket card, open **Lifecycle Settings**, choose **Use custom lifecycle rules**, and add one rule with an empty **File Name Prefix**, **Days Till Hide** `30` and **Days Till Delete** `1`. Each dump has its own name, so this hides it 30 days after upload and deletes it a day later.
4. **Application key.** Open **Application Keys → Add a New Application Key**. Name it `bodylog-backup-github`, set **Allow access to Bucket(s)** to the backup bucket only, **Type of Access** to **Read and Write**, and leave the file name prefix and duration empty. Copy the `keyID` and `applicationKey` right away: the console shows the application key only once.
5. **Daily caps.** Open **Caps & Alerts** and set the daily caps for storage, download bandwidth, Class B and Class C transactions to `$0`, so usage stays within the free allowance and an overrun returns `403` instead of billing. Add an alert email if you want a warning before a cap is hit.
6. **GitHub.** In the repository's **Settings → Secrets and variables → Actions**, add the secrets `B2_KEY_ID` (the `keyID`) and `B2_APPLICATION_KEY` (the `applicationKey`), and on the **Variables** tab add `B2_BUCKET` (the bucket name), `B2_ENDPOINT` (the endpoint with `https://`, for example `https://s3.us-west-004.backblazeb2.com`) and `B2_REGION` (the region part of the endpoint, for example `us-west-004`). The existing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets are reused; the token needs D1 edit permission on the account.
7. **First run.** Run `gh workflow enable backup-d1.yaml`, dispatch the workflow once from the Actions tab, check that the job summary names the uploaded object and that it appears in the bucket, then rehearse a restore (below).

## Restore From an Off-Site Dump

For a deleted database or a lost account.

1. **Download.** In the Backblaze console, open the bucket's **Browse Files**, pick the latest `bodylog-prod-<timestamp>.sql.age` and download it.
2. **Decrypt.** Save the key file from the password manager as `bodylog-backup-key.txt` and run `age --decrypt --identity bodylog-backup-key.txt --output dump.sql bodylog-prod-<timestamp>.sql.age`.
3. **Empty target.** The dump creates its tables with plain `CREATE TABLE`, so the target database must not have them yet. After losing the database, create a new one with `npx wrangler d1 create bodylog-prod` and put its `database_id` in `[env.production]` of `apps/api/wrangler.toml`. After losing the account, set up the account first as in [environment setup](environment-setup.md) and [secrets](secrets.md).
4. **Import.** Run `npx wrangler d1 execute DB --remote --env production --file=dump.sql`. The dump includes `d1_migrations`, so `npm run db:migrate:remote` afterwards applies only migrations newer than the dump.
5. **Check.** Run `npm run db:query:remote -- "SELECT COUNT(*) AS count, MAX(date) AS latest FROM measurements"`, then log in to the app and open Histórico.
6. **Clean up.** Delete `dump.sql`, the downloaded `.sql.age` file and the local key file.

### Rehearsal Into Preview

Every few months, and after changing the backup process, rehearse the restore against the preview environment (`--env preview` in `apps/api/wrangler.toml`), whose data is disposable. Follow steps 1, 2, 5 and 6 above, replacing steps 3 and 4 with the commands below. The reset drops every app table, child tables before `users` because D1 enforces foreign keys:

```sh
npx wrangler d1 execute DB --remote --env preview --command "DROP TABLE IF EXISTS api_tokens; DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS user_identities; DROP TABLE IF EXISTS measurements; DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS d1_migrations"
npx wrangler d1 execute DB --remote --env preview --file=dump.sql
npx wrangler d1 execute DB --remote --env preview --command "SELECT COUNT(*) AS count, MAX(date) AS latest FROM measurements"
```

The count and latest date must match production at the dump's time. Note the date and result in the pull request that changes the backup process, or in issue comments for a routine rehearsal.
