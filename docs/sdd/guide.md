# Spec-Driven Development Guide

## Purpose

Use specifications as the main source of context to turn an idea into working software, reducing ambiguity between intent, implementation, and validation.

This project uses SDD as a lightweight delivery tool, not as bureaucracy.

## Principles

- Delivery over perfection.
- Specification should be sufficient, not exhaustive.
- Each requirement should be testable or manually verifiable.
- Each implementation task should map to a requirement or technical decision.
- Out-of-scope items must be explicitly recorded.
- Important decisions should be documented briefly.
- Documentation should help implementation, not delay it.

## SDD Levels

### Spec-first

The specification is written before implementation starts.

### Spec-anchored

The specification remains active during project evolution and is updated when decisions change.

### Spec-as-source

The specification becomes the primary editable source and implementation is treated as derived from it.

## Adopted Level

This project uses **spec-first + spec-anchored**.

It does not use strict spec-as-source. Code can evolve directly when needed, but relevant behavior changes must be reflected in the docs.

## When to Use the Specs

Use the specs to:

- understand the product goal;
- define implementation boundaries;
- guide AI agents;
- avoid scope creep;
- validate whether V1 is complete;
- preserve context across sessions.

## When Not to Overuse the Specs

Do not use specs as an excuse to avoid building.

The project is personal and V1-focused. If a detail does not affect the current implementation, it can be postponed to the backlog.

## Documentation Categories

- `docs/product`: product definition, requirements, user flows, scope, and future ideas.
- `docs/technical`: architecture, data model, API contract, deployment, and ADR-style decisions.
- `docs/implementation`: high-level implementation plan and validation context.
- `backlog`: executable implementation tasks, task progress, and delivery tracking.
- `AGENTS.md`: operating instructions for AI coding agents.

## Rule of Thumb

A document is useful only if it helps answer one of these questions:

- What are we building?
- Why are we building it?
- What is included in V1?
- How should it behave?
- How will we implement it?
- How will we know it is done?
