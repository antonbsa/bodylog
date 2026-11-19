---
status: Accepted
area: delivery
---

# 0042 — Scheduled Encrypted D1 Exports to Backblaze B2

## Status

Accepted

## Context

Every BodyLog measurement lives only in the production D1 database, `bodylog-prod`. D1 Time Travel restores a database to any minute of the last 30 days, which covers a bad write or a bad migration, but not deleting the database or losing the Cloudflare account. CSV export is a manual backup the user may or may not take. `antonbsa/twitch-radar` already runs a daily encrypted export to Backblaze B2.

## Decision

Recovery objectives:

- A logical error (bad write or migration) recovers to the minute through Time Travel.
- Losing the database or the account recovers to at most 24 hours back, from an off-site export.
- The preview environment is not backed up: its data is disposable.

Mechanism:

- **Daily export.** `.github/workflows/backup-d1.yaml` runs every day at 06:17 UTC (03:17 in São Paulo, `USER_TIME_ZONE`) and by manual dispatch. It runs `wrangler d1 export DB --remote --env production`, addressing the database by binding so a rename doesn't break it. Runs never overlap and are never cancelled.
- **Verify before upload.** The dump is imported into a throwaway local D1, and the run fails if `measurements` or `d1_migrations` is empty, so an empty or broken export never replaces a good one in the bucket.
- **Encrypt.** The dump is encrypted with `age` to the public key in `infra/backups/age-recipient.txt`; the private key lives only in the owner's password manager. The run fails early while the file has no `age1...` key.
- **Off-site storage.** The encrypted dump is uploaded as `bodylog-prod-<UTC timestamp>.sql.age` through B2's S3-compatible API to a private bucket in a different provider from the database. The application key is limited to that bucket and lives only as a GitHub Actions secret. A lifecycle rule deletes each dump 30 days after upload.
- **Cost guard.** The dump is a few kilobytes, far inside B2's free 10 GB. Daily caps on the account make an overrun fail with `403` instead of billing.
- **Notification.** A failed step fails the run, and GitHub's workflow-failure email is the alert.
- **Rehearsal.** A restore of the latest dump into the preview environment is repeated every few months, following [backup and restore](../operations/backup-and-restore.md).

## Consequences

- The export makes the database unavailable for the seconds it runs, so it is scheduled at night in the user's time zone.
- Accepted risks: up to 24 hours of data loss if the database and the account are lost; a stolen `age` private key plus bucket access exposes the measurements; a leaked application key can delete the bucket's dumps, but not production data.
- Alternatives not taken: Cloudflare R2 (same account as the database, so it doesn't survive losing the account); unencrypted dumps; relying on CSV export alone.
- The workflow needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets, the `B2_KEY_ID` and `B2_APPLICATION_KEY` secrets, and the `B2_BUCKET`, `B2_ENDPOINT` and `B2_REGION` variables; it stays disabled until they exist.
