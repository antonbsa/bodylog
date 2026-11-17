# Documentation

Pick the page that matches what you're doing.

## Understand

- **[Product](product.md)**: what BodyLog is for, the core flows, the requirements and what the app deliberately doesn't do.
- **[UI direction](product/ui-direction.md)**: how each screen looks and behaves, with the approved [prototype](product/prototype/mobile-redesign.html) as the visual reference.
- **[Architecture](architecture/overview.md)**: how the app works end to end and why: the stack, the frontend and backend layout, and the cross-cutting rules every change follows.

## Do

- **[Run locally](guides/run-locally.md)**: installing, preparing the local database, starting the app and running the checks.

## Operate

- **[Deploying](operations/deploying.md)**: how a merge reaches production, deploying by hand, or applying a migration.
- **[Environment setup](operations/environment-setup.md)**: what a Cloudflare environment is made of: Worker, D1, Wrangler config, non-secret vars, CI credentials.
- **[Secrets](operations/secrets.md)**: setting or rotating `APP_PASSWORD` and `SESSION_SECRET`, and where local placeholders live.

## Look Up

- **[API contract](reference/api-contract.md)**: the HTTP surface: routes, shapes and errors.
- **[Database](reference/database.md)**: the measurement table, the derived values and the weekly average and comparison rules.
- **[Glossary](../GLOSSARY.md)**: the domain terms: Measurement, Derived values, Week, Current week, Comparison week, Variation, Percentage points.
- **[Project history](history.md)**: how the app got to its current shape: the spreadsheet replacement and the mobile redesign.

## Record

- **[Architecture decisions](decisions/README.md)**: the reasoning behind each decision, one ADR per decision; some are superseded by later ones.
- **[Future ideas](product/future-ideas.md)**: ideas outside the current scope, kept as context, not as planned work.

Executable work is tracked as GitHub issues. Agent and contributor conventions live in the [`AGENTS.md`](../AGENTS.md) files, not here.
