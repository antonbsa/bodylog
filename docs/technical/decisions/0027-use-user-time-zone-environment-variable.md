# 0027 — Use User Time Zone Environment Variable

## Status

Accepted

## Context

BodyLog is a single-user app and dashboard week boundaries must match the
user's local day, not UTC. Using `Date.prototype.toISOString()` derives dates
in UTC, which can move the dashboard into the next week before the user's local
midnight.

## Decision

Configure the user's IANA time zone through the Worker environment variable
`USER_TIME_ZONE`.

Initial value:

```txt
USER_TIME_ZONE=America/Sao_Paulo
```

The weekly dashboard derives today's `YYYY-MM-DD` date using this configured
time zone before calculating Monday-to-Sunday week ranges.

## Consequences

- The dashboard uses local user week boundaries in local and production
  environments.
- `USER_TIME_ZONE` must be present in Worker configuration.
- The value is not a secret and should be configured as a Worker variable.
