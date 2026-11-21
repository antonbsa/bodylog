# Data Model

## Accounts

A **user** is one account. It signs in through one or more **identities**, one per provider, and holds **sessions** and measurements; deleting a user deletes all three (`ON DELETE CASCADE`). The rules are in `0044-multi-user-accounts-with-oauth-sign-in.md`.

| Table             | Columns                                                                     | Notes                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`           | `id`, `display_name`, `email` (nullable), `created_at`, `updated_at`        | Display name and email are refreshed from the provider on every sign-in; the email is set only when the provider verified it.                 |
| `user_identities` | `provider`, `provider_user_id`, `user_id`, `email` (nullable), `created_at` | Primary key `(provider, provider_user_id)`, so a provider account maps to one user. `provider` is `github`, or `dev` for the local seed user. |
| `sessions`        | `id_hash`, `user_id`, `expires_at`, `max_expires_at`, `created_at`          | `id_hash` is the SHA-256 (hex) of the cookie's random id. `expires_at` moves forward on renewal, never past `max_expires_at`.                 |

Timestamps are ISO 8601 UTC strings, so comparing them as text compares them in time.

## Entity: Measurement

A measurement represents the body metrics one user recorded for one date.

There is at most one measurement per date per user (`UNIQUE (user_id, date)`).

## Fields

| Field                   | Type        | Required | Description                                               |
| ----------------------- | ----------- | -------: | --------------------------------------------------------- |
| `id`                    | string      |      yes | Unique measurement identifier.                            |
| `userId`                | string      |      yes | Owning user; stored as `user_id`, not sent over the API.  |
| `date`                  | string      |      yes | Measurement date in `YYYY-MM-DD` format, unique per user. |
| `weightKg`              | number      |      yes | Body weight in kilograms.                                 |
| `bodyFatPercentage`     | number/null |       no | Body fat percentage from the scale.                       |
| `musclePercentage`      | number/null |       no | Muscle percentage from the scale.                         |
| `restingMetabolismKcal` | number/null |       no | Resting metabolism from the scale.                        |
| `waistCm`               | number/null |       no | Waist in centimeters, one decimal (30–250).               |
| `sleepHours`            | number/null |       no | Hours slept the previous night, one decimal (0–24).       |
| `disposition`           | number/null |       no | Integer from 1 (indisposto) to 5 (disposto).              |
| `notes`                 | string/null |       no | Free text, trimmed; blank notes are stored as `null`.     |
| `createdAt`             | string      |      yes | Creation timestamp.                                       |
| `updatedAt`             | string      |      yes | Last update timestamp.                                    |

Hard validation limits that block saving: weight 20–300 kg, body fat and muscle 1–80%, resting metabolism 500–5000 kcal, waist 30–250 cm, sleep 0–24 h, disposition integer 1–5 (`0032-add-waist-sleep-disposition-and-notes-fields.md`). The limits live in `domain/measurement.ts`.

## Derived Values

Derived values should be calculated by the application and are not stored.

### BMI

```txt
BMI = weightKg / (heightM * heightM)
```

`heightM` is derived from the API `USER_HEIGHT_CM` environment variable by converting centimeters to meters. Height should be configured outside the measurement record.

### Body Fat Mass

```txt
bodyFatKg = weightKg * bodyFatPercentage / 100
```

Only available when `bodyFatPercentage` is present.

### Muscle Mass

```txt
muscleKg = weightKg * musclePercentage / 100
```

Only available when `musclePercentage` is present.

## Weekly Grouping

Weeks start on Monday and end on Sunday.

Each measurement belongs to exactly one week based on its `date`.

## Weekly Average Rules

- Only existing measurements are included.
- Missing days are ignored.
- Missing optional values are ignored for that specific metric.
- A metric average should be `null` when no values are available for that metric.
- Waist, sleep and disposition are averaged like the other optional metrics.
- Each week also lists the `recordedDates` (ascending) that have a measurement; `measurementCount` is their count. The weekly registration target is 7 (`0035-use-seven-day-weekly-target.md`).

Example:

```txt
If a week has 4 weight values and 2 body fat values:
- weight average uses 4 values;
- body fat average uses 2 values.
```

## Weekly Comparison Rules

The comparison is:

```txt
partial current week vs previous full week
```

The API returns weekly averages only; the UI computes the variation between the two weeks (`0039-compute-weekly-variation-in-the-ui.md`). Missing metrics in either week produce no comparison, never a zero.

For percentage-based metrics such as body fat percentage and muscle percentage, absolute variation must be displayed as percentage points.

Example:

```txt
16.20% → 14.46% = -1.74 percentage points
```

## Future Postgres Portability

The app uses Cloudflare D1. Because a later migration to serverless Postgres is planned, the application should avoid direct database access scattered across HTTP handlers.

Recommendation:

- handlers call services/use cases;
- services call repositories;
- repositories contain SQL and D1 details;
- domain types should not depend on D1-specific types.

## Suggested Initial SQL

```sql
CREATE TABLE measurements (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  weight_kg REAL NOT NULL,
  body_fat_percentage REAL,
  muscle_percentage REAL,
  resting_metabolism_kcal INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_measurements_date ON measurements(date);
```

Migration `0002_add_waist_sleep_disposition_notes.sql` adds the four nullable columns; existing rows keep them empty:

```sql
ALTER TABLE measurements ADD COLUMN waist_cm REAL;
ALTER TABLE measurements ADD COLUMN sleep_hours REAL;
ALTER TABLE measurements ADD COLUMN disposition INTEGER;
ALTER TABLE measurements ADD COLUMN notes TEXT;
```

Migration `0003_add_users_identities_and_sessions.sql` creates `users`, `user_identities` and `sessions`, then drops and recreates `measurements` with `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE` and `UNIQUE (user_id, date)` in place of the unique `date`, plus indexes on `sessions(expires_at)`, `sessions(user_id)` and `user_identities(user_id)`. Rows that existed before it are deleted, since they have no owner.

## CSV Format

Canonical CSV headers:

```txt
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,waist_cm,sleep_hours,disposition,notes,created_at,updated_at
```

CSV export uses this full canonical format and omits the internal `id` field. CSV import identifies columns by header name (the canonical names and the spreadsheet aliases), requires only `date` and `weight_kg`, and upserts the signed-in user's records by `date`; the format and the overwrite rules are in the [API contract](api-contract.md#csv-import).

Imported values are validated against the same limits as the form; dates must be real calendar dates, such as `2026-02-28` or `28/02/2026`, never `2026-02-30`.
