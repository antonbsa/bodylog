# User Flows

## Flow 1 — Login

1. The user opens the app.
2. If not authenticated, the login screen is displayed.
3. The user enters the configured password.
4. The system validates the password.
5. If valid, the user is redirected to the weekly dashboard.
6. If invalid, the system shows an error message.

## Flow 2 — View Weekly Dashboard

1. The authenticated user opens the app.
2. The dashboard loads the current week summary.
3. The dashboard displays current week averages.
4. The dashboard displays variation against the previous full week.
5. The dashboard indicates that the current week may be partial.
6. The dashboard shows direction indicators for metrics.
7. The user can open the measurement form from the dashboard.

## Flow 3 — Create a Daily Measurement

1. The user taps the register button.
2. The measurement form opens with today's date selected.
3. The system checks whether a record already exists for the selected date.
4. If no record exists, the form is empty.
5. The user enters at least weight.
6. The user optionally enters body fat percentage, muscle percentage, and resting metabolism.
7. The user saves.
8. The system creates the measurement.
9. The dashboard and history reflect the new record.

## Flow 4 — Edit a Daily Measurement by Date

1. The user opens the measurement form.
2. The user selects a date.
3. The system checks whether a record exists for that date.
4. If a record exists, the form is populated with existing values.
5. The user changes values.
6. The user saves.
7. The system updates the existing measurement for that date.
8. Weekly averages and history update accordingly.

## Flow 5 — Delete a Measurement

1. The user opens a measurement from the history list or form context.
2. The user chooses delete.
3. The system asks for confirmation.
4. The user confirms.
5. The system deletes the measurement.
6. History and weekly calculations update accordingly.

## Flow 6 — View Measurement History

1. The user opens the history/list section.
2. The system displays measurements ordered by date descending.
3. The user reviews raw and derived metrics.
4. The user can select a record for editing or deletion.

## Flow 7 — Export CSV

1. The user opens the export action.
2. The system generates a CSV file with all records.
3. The user downloads the file.
4. The CSV can be used as manual backup.

## Flow 8 — Import CSV

1. The user opens the import action.
2. The user selects a CSV exported from the previous spreadsheet workflow.
3. The system validates the file.
4. Valid rows are imported or updated by date.
5. Invalid rows are reported.
6. The system shows an import summary.
7. The dashboard and history reflect imported records.
