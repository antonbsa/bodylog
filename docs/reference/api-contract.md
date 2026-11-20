# API Contract

## Base Rules

All data routes require authentication. The API is served under `/api/*` on the same origin as the web app, so it sends no CORS headers; unknown `/api/*` routes return a JSON `NotFoundError` with status 404.

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

### POST /api/auth/login

Authenticates the single user.

#### Request

```json
{
  "password": "string"
}
```

#### Response 200

```json
{
  "ok": true
}
```

#### Response 401

```json
{
  "ok": false,
  "error": "INVALID_PASSWORD"
}
```

---

### POST /api/auth/logout

Ends the session.

#### Response 200

```json
{
  "ok": true
}
```

---

### GET /api/auth/session

Checks the current session.

#### Response 200

```json
{
  "authenticated": true
}
```

#### Response 401

```json
{
  "authenticated": false
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

`heightCm` is the configured user height, so the registration screen can recompute the BMI live while editing.

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

`current` always represents the actual current week in the configured user time zone, even when it has no records yet; the web UI reads `current` and `previous` only.

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

Every metric can be `null`; `bmi` is derived from the configured user height. No records return `{ "points": [] }`.

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
- Values follow the limits in [database](database.md#csv-format) and `domain/measurement.ts`; `notes` are trimmed and blank notes are stored as `null`.

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
