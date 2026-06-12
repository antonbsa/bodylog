# Future Ideas

This file stores useful ideas that are explicitly outside the current V1 scope unless selected later.

## V1.1 Candidates

### Daily Observations

Add optional notes to daily measurements.

Possible use cases:

- unusual hydration;
- bad sleep;
- post-workout measurement;
- post-meal measurement;
- injury context;
- unusual sodium/carbohydrate intake.

### Optional Measurement Time

Add an optional time field to measurements.

The field should not be required. It may help identify outliers later.

### Measurement Form Date Picker

Replace the V1 text date field with a dedicated date picker component that preserves the `DD/MM/YYYY` display format and keeps API/database values as ISO dates.

### Better CSV Mapping

Support alternative CSV headers from the existing spreadsheet export.

## V2 Candidates

### Measurement Form Loading Polish

Improve the measurement form loading state with a subtle rotating indicator for date lookups, no form-field layout shift, and no distracting flash when lookup responses resolve immediately.

### Google Sheets Automatic Backup

Automatically back up records to Google Sheets.

This should not block V1 because CSV export is enough for the first version.

### Offline-first Logging

Allow measurements to be recorded without an active connection and synced later.

This is valuable because the daily logging flow should be fast and resilient, but it adds complexity and is not required for V1.

### Desktop-friendly Dashboard

Improve desktop layout for deeper analysis.

The V1 desktop experience only needs to be usable. Future versions can include more complete dashboards.

### Charts

Add visual trend charts for:

- weight;
- body fat percentage;
- body fat mass;
- muscle percentage;
- muscle mass;
- resting metabolism.

### Moving Averages

Add moving average views such as:

- 7-day moving average;
- 14-day moving average;
- 30-day moving average.

### Monthly Comparison

Add month-over-month summaries and averages.

### Measurement Status Tags

Add tags such as:

- normal;
- out of usual time;
- after meal;
- after workout;
- poor sleep;
- atypical hydration.

### Goal Phases

Allow the user to mark periods as:

- bulking;
- cutting;
- maintenance;
- deload;
- injury recovery.

This would help interpret variations later.

### Configurable Metric Goals

Allow the user to configure whether weight increase, decrease, or maintenance should be visually treated as the desired direction.

V1 assumes weight increase is visually positive because explicit goals are not configured yet.

### Internationalization

Add i18n after V1.

V1 interface labels and copy are `pt-BR` only.

### Separate Authenticated Pages

Split the single V1 dashboard into separate authenticated views when history, import/export, settings, or deeper analysis need more space.

### Automatic Interpretation

Add optional interpretation of trends only after enough context exists.

This should not be added in V1 because basic direction and color cues are enough for the initial workflow.

### Serverless Postgres Migration

Migrate from Cloudflare D1 to serverless Postgres.

The V1 should keep persistence behind a repository/service layer to reduce future migration cost.

### More Robust Authentication

Replace simple password authentication with a more robust model if the app becomes public-facing or multi-user.

### Notifications

Add reminders for daily measurement logging.

### Data Quality Indicators

Show warnings when weekly averages are based on too few measurements.

Example:

```txt
This week has only 2 measurements, so the average may be less representative.
```
