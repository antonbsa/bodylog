# 0024 — Use Versioned Height Constant

## Status

Accepted

## Context

V1 BMI calculations require the user's height. BodyLog V1 is a single-user personal app, and height is not a secret.

## Decision

Use a versioned API constant for the initial V1 user height used by derived calculations.

The value can be replaced by a runtime `USER_HEIGHT_M` configuration later if configuration outside code becomes useful.

## Consequences

BMI calculation can be implemented as pure domain logic without adding Worker environment plumbing to the domain phase.

Changing height requires a code change until runtime configuration is introduced.
