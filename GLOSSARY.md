# BodyLog

Logs each account's daily bioimpedance scale readings and shows how each week compares with the one before.

## Accounts

**User**: One account, with its own Measurements that no other account sees. Created on the first sign-in; its display name and email come from the provider.

_Avoid_: owner, member, profile (for the account itself)

**Identity**: A provider account (GitHub, later Google) that signs in as a User, unique by provider and the provider's user id. A User can have more than one.

_Avoid_: login, provider account (in code)

**Session**: A signed-in browser, stored server-side and identified by the `bodylog_session` cookie. It lasts 30 days, renews while in use and ends at most 180 days after sign-in, or at logout.

_Avoid_: token (that's the cookie's value, not the session)

## Measurements

**Measurement**: The readings recorded for one date: weight (required), and optionally body fat %, muscle %, resting metabolism, waist, sleep hours, disposition (1–5) and notes. Each User has at most one per date; selecting a date with a Measurement edits it.

_Avoid_: entry, record (in UI copy), weigh-in

**Derived values**: Values calculated from a Measurement and never stored: BMI (from weight and the configured height), body fat kg and muscle kg (from weight and the matching percentage, when present).

_Avoid_: computed fields, metrics (when meaning only these)

## Weeks

**Week**: Monday to Sunday in the user's configured time zone. Its averages use only the days that have a Measurement, and each metric ignores days where it is missing.

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
