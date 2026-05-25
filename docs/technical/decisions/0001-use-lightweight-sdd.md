# 0001 — Use Lightweight SDD

## Status

Accepted

## Context

The project needs enough specification to guide delivery and preserve context for future work, but V1 is a personal project where documentation overhead can slow implementation.

## Decision

Use lightweight SDD with spec-first and spec-anchored practices, without strict spec-as-source.

## Consequences

Specifications guide implementation and validation, but code may evolve directly when appropriate. Relevant behavior changes still need to be reflected in the docs.
