# BodyLog

Logs each account's daily bioimpedance scale readings and shows how each week compares with the one before.

## Accounts

**User**: One account, with its own Measurements that no other account sees. Created on the first sign-in; its display name and email come from the provider.

_Avoid_: owner, member, profile (for the account itself)

**Identity**: A provider account (GitHub, later Google) that signs in as a User, unique by provider and the provider's user id. A User can have more than one.

_Avoid_: login, provider account (in code)

**Session**: A signed-in browser, stored server-side and identified by the `bodylog_session` cookie. It lasts 30 days, renews while in use and ends at most 180 days after sign-in, or at logout.

_Avoid_: token (that's the cookie's value, not the session)

**Personal API token**: A named secret a User creates in Ajustes for an external client or agent, which reads that User's measurements from the collector endpoint and nothing else; shown once at creation and stored only as a hash. A User holds at most three; revoking one deletes it. It never manages tokens, so creating and revoking always need a Session.

_Avoid_: API key, access token, session token

## Measurements

**Measurement**: The readings recorded for one date: weight (required), and optionally body fat %, muscle %, resting metabolism, waist, sleep hours, disposition (1–5) and notes. Each User has at most one per date; selecting a date with a Measurement edits it.

_Avoid_: entry, record (in UI copy), weigh-in

**Derived values**: Values calculated from a Measurement and never stored: BMI (from weight and the user's height; none while it is unset), body fat kg and muscle kg (from weight and the matching percentage, when present).

_Avoid_: computed fields, metrics (when meaning only these)

## Weeks

**Week**: Monday to Sunday in the user's time zone, which follows their device (`America/Sao_Paulo` until it first reports one). Its averages use only the days that have a Measurement, and each metric ignores days where it is missing.

_Avoid_: last 7 days, rolling week

**Current week**: The Week containing today. It is usually partial, and its averages cover only the days recorded so far.

_Avoid_: this week's total

**Comparison week**: The full Week right before the Current week, the one the Current week is compared against.

_Avoid_: last week (ambiguous with the last seven days), baseline

## Changes

**Variation**: The difference between the Current week's average and the Comparison week's average for one metric, shown with a direction (up, down or stable) in one neutral tone, never as good or bad. It is stable when the difference rounds to zero at the displayed precision.

_Avoid_: progress, improvement, delta (in UI copy)

**Percentage points**: The unit of a Variation in a percentage metric (body fat %, muscle %): the plain difference between two percentages, shown as "p.p.", not a percentage of a percentage.

_Avoid_: percent change (for these metrics)
