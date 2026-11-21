# Documentation

Pick the page that matches what you're doing.

## Understand

- **[Product](product.md)**: what BodyLog is for, the core flows, the requirements and what the app deliberately doesn't do.
- **[UI direction](product/ui-direction.md)**: how each screen looks and behaves, with the approved [prototype](product/prototype/mobile-redesign.html) as the visual reference.
- **[Architecture](architecture/overview.md)**: how the app works end to end and why: the stack, the frontend and backend layout, and the cross-cutting rules every change follows.

## Do

- **[Run locally](guides/run-locally.md)**: installing, preparing the local database, starting the app and running the checks.

## Operate

- **[Deploying](operations/deploying.md)**: how a merge reaches preview and a release reaches production, cutting a release, undoing a migration, or deploying by hand.
- **[Environment setup](operations/environment-setup.md)**: what a Cloudflare environment is made of: Worker, D1, Wrangler config, non-secret vars, CI credentials.
- **[Secrets](operations/secrets.md)**: the GitHub OAuth App and its credentials per environment, and where local placeholders live.
- **[Backup and restore](operations/backup-and-restore.md)**: the daily encrypted D1 export to Backblaze B2, restoring from it or from Time Travel, and rehearsing a restore.

## Look Up

- **[API contract](reference/api-contract.md)**: the HTTP surface: routes, shapes and errors.
- **[Database](reference/database.md)**: the D1 tables, how they relate, their unique keys and the session lifecycle.
- **[Measurements](reference/measurements.md)**: the measurement fields and limits, the derived values, the weekly average and comparison rules, and the CSV format.
- **[Glossary](../GLOSSARY.md)**: the domain terms: Measurement, Derived values, Week, Current week, Comparison week, Variation, Percentage points.
- **[Project history](history.md)**: how the app got to its current shape: the spreadsheet replacement and the mobile redesign.

## Record

- **[Architecture decisions](decisions/README.md)**: the reasoning behind each decision, one ADR per decision; some are superseded by later ones.
- **[Future ideas](product/future-ideas.md)**: ideas outside the current scope, kept as context, not as planned work.

Executable work is tracked as GitHub issues. Agent and contributor conventions live in the [`AGENTS.md`](../AGENTS.md) files, not here.
