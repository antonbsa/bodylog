# 0036 — Track Tasks Only as GitHub Issues

## Status

Accepted

## Context

`0021-use-markdown-tasks-under-specs.md` kept executable tasks as markdown files under `specs/v1/tasks/`. The mobile redesign is larger than the earlier tasks and needs grouping, status and discussion per task, and its tasks are validated by screenshots against the prototype, which fit an issue better than a file.

## Decision

Track executable work exclusively as GitHub issues: one umbrella issue per initiative with native sub-issues, one per task, each with scope, acceptance criteria and validation.

No new task files are added under `specs/`. Existing files under `specs/v1/tasks/` stay as history and are removed by the owner later. `docs/` keeps stable product, technical and architectural knowledge, and `specs/` keeps version-level specifications.

## Consequences

`AGENTS.md` is updated so agents track tasks only as issues. Tasks superseded by new issues are noted in the issues, not in the old task files.

The work lands on one feature branch with one commit per task and a single pull request linked to the umbrella issue.
