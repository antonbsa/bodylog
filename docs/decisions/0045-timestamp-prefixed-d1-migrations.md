---
status: Accepted
area: platform
---

# 0045 — Timestamp-Prefixed D1 Migrations

## Status

Accepted

## Context

Migrations are hand-written SQL in `infra/migrations/`, named `<NNNN>_<name>.sql` with the next four-digit number. Parallel worktrees branch from the same `main`, so two branches pick the same number. With no journal file, git merges both files without a conflict, and each PR passes CI on its own: the private repo can't require an up-to-date branch, and a merged PR's push to `main` doesn't rerun the checks. Once a duplicate lands on `main` it can't be renumbered, because wrangler tracks applied migrations by filename in `d1_migrations` and a renamed file re-runs and fails.

## Decision

- **Timestamp names.** New migrations are named `<YYYYMMDDHHMMSS>_<snake_case_name>.sql` in UTC, produced with `date -u +%Y%m%d%H%M%S`. Wrangler sorts lexicographically, so the legacy files still apply first.
- **Legacy files keep their names.** `0001`, `0002` and `0003` are never renamed, since renaming re-runs them in preview and production.
- **A merged migration never changes name.** Before merging, a branch whose migration is older than the newest one on `main` re-stamps it with a fresh timestamp; this is safe because only that worktree's local D1 knows the name.
- **A unit test enforces the naming.** Every `.sql` matches `^\d+_[a-z0-9_]+\.sql$`, no two files share a prefix, and every prefix outside the legacy list is a 14-digit timestamp starting with `20`.

## Consequences

- Parallel branches can't produce the same filename.
- Migrations written in parallel are assumed independent, so a merge order that differs from timestamp order is accepted.
- Filenames lose the ordinal, and the re-stamp step after merging `main` is manual.
- Alternatives not taken: a `db:migration:new` scaffolding script and a journal file, since the SQL stays hand-written.
