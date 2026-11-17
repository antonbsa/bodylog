---
status: Superseded
area: process
superseded-by: ["0036"]
---

# 0001 — Use Lightweight SDD

## Status

Superseded by `0036-track-tasks-only-as-github-issues.md`: executable work is tracked as GitHub issues, and the still-valid rules (docs updated with behavior changes, the ambiguity rule, tests with each feature) live in the root `AGENTS.md`.

## Context

The project needs enough specification to guide delivery and preserve context for future work, but V1 is a personal project where documentation overhead can slow implementation.

## Decision

Use lightweight SDD with spec-first and spec-anchored practices, without strict spec-as-source.

## Consequences

Specifications guide implementation and validation, but code may evolve directly when appropriate. Relevant behavior changes still need to be reflected in the docs.
