# Requirements

## Functional Requirements

### FR-001 — Log a Daily Measurement

The system must allow the user to create a body measurement for a selected date.

#### Acceptance Criteria

- [ ] The date defaults to today.
- [ ] The user can select a different date.
- [ ] `weightKg` is required.
- [ ] `bodyFatPercentage` is optional.
- [ ] `musclePercentage` is optional.
- [ ] `restingMetabolismKcal` is optional.
- [ ] The system stores at most one measurement per date.
- [ ] If the selected date has no record, the form is empty and creates a new measurement.
- [ ] If the selected date already has a record, the form loads the existing data for editing.

---

### FR-002 — Edit a Measurement

The system must allow the user to update an existing measurement.

#### Acceptance Criteria

- [ ] Existing measurements can be opened for editing.
- [ ] Updating a measurement preserves the same date.
- [ ] Updated values are reflected in the history list.
- [ ] Updated values are reflected in weekly averages and variations.

---

### FR-003 — Delete a Measurement

The system must allow the user to delete an existing measurement.

#### Acceptance Criteria

- [ ] A measurement can be deleted from the history list or detail/form context.
- [ ] The user must confirm deletion before it happens.
- [ ] Deleted records no longer appear in history.
- [ ] Weekly averages and variations are recalculated after deletion.

---

### FR-004 — List Measurements

The system must display recorded measurements.

#### Acceptance Criteria

- [ ] Measurements are listed in descending date order.
- [ ] Each item shows the original recorded fields.
- [ ] Each item shows derived body fat mass when possible.
- [ ] Each item shows derived muscle mass when possible.
- [ ] Missing optional fields are displayed clearly.
- [ ] The list is usable on mobile.

---

### FR-005 — Calculate Derived Values

The system must calculate derived body metrics from the stored values.

#### Acceptance Criteria

- [ ] BMI is calculated from weight and configured height.
- [ ] Body fat mass is calculated when weight and body fat percentage are available.
- [ ] Muscle mass is calculated when weight and muscle percentage are available.
- [ ] Derived values are not required to be stored in the database.

#### Formulas

```txt
BMI = weightKg / (heightM * heightM)
bodyFatKg = weightKg * bodyFatPercentage / 100
muscleKg = weightKg * musclePercentage / 100
```

---

### FR-006 — Weekly Averages

The system must group measurements by week and calculate weekly averages.

#### Acceptance Criteria

- [ ] Weeks start on Monday.
- [ ] Weeks end on Sunday.
- [ ] Only days with measurements are included in averages.
- [ ] Missing days are not counted as zero.
- [ ] The system shows how many measurements were used in the current week.
- [ ] Weekly averages include all available metrics and derived metrics.

---

### FR-007 — Weekly Comparison

The system must compare the current week against the previous week.

#### Acceptance Criteria

- [ ] The current week is compared even when incomplete.
- [ ] The comparison uses the partial current week against the previous full week.
- [ ] The UI clearly indicates when the current week is partial.
- [ ] Absolute variation is displayed.
- [ ] Relative percentage variation is displayed when applicable.
- [ ] Percentage-based metrics display absolute changes in percentage points.
- [ ] The system indicates whether each metric moved up, down, or stayed stable.
- [ ] The system does not classify changes as good or bad in V1.

---

### FR-008 — Weekly Dashboard

The system must provide a dashboard as the main screen.

#### Acceptance Criteria

- [ ] The dashboard is the initial authenticated screen.
- [ ] The dashboard shows current week averages.
- [ ] The dashboard shows comparison against the previous week.
- [ ] The dashboard includes a button to open the measurement form.
- [ ] The dashboard is mobile-first.
- [ ] The dashboard uses cards and tables instead of charts in V1.

---

### FR-009 — CSV Export

The system must allow the user to export measurements as CSV.

#### Acceptance Criteria

- [ ] The user can download a CSV file with all measurements.
- [ ] The CSV includes raw stored fields.
- [ ] The CSV format is documented.
- [ ] Export works without Google Sheets integration.

---

### FR-010 — CSV Import

The system must allow the user to import historical measurements from a CSV file.

#### Acceptance Criteria

- [ ] The user can upload a CSV file.
- [ ] The system validates headers.
- [ ] The system validates rows.
- [ ] The system upserts records by date.
- [ ] The system returns an import summary.
- [ ] Invalid rows are reported clearly.
- [ ] Import is treated as the last V1 feature.

---

### FR-011 — Simple Authentication

The system must protect the app with simple single-user authentication.

#### Acceptance Criteria

- [ ] The user must enter a password before accessing the app.
- [ ] The password is stored as a Cloudflare secret or environment variable.
- [ ] The password is not committed to the repository.
- [ ] Authenticated state is stored using a secure session approach.
- [ ] All data routes require authentication.
- [ ] Logout is available.

---

### FR-012 — PWA Installability

The system must be installable as a basic PWA.

#### Acceptance Criteria

- [ ] The app has a manifest.
- [ ] The app has basic icons.
- [ ] The app can be installed on a smartphone.
- [ ] Full offline-first support is not required in V1.

## Non-Functional Requirements

### NFR-001 — Mobile-first

The V1 interface must prioritize smartphone usage.

### NFR-002 — Simplicity

The implementation should favor a clear, maintainable solution over advanced abstractions.

### NFR-003 — TypeScript

Frontend and backend must use TypeScript.

### NFR-004 — Cloudflare Deployment

V1 must be deployed fully on Cloudflare.

### NFR-005 — Personal Use

V1 is designed for a single user and does not need to support multiple accounts.

### NFR-006 — Data Portability

The user must be able to export data in a portable CSV format.

### NFR-007 — Future Migration Awareness

The data access layer should be isolated enough to support a future migration from Cloudflare D1 to serverless Postgres in V2.
