# Future Ideas

Useful ideas outside the current scope. They are context, not planned work, until an issue selects one.

## Optional Measurement Time

Add an optional time field to measurements.

The field should not be required. It may help identify outliers later.

## Better CSV Mapping

Support alternative CSV headers from the existing spreadsheet export.

## Google Sheets Automatic Backup

Automatically back up records to Google Sheets.

CSV export covers backups today.

## Offline-first Logging

Allow measurements to be recorded without an active connection and synced later.

This is valuable because the daily logging flow should be fast and resilient, but it adds complexity.

## Desktop-friendly Dashboard

Improve desktop layout for deeper analysis.

Today the desktop experience only needs to stay consistent with mobile.

## Charts

Charts outside the Tendências screen and advanced chart features; today Tendências shows one line chart at a time (`0030-allow-charts-in-trends.md`).

## Moving Averages

Add moving average views such as:

- 7-day moving average;
- 14-day moving average;
- 30-day moving average.

## Monthly Comparison

Add month-over-month summaries and averages.

## Measurement Status Tags

Add tags such as:

- normal;
- out of usual time;
- after meal;
- after workout;
- poor sleep;
- atypical hydration.

## Goal Phases

Allow the user to mark periods as:

- bulking;
- cutting;
- maintenance;
- deload;
- injury recovery.

This would help interpret variations later.

## Configurable Metric Goals

Allow the user to configure whether weight increase, decrease, or maintenance should be visually treated as the desired direction.

Today every variation uses one neutral tone, since no goals are configured (`0031-use-neutral-variation-color.md`).

## Internationalization

Add i18n; interface labels and copy are `pt-BR` only today.

## Automatic Interpretation

Add optional interpretation of trends only after enough context exists.

Today the app shows only neutral direction cues and no interpretation.

## Serverless Postgres Migration

Migrate from Cloudflare D1 to serverless Postgres.

Persistence stays behind a repository layer to keep this migration cheap.

## More Robust Authentication

Replace simple password authentication with a more robust model if the app becomes public-facing or multi-user.

## Notifications

Add reminders for daily measurement logging.

## Data Quality Indicators

Show warnings when weekly averages are based on too few measurements.

Example:

```txt
This week has only 2 measurements, so the average may be less representative.
```
