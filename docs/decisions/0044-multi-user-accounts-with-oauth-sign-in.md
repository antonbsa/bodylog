---
status: Accepted
area: platform
amends: ["0007", "0041"]
---

# 0044 — Multi-user Accounts with OAuth Sign-in

## Status

Accepted

## Context

BodyLog was a single-user app: one shared password from the `APP_PASSWORD` secret, a stateless HMAC-signed cookie that identified nobody, and every measurement owned by the same implicit user. Opening it to other people needs an owner on every row and a session that knows who is calling, and neither is useful without the other. Current production data is discarded and re-imported after the release, so there is no backfill and no "owner" account.

## Decision

- **OAuth only.** People sign in with GitHub (and Google later, reusing the same identity model). There is no password login, and the first sign-in with an unknown identity creates an account (open sign-up). A user has one or more identities, unique by `(provider, provider_user_id)`.
- **GitHub flow.** Authorization code with PKCE `S256` through `oauth4webapi`, scopes `read:user user:email`. `state` and `code_verifier` live in a 10-minute `HttpOnly; SameSite=Lax` cookie on `Path=/api/auth/github`, cleared by the callback, which binds the login to the browser that started it. The `redirect_uri` is `<request origin>/api/auth/github/callback`. The app fetches `/user` and `/user/emails` itself: the email is the primary one only when verified (otherwise `null`, and sign-in still succeeds), and the display name is `name ?? login`; both are refreshed on every sign-in. The authorization server is configured with GitHub's RFC 9207 issuer `https://github.com/login/oauth`, so the `iss` GitHub adds to the callback validates.
- **Callback outcome.** A successful callback sets the session cookie on a 200 page that redirects client-side to Início, because WebKit drops a `Set-Cookie` on a redirect that ends a cross-site chain (github.com → app). Failures set no session and 302 to `/?error=declined` (cancelled on GitHub), `/?error=state` (missing, mismatched or expired state) or `/?error=failed` (code exchange or profile lookup failed). GitHub answers a bad `code` with HTTP 200 and an `error` body; `oauth4webapi` rejects it because `access_token` is missing, so it lands on `failed`.
- **Server-side sessions in D1.** The cookie `bodylog_session` holds a random 32-byte id (`HttpOnly; Secure; SameSite=Lax`); `sessions` stores only its SHA-256. A session lasts 30 days, is renewed when less than 7 days remain (`expires_at = min(now + 30d, max_expires_at)`, cookie re-sent) and is capped at 180 days from sign-in. An expired row found on lookup is deleted and answers 401, and each new sign-in deletes every expired row, so no cron is needed. Logout deletes the row. Old signed cookies simply miss and answer 401.
- **Data scoped by user.** `measurements.user_id` is required and uniqueness moves from `date` to `(user_id, date)`: one measurement per date becomes one per date per user (amending ADR 0007). Every repository query is bound to the session's user, and SQL stays behind repositories (ADR 0017). Migration `0003` recreates `measurements` and drops existing rows.
- **Secrets.** `APP_PASSWORD` and `SESSION_SECRET` are removed; the Worker requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`, checked by the deploy secret check (amending ADR 0041), with one GitHub OAuth App per deployed environment because each accepts a single callback URL.
- **Local sign-in.** `POST /api/auth/dev-login` signs in as a fixed seed user (identity `dev`/`dev`, "Dev") and exists only when `DEV_LOGIN_ENABLED="true"`, which only `.env.development` sets; everywhere else it is a 404.

## Consequences

- Each deployed environment needs its own GitHub OAuth App and secrets before the deploy that ships this; the local real flow is optional and needs real credentials in `.env.local`.
- Height and time zone stay global Worker vars until they move to the user, so every account shares them meanwhile.
- A session lookup is one D1 read per request, and renewal is one write per session per week.
- Alternatives not taken: `@hono/oauth-providers` (restarts the flow on `?error=access_denied`, throws a bare 401 on a bad state, takes the primary email without checking `verified`), Arctic (deprecated), signed stateless cookies (logout can't invalidate a copied cookie), email sign-in and account deletion (recorded in future ideas).
