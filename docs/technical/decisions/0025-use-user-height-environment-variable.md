# 0025 — Use User Height Environment Variable

## Status

Accepted

## Context

V1 BMI calculations require the single user's height. The previous decision used a versioned API constant, but changing the user's height should not require a code change.

Height is not a secret, and the deploy target is Cloudflare Workers.

## Decision

Configure user height through the Worker environment variable `USER_HEIGHT_CM`.

The value must be expressed in centimeters, for example:

```txt
USER_HEIGHT_CM=168
```

Domain calculation code receives height in centimeters and converts it to meters before applying the BMI formula:

```txt
heightM = USER_HEIGHT_CM / 100
BMI = weightKg / (heightM * heightM)
```

## Consequences

Changing height no longer requires a code change.

The Worker configuration must include `USER_HEIGHT_CM` in local and production environments.

Domain logic remains pure because Worker environment parsing is kept outside the calculation functions.
