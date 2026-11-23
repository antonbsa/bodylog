# API Contract

## Base Rules

All data routes require a session (see [Auth](#auth)), except `/api/collector/*`, which requires a personal API token instead (see [Collector](#collector)). The API is served under `/api/*` on the same origin as the web app, so it sends no CORS headers; unknown `/api/*` routes return a JSON `NotFoundError` with status 404.

## Status

### GET /api/health

Returns the public API liveness response. This endpoint confirms the Worker can
respond; it does not check database connectivity.

#### Response 200

```json
{
  "ok": true
}
```

---

## Auth

Every route outside `/api/auth/*` and `/api/health` needs the `bodylog_session` cookie and answers a missing, unknown or expired session with:

```json
{
  "action": "Entre novamente para continuar.",
  "message": "Sessão inválida ou expirada.",
  "name": "UnauthorizedError",
  "statusCode": 401
}
```

All data is scoped to the session's user: each route reads and writes only that user's measurements. A session lasts 30 days, is renewed (and its cookie re-sent) on a request in its last 7 days, and ends at most 180 days after sign-in.

### GET /api/auth/github

Starts the GitHub sign-in. Sets a 10-minute `bodylog_github_oauth` cookie on `Path=/api/auth/github` holding the `state` and PKCE `code_verifier`, then answers 302 to `https://github.com/login/oauth/authorize` with `client_id`, `redirect_uri` (`<origin>/api/auth/github/callback`), `scope=read:user user:email`, `state` and an `S256` `code_challenge`.

### GET /api/auth/github/callback

GitHub's redirect target. Clears the flow cookie in every case.

- **Success:** creates the GitHub identity on the first sign-in, joined to an existing user by verified email ([Account linking](#account-linking)) or with a new user, or refreshes the display name (`name`, else `login`) and the email (the primary one when verified; an unverified one keeps the user's current email) on later ones. Sets the session cookie and answers 200 with an HTML page that redirects to `/`.
- **Failure:** sets no session and answers 302 to the login screen with an error code:

| Redirect           | When                                                          |
| ------------------ | ------------------------------------------------------------- |
| `/?error=declined` | The user cancelled on the provider (`error=access_denied`).   |
| `/?error=state`    | The flow cookie is missing or expired, or `state` mismatches. |
| `/?error=failed`   | The code exchange or the profile lookup failed.               |

### GET /api/auth/google

Starts the Google sign-in like `GET /api/auth/github`: a 10-minute `bodylog_google_oauth` cookie on `Path=/api/auth/google`, then a 302 to `https://accounts.google.com/o/oauth2/v2/auth` with `client_id`, `redirect_uri` (`<origin>/api/auth/google/callback`), `response_type=code`, `scope=openid email profile`, `state` and an `S256` `code_challenge`.

### GET /api/auth/google/callback

Google's redirect target, with the same success page and failure redirects as the GitHub callback. The profile comes from the ID token: `sub` identifies the identity, the display name is `name` (else the email, else "Google"), and the email is kept only when `email_verified` is true. An ID token issued for another client, or a token response without one, lands on `/?error=failed`.

### Account linking

The first sign-in with an identity whose verified email matches an existing identity's email (case-insensitively) adds it to that identity's user, so GitHub and Google open the same account; a user already holding an identity from the same provider is skipped. An identity without a verified email always creates a new user. A returning identity keeps its user.

### POST /api/auth/dev-login

Signs in as the local seed user (identity `dev`/`dev`, display name "Dev"), creating it on first use, and answers like `GET /api/auth/session`. Exists only when the Worker has `DEV_LOGIN_ENABLED="true"`; everywhere else it answers the same 404 as an unknown route.

---

### POST /api/test/session

Test-only: exists only in the `e2e` Worker (`wrangler dev --env e2e`, used by `npm run test:e2e:api`), and every deployed environment answers the same 404 as an unknown route. Creates a new user (display name "E2E") owning the given measurements, starts its session, and answers like `GET /api/auth/session`. The body is a JSON object whose `measurements` is optional; each item takes a `date` (`YYYY-MM-DD`) plus the `PUT /api/measurements/by-date/:date` body, on distinct dates. A body that isn't a JSON object, or any invalid item, answers 400 with the same errors as that `PUT` and creates nothing (a later database failure can leave a partial seed, which only a fresh run's wiped D1 clears).

```json
{
  "measurements": [{ "date": "2026-06-09", "weightKg": 72.6 }]
}
```

---

### POST /api/auth/logout

Deletes the session row, so replaying the old cookie answers 401, and clears the cookie. Answers 200 with or without a session.

#### Response 200

```json
{
  "ok": true
}
```

---

### GET /api/auth/session

Returns the signed-in user with the profile the app needs at start.

#### Response 200

```json
{
  "user": {
    "id": "string",
    "displayName": "string",
    "email": "string | null",
    "heightCm": "number | null",
    "timeZone": "string | null"
  }
}
```

`heightCm` is null until the user sets it in Ajustes, and BMI is null meanwhile. `timeZone` is the IANA zone the device last reported, null until the first sync; the API reads a null zone as `America/Sao_Paulo` ([ADR 0046](../decisions/0046-per-user-height-and-device-time-zone.md)).

#### Response 401

The `UnauthorizedError` above.

## Profile

### PATCH /api/me

Updates the signed-in user's height, time zone, or both. The web app sends `timeZone` on start when the device's zone differs from the stored one.

#### Request

```json
{
  "heightCm": 172,
  "timeZone": "America/Sao_Paulo"
}
```

#### Rules

- At least one of the two fields; an absent field keeps its stored value.
- `heightCm` is a whole number from 50 to 250, or `null` to clear it.
- `timeZone` is an IANA zone name that Intl resolves, stored as sent so the app's next comparison with the device's spelling matches. UTC offsets such as `+03:00` are refused.
- An invalid body changes nothing.

#### Response 200

The `GET /api/auth/session` body with the updated user.

#### Response 400

```json
{
  "action": "Revise a altura e tente novamente.",
  "message": "Dados do perfil inválidos.",
  "name": "ValidationError",
  "statusCode": 400
}
```

## Measurements

### GET /api/measurements

Lists measurements.

#### Optional query params

```txt
from=YYYY-MM-DD
to=YYYY-MM-DD
limit=number
offset=number
```

#### Response 200

```json
{
  "items": [
    {
      "id": "string",
      "date": "YYYY-MM-DD",
      "weightKg": 72.9,
      "bodyFatPercentage": 14.46,
      "musclePercentage": 43.72,
      "restingMetabolismKcal": 1700,
      "waistCm": 80.5,
      "sleepHours": 7.5,
      "disposition": 4,
      "notes": "string or null",
      "derived": {
        "bmi": 25.83,
        "bodyFatKg": 10.54,
        "muscleKg": 31.87
      },
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

`derived.bmi` uses the user's height and is `null` while it is unset; the same holds for every `bmi` below.

---

### GET /api/measurements/by-date/:date

Finds a measurement by date.

#### Response 200

```json
{
  "item": {
    "id": "string",
    "date": "YYYY-MM-DD",
    "weightKg": 72.9,
    "bodyFatPercentage": null,
    "musclePercentage": null,
    "restingMetabolismKcal": null,
    "waistCm": null,
    "sleepHours": null,
    "disposition": null,
    "notes": null,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "heightCm": 168
}
```

`heightCm` is the user's height, or `null` while unset, so the registration screen can recompute the BMI live while editing.

#### Response 404

```json
{
  "item": null
}
```

---

### PUT /api/measurements/by-date/:date

Creates or updates the measurement for a date.

#### Request

```json
{
  "weightKg": 72.9,
  "bodyFatPercentage": 14.46,
  "musclePercentage": 43.72,
  "restingMetabolismKcal": 1700,
  "waistCm": 80.5,
  "sleepHours": 7.5,
  "disposition": 4,
  "notes": "Slept well"
}
```

#### Rules

- `weightKg` is required.
- Other fields accept `number` or `null` (`notes` accepts a string or `null`); an omitted field is stored as `null`.
- Values outside the limits are rejected with the `INVALID_MEASUREMENT_INPUT` validation error (400): weight 20–300 kg, `bodyFatPercentage` and `musclePercentage` 1–80, `restingMetabolismKcal` 500–5000, `waistCm` 30–250, `sleepHours` 0–24, `disposition` an integer 1–5.
- `notes` is trimmed; a blank string after trimming is stored as `null`.
- If the date already exists, update it.
- If the date does not exist, create it.

#### Response 200

```json
{
  "item": {
    "id": "string",
    "date": "YYYY-MM-DD",
    "weightKg": 72.9,
    "bodyFatPercentage": 14.46,
    "musclePercentage": 43.72,
    "restingMetabolismKcal": 1700,
    "waistCm": 80.5,
    "sleepHours": 7.5,
    "disposition": 4,
    "notes": "Slept well",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

---

### DELETE /api/measurements/:id

Deletes a measurement.

#### Response 200

```json
{
  "ok": true
}
```

## Dashboard

### GET /api/dashboard/weekly

Returns the weekly summaries of the current week and the previous week.

The response must include week date ranges and measurement counts so the UI can show the weekly registration count against the 7-day target.

Each week also returns its `recordedDates` (ascending `YYYY-MM-DD`) so the UI can draw the day dots; `measurementCount` is the recorded count. The weekly registration target is 7 (`0035-use-seven-day-weekly-target.md`) and the response carries no reliability label. Weekly averages include `waistCm`, `sleepHours` and `disposition`. The API returns raw averages and counts only; the UI computes variation (`0039-compute-weekly-variation-in-the-ui.md`).

#### Response 200

```json
{
  "current": {
    "weekStartDate": "YYYY-MM-DD",
    "weekEndDate": "YYYY-MM-DD",
    "measurementCount": 4,
    "recordedDates": ["YYYY-MM-DD"],
    "isCurrentWeek": true,
    "isPartialWeek": true,
    "averages": {
      "weightKg": 72.9,
      "bmi": 25.83,
      "bodyFatPercentage": 14.46,
      "bodyFatKg": 10.54,
      "musclePercentage": 43.72,
      "muscleKg": 31.87,
      "restingMetabolismKcal": 1700,
      "waistCm": 80.5,
      "sleepHours": 7.5,
      "disposition": 4
    }
  },
  "previous": {
    "weekStartDate": "YYYY-MM-DD",
    "weekEndDate": "YYYY-MM-DD",
    "measurementCount": 7,
    "recordedDates": ["YYYY-MM-DD"],
    "averages": {
      "weightKg": 71.75,
      "bmi": 25.42,
      "bodyFatPercentage": 16.2,
      "bodyFatKg": 11.62,
      "musclePercentage": 42.75,
      "muscleKg": 30.67,
      "restingMetabolismKcal": 1680,
      "waistCm": 82,
      "sleepHours": 7,
      "disposition": 3
    }
  }
}
```

`current` always represents the actual current week in the user's time zone (`America/Sao_Paulo` while none is stored), even when it has no records yet; the web UI reads `current` and `previous` only.

## History

### GET /api/history/weeks

Returns the weeks that have at least one record, newest first, for the Histórico screen. A page holds 8 weeks and a week is never split across pages, so each week summary matches the one Início shows.

#### Optional query params

```txt
before=YYYY-MM-DD
```

`before` excludes measurements on or after that date. To get the next older page, pass the `nextBefore` of the previous response. An invalid date returns the `INVALID_DATE` validation error (400).

#### Response 200

```json
{
  "weeks": [
    {
      "summary": {
        "weekStartDate": "YYYY-MM-DD",
        "weekEndDate": "YYYY-MM-DD",
        "measurementCount": 4,
        "recordedDates": ["YYYY-MM-DD"],
        "isCurrentWeek": true,
        "isPartialWeek": true,
        "averages": {
          "weightKg": 72.9,
          "bodyFatPercentage": 14.46,
          "musclePercentage": 43.72
        }
      },
      "measurements": [
        {
          "id": "string",
          "date": "YYYY-MM-DD",
          "weightKg": 72.9,
          "notes": "string or null",
          "derived": { "bmi": 25.83, "bodyFatKg": 10.54, "muscleKg": 31.87 }
        }
      ]
    }
  ],
  "nextBefore": "YYYY-MM-DD or null"
}
```

`summary` has the same shape as a weekly dashboard week (the example shows a few averages only) and `measurements` are the items of `GET /api/measurements`, newest first. `nextBefore` is the `weekStartDate` of the last returned week when older records exist, otherwise `null`. An empty history returns `{ "weeks": [], "nextBefore": null }`.

## Trends

### GET /api/trends

Returns every measurement as one point, oldest first, for the Tendências screen. It is not paged because the screen switches metric and period on the client, and `GET /api/measurements` caps `limit` at 100, which would break the "Tudo" period.

#### Response 200

```json
{
  "points": [
    {
      "date": "YYYY-MM-DD",
      "weightKg": 72.9,
      "bodyFatPercentage": 14.5,
      "musclePercentage": 43.7,
      "waistCm": null,
      "sleepHours": 7.5,
      "disposition": 4,
      "restingMetabolismKcal": 1650,
      "bmi": 25.83
    }
  ]
}
```

Every metric can be `null`; `bmi` is derived from the user's height and is `null` while it is unset. No records return `{ "points": [] }`.

## CSV Export

### GET /api/export/csv

Downloads all measurements as CSV.

#### Response 200

```csv
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,waist_cm,sleep_hours,disposition,notes,created_at,updated_at
2026-06-10,72.9,14.46,43.72,1700,80.5,7.5,4,Slept well,2026-06-09T12:00:00.000Z,2026-06-09T12:00:00.000Z
```

#### Rules

- Includes all measurements ordered by date descending.
- Includes raw measurement fields and audit timestamps.
- Does not include internal database identifiers.
- Empty optional values are exported as empty cells.

## CSV Import

Import is two steps over the same file: a preview that writes nothing, then the import. Both take a multipart upload with the CSV in a `file` field and re-validate the whole file; the second call never trusts the first.

### Supported Format

- Columns are identified by header name. Headers are normalized (lowercase, accents stripped, `_`, `-` and space equal, whitespace collapsed) and must then equal one alias exactly; there is no substring or fuzzy matching. Two headers that map to the same field reject the file.
- Only `date` and `weight_kg` are required. A column that is absent keeps the stored value of existing records; a present column with an empty cell clears the value.
- Unknown columns (for example `IMC`) are ignored and listed in the preview; cells past the last header are ignored without being listed.
- The delimiter is `,` or `;`, detected from the header line. The encoding is UTF-8 (BOM stripped), falling back to Windows-1252.
- Dates are `YYYY-MM-DD` or `D/M/YYYY` (1-2 digit day and month, 4-digit year), may be mixed in one file and must be real calendar dates. `DD/MM` and 2-digit years are invalid.
- Numbers accept a dot or comma decimal (`72.5`, `72,5`). A dot is a thousands separator only in `resting_metabolism_kcal` (`1.696` is 1696). Values with units or symbols (`72,5 kg`, `14%`, `7h`) and ranges (`6-7`) are invalid.
- Values follow the limits in [measurements](measurements.md#csv-format) and `domain/measurement.ts`; `notes` are trimmed and blank notes are stored as `null`.

| Field                     | Accepted headers (normalized)                                            |
| ------------------------- | ------------------------------------------------------------------------ |
| `date`                    | `date`, `data`                                                           |
| `weight_kg`               | `weight_kg`, `peso_kg`, `peso`                                           |
| `body_fat_percentage`     | `body_fat_percentage`, `gordura_percentual`, `gordura`                   |
| `muscle_percentage`       | `muscle_percentage`, `musculo_percentual`, `musculo`                     |
| `resting_metabolism_kcal` | `resting_metabolism_kcal`, `metabolismo_basal_kcal`, `metabolismo basal` |
| `waist_cm`                | `waist_cm`, `cintura_cm`, `cintura`                                      |
| `sleep_hours`             | `sleep_hours`, `sono_horas`, `sono`                                      |
| `disposition`             | `disposition`, `disposicao`                                              |
| `notes`                   | `notes`, `notas`                                                         |
| `created_at`              | `created_at`                                                             |
| `updated_at`              | `updated_at`                                                             |

### Row Classification

- A fully blank row is ignored.
- A row with a date and no recognized value is counted as "no measurement" and skipped; it is not an error.
- A row with any recognized value (including notes only) is valid only with a valid weight and valid values everywhere else.
- A date that repeats in the file makes the later row invalid, naming the earlier row.
- Row errors are `{ row, column, value, message }`: `row` counts records in the file, 1-based with the header as row 1, `column` is the header as written in the file, `value` the offending cell and `message` Portuguese text.

### File-level Errors

Return 400 with a Portuguese `message` and `action` (the standard error envelope) and write nothing: empty or unreadable file, no `date` column, no weight column (the message names the missing column), two headers mapped to one field, and a missing `file` field.

### POST /api/import/csv/preview

Validates the file and reports what the import would do, without writing.

#### Response 200

```json
{
  "period": { "from": "2026-01-02", "to": "2026-06-10" },
  "counts": { "created": 10, "updated": 5, "noMeasurement": 2, "invalid": 1 },
  "updatedDates": ["2026-06-09"],
  "ignoredColumns": ["IMC"],
  "invalidRows": [
    {
      "row": 7,
      "column": "Sono",
      "value": "6-7",
      "message": "Valor inválido."
    }
  ]
}
```

- `period` spans the first and last valid date, and is `null` when no row is valid.
- `counts.invalid` counts rows, while `invalidRows` has one entry per invalid cell.
- `updatedDates` lists the valid dates that already have a record, ascending.

### POST /api/import/csv

Re-validates the file and writes every valid row in one D1 `batch()`, all or nothing. New dates are created; existing dates replace only the fields whose column is in the file. `created_at` is kept on update and `updated_at` is the import time, unless the file has those columns.

#### Request

The `file` field plus an optional `skipInvalid=true` form field.

#### Response 200

```json
{ "created": 10, "updated": 5, "skippedInvalid": 1 }
```

#### Response 400

Returned for a file-level error, or when the file has invalid rows and `skipInvalid` is not `true` (nothing is written).

## Personal API Tokens

Tokens an external client or agent uses instead of a browser session. These routes need the session cookie like every data route; a token in `Authorization: Bearer` doesn't authorize them, so a token never manages tokens. Each route sees only the caller's tokens, and another user's token id answers the same 404 as an unknown one.

A token is `bl_` followed by 32 random bytes in base64url (46 characters). The API stores only its SHA-256 and its last four characters, and returns the token itself only in the `POST` response.

### GET /api/tokens

Lists the caller's tokens, oldest first.

#### Response 200

```json
{
  "items": [
    {
      "id": "0b5c5d0e-2f4e-4a51-9a34-7d1b0c2f9e11",
      "name": "Agente",
      "lastFour": "x9Qk",
      "createdAt": "2026-11-21T12:00:00.000Z",
      "lastUsedAt": null
    }
  ]
}
```

### POST /api/tokens

Creates a token.

#### Request

```json
{ "name": "Agente" }
```

#### Rules

- `name` is required, trimmed, at most 50 characters, and unique among the caller's tokens.
- A user holds at most 3 tokens; creating another needs a revoke first.

#### Response 201

```json
{
  "item": {
    "id": "0b5c5d0e-2f4e-4a51-9a34-7d1b0c2f9e11",
    "name": "Agente",
    "lastFour": "x9Qk",
    "createdAt": "2026-11-21T12:00:00.000Z",
    "lastUsedAt": null
  },
  "token": "bl_3q2-7wJm0aK8Zr5yT1uVnB4cD6eF9gH0iJ2kL4mx9Qk"
}
```

#### Response 400

A `ValidationError` whose `message` is "Nome do token inválido." (missing, blank or too long), "Já existe um token com esse nome." or "Você já tem 3 tokens." (action "Revogue um token para criar outro.").

### DELETE /api/tokens/:id

Revokes a token by deleting it; the collector rejects it from the next request.

#### Response 200

```json
{
  "ok": true
}
```

#### Response 404

A `NotFoundError` with `message` "Token não encontrado.".

## Collector

### GET /api/collector/measurements

Returns the token owner's measurements as JSON for external clients and agents (ADR 0047).

#### Authentication

`Authorization: Bearer <personal API token>` (scheme case-insensitive), with a token created in Ajustes (see [Personal API Tokens](#personal-api-tokens)). Each authorized call updates the token's `lastUsedAt`. The session cookie does not authorize this route, and the token authorizes no other route. A missing, malformed, unknown or revoked token returns an `UnauthorizedError` with status 401 and `message` "Token de API inválido ou ausente.".

#### Optional query params

```txt
from=YYYY-MM-DD
to=YYYY-MM-DD
```

#### Response 200

```json
{
  "filters": { "from": "2026-06-01", "to": null },
  "count": 1,
  "heightCm": 180,
  "items": [
    {
      "date": "2026-06-10",
      "weightKg": 72.9,
      "bodyFatPercentage": 14.46,
      "musclePercentage": 43.72,
      "restingMetabolismKcal": 1700,
      "waistCm": 80.5,
      "sleepHours": 7.5,
      "disposition": 4,
      "notes": "string or null",
      "derived": {
        "bmi": 22.5,
        "bodyFatKg": 10.54,
        "muscleKg": 31.87
      },
      "createdAt": "2026-06-10T12:00:00.000Z",
      "updatedAt": "2026-06-10T12:00:00.000Z"
    }
  ]
}
```

#### Rules

- `from` and `to` are inclusive and filter by measurement date; either can be omitted, and `filters` echoes them with `null` for an omitted one.
- A malformed or impossible date (such as `2026-02-31`) returns a 400 `ValidationError`; `from` after `to` returns an empty list.
- Returns every matching measurement of the token owner, ordered by date ascending, with no pagination.
- Empty optional values are `null`; the internal `id` is not included, since `date` identifies a measurement.
- `heightCm` is the user's height, or `null` while it isn't set, and then `derived.bmi` is `null`.
