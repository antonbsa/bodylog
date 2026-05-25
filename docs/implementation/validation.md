# Validation Checklist

Use this checklist before considering V1 complete.

## Authentication

- [ ] Unauthenticated user cannot access dashboard.
- [ ] Unauthenticated user cannot access measurement API.
- [ ] Valid password logs in successfully.
- [ ] Invalid password shows an error.
- [ ] Logout works.

## Measurement Form

- [ ] Date defaults to today.
- [ ] Selecting a date with no record shows an empty form.
- [ ] Selecting a date with a record loads existing data.
- [ ] Weight is required.
- [ ] Body fat percentage is optional.
- [ ] Muscle percentage is optional.
- [ ] Resting metabolism is optional.
- [ ] Saving a new date creates a record.
- [ ] Saving an existing date updates the record.

## Measurement List

- [ ] Records are ordered by date descending.
- [ ] Raw values are displayed.
- [ ] Derived values are displayed when possible.
- [ ] Missing optional values are handled clearly.
- [ ] Edit action works.
- [ ] Delete action requires confirmation.
- [ ] Deleted records disappear from the list.

## Derived Metrics

- [ ] BMI is calculated correctly.
- [ ] Body fat mass is calculated correctly.
- [ ] Muscle mass is calculated correctly.
- [ ] Missing optional values do not break calculations.

## Weekly Logic

- [ ] Week starts on Monday.
- [ ] Week ends on Sunday.
- [ ] Missing days are ignored in averages.
- [ ] Optional metric averages ignore missing values.
- [ ] Current partial week is compared with previous full week.
- [ ] Measurement count is shown.
- [ ] Partial week is indicated.
- [ ] Percentage metrics show percentage-point variation.
- [ ] Relative percentage variation is calculated when possible.
- [ ] Direction is shown as up/down/stable.
- [ ] No metric is labeled good or bad.

## Dashboard

- [ ] Dashboard is the main screen after login.
- [ ] Weekly averages are visible.
- [ ] Weekly variation is visible.
- [ ] Register button is visible.
- [ ] Layout works on smartphone width.
- [ ] Cards/tables are readable.

## CSV Export

- [ ] Export downloads a CSV file.
- [ ] CSV contains all records.
- [ ] CSV headers match the documented format.
- [ ] CSV can be opened in a spreadsheet.

## CSV Import

- [ ] Valid CSV imports successfully.
- [ ] Existing dates are updated.
- [ ] New dates are created.
- [ ] Invalid rows are reported.
- [ ] Import summary is shown.
- [ ] Imported data appears in list and dashboard.

## PWA

- [ ] Manifest exists.
- [ ] Icons are configured.
- [ ] App can be installed on smartphone.
- [ ] App still behaves correctly when opened from installed shortcut.

## Deployment

- [ ] App deploys to Cloudflare.
- [ ] API works in production.
- [ ] D1 remote database works.
- [ ] Secrets are configured.
- [ ] No secret is committed to the repository.

## Documentation

- [ ] README describes the actual project.
- [ ] AGENTS.md reflects the implementation rules.
- [ ] Requirements match implemented behavior.
- [ ] API contract matches implemented routes.
- [ ] Data model matches migrations.
- [ ] Future ideas are documented separately from executable backlog tasks.
- [ ] Executable task tracking lives under `backlog/`.
