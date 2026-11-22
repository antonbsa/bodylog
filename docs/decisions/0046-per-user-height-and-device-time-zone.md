---
status: Accepted
area: platform
supersedes: ["0025", "0027"]
---

# 0046 — Per-user Height and Device Time Zone

## Status

Accepted

## Context

BMI used the Worker variable `USER_HEIGHT_CM` (ADR 0025), and "today" and the current week used `USER_TIME_ZONE` (ADR 0027). Both assumed one user. With several accounts (ADR 0044), each person needs their own height, and the week boundaries must follow where that person is, without asking them to configure a zone.

## Decision

- **Height on the user.** `users.height_cm` (REAL, nullable) is edited in Ajustes as a whole number within 50–250 cm, a limit kept in root `domain/` beside the measurement limits. While it is null, BMI is `null` everywhere (Início, Histórico, Tendências, Registro) and shows "—", and Ajustes says the height is missing.
- **Time zone from the device.** `users.time_zone` (TEXT, nullable) stores an IANA zone. On app start, before any screen loads, the web app sends `Intl.DateTimeFormat().resolvedOptions().timeZone` when it differs from the stored one. The API accepts only names Intl resolves and refuses UTC offsets such as `+03:00`. It stores the name as sent, since the browser's and the Worker's ICU may canonicalize a zone differently, and a rewritten name would never match the device again. A failed sync keeps the stored zone. Ajustes doesn't show the zone, since the user never sets it.
- **Fallback zone.** A user with no stored zone gets `America/Sao_Paulo` for "today" and the current week.
- **API.** `GET /api/auth/session` returns `heightCm` and `timeZone` with the user, so the app learns both from the request it already makes at start. `PATCH /api/me` updates either field and answers with the same `{ user }`.
- `USER_HEIGHT_CM` and `USER_TIME_ZONE` are removed from the Worker.

## Consequences

- Each account's BMI and week boundaries are its own, and a traveler's week follows the device from the next app start.
- A new account has no BMI until its owner sets a height.
- Every route that needs the height or the zone reads the user row once per request.
- Alternatives not taken: a separate `GET /api/me` (one more request at every start), a zone picker in Ajustes (out of scope; the device knows the zone), and a required height at sign-up (no onboarding screen).
