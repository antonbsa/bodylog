---
status: Superseded
area: platform
superseded-by: ["0025"]
---

# 0024 — Use Versioned Height Constant

## Status

Superseded by [0025 — Use User Height Environment Variable](./0025-use-user-height-environment-variable.md)

## Context

V1 BMI calculations require the user's height. BodyLog V1 is a single-user personal app, and height is not a secret.

## Decision

Use a versioned API constant for the initial V1 user height used by derived calculations.

The value can be replaced by runtime height configuration later if configuration outside code becomes useful.

## Consequences

BMI calculation can be implemented as pure domain logic without adding Worker environment plumbing to the domain phase.

Changing height requires a code change until runtime configuration is introduced.

## Superseded Reason

The project now uses runtime Worker configuration for height because the value should be adjustable without a code change. The replacement configuration is `USER_HEIGHT_CM`, expressed in centimeters.
