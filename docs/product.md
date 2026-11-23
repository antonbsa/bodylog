# Product

BodyLog is a personal, mobile-first PWA for logging daily bioimpedance scale readings and reading weekly progress at a glance. It replaces a Google Sheets spreadsheet for one user, the project owner. How the screens look is in [UI direction](product/ui-direction.md); ideas outside the current scope are in [future ideas](product/future-ideas.md).

## The Problem

Daily body metrics were recorded in a Google Sheets spreadsheet. The workflow works, but it is not ideal for frequent mobile use: the spreadsheet is good for storage and formulas, but it creates friction for daily logging and makes weekly progress harder to read quickly on a smartphone.

The owner records bioimpedance scale measurements under similar daily conditions. The spreadsheet tracked weight, BMI, body fat percentage, muscle percentage and resting metabolism, and calculated body fat mass in kg, muscle mass in kg, weekly averages and weekly variation compared with the previous week.

## Who It's For

The initial and only target user is the project owner. The app does not support multiple users.

## Goal

Build a personal, mobile-first interface for daily body metrics logging and weekly progress tracking that reduces logging friction and makes weekly evolution easier to understand than the spreadsheet. The app lets the user:

- register daily body measurements;
- edit and delete measurements;
- view measurement history;
- view weekly averages;
- compare the current partial week against the previous full week;
- import existing historical data from CSV;
- export records to CSV for backup;
- sign in with a GitHub or Google account and keep a private history of their own.

### Constraints

- The app is mobile-first.
- It stays simple enough to complete and maintain as a personal project, favoring delivery over completeness.
- It is useful as a portfolio project.
- TypeScript across frontend and backend, deployed fully on Cloudflare.

### Success Criteria

The app succeeds when:

- the user can log a daily measurement faster than using the spreadsheet;
- the user can review weekly progress without manually calculating averages;
- historical spreadsheet data can be imported from CSV;
- the user can export data as CSV backup;
- the app is usable from a smartphone;
- the app is deployed on Cloudflare, and each account sees only its own data.

## Core Flows

The authenticated app has four screens behind a bottom tab bar (Início, Histórico, Tendências, Ajustes) and a full-screen registration route (`0033-use-bottom-navigation.md`).

### Log In

1. The user opens the app.
2. If not signed in, the login screen is displayed, with a link to the privacy policy (`/privacidade`), which opens signed in or not.
3. The user taps "Entrar com GitHub" or "Entrar com Google" and authorizes BodyLog on the provider.
4. The first sign-in creates the account, unless the provider's verified email already belongs to an account, which it opens; later ones return to it.
5. The user lands on Início.
6. If the user cancels on the provider or the sign-in fails, the login screen shows a message for that case.

### Read the Week on Início

1. The authenticated user opens the app on Início.
2. The Today card shows today's values with "Editar", or a "Registrar hoje" action when today has no record.
3. The "Esta semana" block shows the current week averages and their variation against the previous full week, in one neutral tone (`0031-use-neutral-variation-color.md`).
4. Its header shows the recorded days as seven day dots and the count against the 7-day target, plus the comparison week and its count (`0035-use-seven-day-weekly-target.md`).

### Create a Daily Measurement

1. The user taps the central add button.
2. The registration screen opens with today's date selected.
3. The system checks whether a record already exists for the selected date.
4. If no record exists, the form is empty.
5. The user enters at least weight.
6. The user optionally enters body fat percentage, muscle percentage, resting metabolism, waist, sleep, disposition, and notes (`0032-add-waist-sleep-disposition-and-notes-fields.md`).
7. The user saves.
8. The system creates the measurement, returns to Início and confirms with a toast.
9. Início and Histórico reflect the new record.

### Edit a Measurement by Date

1. The user opens the registration screen from a Histórico row, from "Editar" on Início, or by changing the date on the registration screen.
2. The system checks whether a record exists for that date.
3. If a record exists, the form is populated with existing values.
4. The user changes values.
5. The user saves.
6. The system updates the existing measurement for that date.
7. Weekly averages and history update accordingly.

### Delete a Measurement

1. The user opens a measurement in edit mode.
2. The user chooses "Excluir medida".
3. The system asks for confirmation in a dialog.
4. The user confirms.
5. The system deletes the measurement and returns to Início.
6. History and weekly calculations update accordingly.

### Browse the History

1. The user opens Histórico.
2. The system displays measurements as weekly cards, newest week first, loading older weeks on demand.
3. The user reviews the recorded values of each day.
4. The user taps a row to open it in edit mode.

### Export CSV

1. The user chooses the export action in Ajustes.
2. The system generates a CSV file with all records.
3. The user downloads the file, which serves as a manual backup.

### Import CSV

1. Optionally, the user copies the agent instructions in Ajustes and gives them to an agent with the spreadsheet; the agent returns a CSV that follows the public format page.
2. The user chooses the import action in Ajustes.
3. The user selects a CSV exported from the previous spreadsheet workflow.
4. The system validates the file.
5. Valid rows are imported or updated by date.
6. Invalid rows are reported.
7. The system shows an import summary.
8. Início and Histórico reflect imported records.

### Manage Personal API Tokens

1. The user opens "Tokens de API" in Ajustes, which lists each token's name, last four characters, creation date and last use.
2. The user creates a token by giving it a name, unique among their tokens and at most 50 characters; a name already in use is flagged while typing and blocks creation.
3. The system shows the token once, copies it to the clipboard, and warns that it won't be shown again; a copy button stays in case the automatic copy fails.
4. A user who already has three tokens sees a message to revoke one before creating another.
5. The user revokes a token after a confirmation, and the system deletes it.

## Functional Requirements

### FR-001 — Log a Daily Measurement

The system must allow the user to create a body measurement for a selected date.

#### Acceptance Criteria

- The date defaults to today.
- The user can select a different date.
- `weightKg` is required.
- `bodyFatPercentage` is optional.
- `musclePercentage` is optional.
- `restingMetabolismKcal` is optional.
- `waistCm`, `sleepHours`, `disposition` (1–5) and `notes` are optional (ADR 0032).
- The system stores at most one measurement per date.
- If the selected date has no record, the form is empty and creates a new measurement.
- If the selected date already has a record, the form loads the existing data for editing.

---

### FR-002 — Edit a Measurement

The system must allow the user to update an existing measurement.

#### Acceptance Criteria

- Existing measurements can be opened for editing.
- Updating a measurement preserves the same date.
- Updated values are reflected in the history list.
- Updated values are reflected in weekly averages and variations.

---

### FR-003 — Delete a Measurement

The system must allow the user to delete an existing measurement.

#### Acceptance Criteria

- A measurement can be deleted from its edit screen (ADR 0033).
- The user must confirm deletion before it happens.
- Deleted records no longer appear in history.
- Weekly averages and variations are recalculated after deletion.

---

### FR-004 — List Measurements

The system must display recorded measurements.

#### Acceptance Criteria

- Histórico groups recorded days into week cards, newest week first, and within a card lists days newest first.
- Each week card shows its period, its count of recorded days and a "Média" row with the week's average weight, body fat and muscle.
- Each day row shows the date with weekday, weight, body fat percentage and muscle percentage, with an em dash for a missing value.
- A day row shows a note icon when the record has notes.
- Derived values (BMI, body fat mass, muscle mass) are not listed in Histórico; they appear in the registration screen in edit mode and in Tendências.
- The list is usable on mobile.

---

### FR-005 — Calculate Derived Values

The system must calculate derived body metrics from the stored values.

#### Acceptance Criteria

- BMI is calculated from weight and the height the user sets in Ajustes; while no height is set, BMI shows "—" and Ajustes says the height is missing.
- Body fat mass is calculated when weight and body fat percentage are available.
- Muscle mass is calculated when weight and muscle percentage are available.
- Derived values are not required to be stored in the database.

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

- Weeks start on Monday.
- Weeks end on Sunday.
- Only days with measurements are included in averages.
- Missing days are not counted as zero.
- The system shows how many measurements were used in the current week.
- The UI shows the current week registration count against a 7-day target, with the recorded days (ADR 0035).
- The API returns weekly averages for all ten recorded metrics.
- Início shows six of them: weight, body fat, muscle, waist, sleep and disposition; metabolism and derived values are not shown there.

---

### FR-007 — Weekly Comparison

The system must compare the current week against the previous week.

#### Acceptance Criteria

- The current week is compared even when incomplete.
- The comparison uses the partial current week against the previous full week.
- The UI clearly indicates when the current week is partial.
- Absolute variation is displayed.
- Percentage-based metrics display absolute changes in percentage points.
- The system indicates whether each metric moved up, down, or stayed stable.
- A metric is stable when its change rounds to zero at the displayed precision (ADR 0039).
- The UI shows variations in one neutral tone, without health advice, diagnosis, recommendations, or motivational interpretation (ADR 0031).

---

### FR-008 — Weekly Dashboard

The system must provide a dashboard as the main screen.

#### Acceptance Criteria

- The dashboard is the initial authenticated screen.
- The dashboard shows current week averages for weight, body fat, muscle, waist, sleep and disposition.
- If the current week has no records yet, the dashboard summary cards show empty values (`-`) instead of another week's metrics.
- The dashboard shows comparison against the previous week.
- The dashboard includes a button to open the measurement form.
- The dashboard is mobile-first.
- The authenticated app uses separate screens (Início, Histórico, Tendências, Ajustes) with a bottom tab bar (ADR 0033).
- The measurement form is a full-screen route opened from the central add button or from a history row.
- Charts are limited to the Tendências screen (ADR 0030).

---

### FR-009 — CSV Export

The system must allow the user to export measurements as CSV.

#### Acceptance Criteria

- The user can download a CSV file with all measurements, including the new optional fields.
- The CSV includes raw stored fields.
- The CSV format is documented.
- Export works without Google Sheets integration.

---

### FR-010 — CSV Import

The system must allow the user to import historical measurements from a CSV file.

#### Acceptance Criteria

- The user can upload a CSV file whose columns are identified by header name (canonical, pt-BR or spreadsheet names; unknown columns are ignored and listed), with `,` or `;` delimiters and UTF-8 or Windows-1252 encoding.
- Settings describes the supported format before a file is chosen.
- The public page `/import-format.md` describes the format as instructions for an agent, and a "Copiar instruções para agente" row in Settings copies a prompt that points to it with the current origin's URL, confirming with a toast.
- Only date and weight are required; dates are `YYYY-MM-DD` or `DD/MM/YYYY`, and numbers accept a dot or comma decimal.
- The system validates the file and each row, and shows a preview before writing: period, counts of new, updated, no-measurement and invalid rows, the dates that will be updated, the ignored columns and every invalid row with its reason.
- Nothing is written until the user confirms; cancelling leaves the data unchanged.
- With invalid rows, the user chooses between importing only the valid rows and cancelling.
- The system upserts records by date, replacing only the fields whose column is in the file, and writes all valid rows or none.
- The system reports how many measurements were imported (new and updated) and how many invalid rows were skipped.

---

### FR-011 — Accounts and Sign-in

The system must give each person their own account, signed in with GitHub or Google (`0044-multi-user-accounts-with-oauth-sign-in.md`).

#### Acceptance Criteria

- The first sign-in creates an account (open sign-up); a later sign-in returns to the same account.
- Signing in with the other provider using the same verified email opens the same account; an unverified email always creates a separate one.
- Each account sees and edits only its own measurements, on every screen, in the CSV export and through the import; two accounts can record the same date.
- Sessions are stored on the server: they last 30 days, renew while in use and end at most 180 days after sign-in.
- All data routes require a session, except the collector endpoint, which requires a personal API token (FR-014).
- Logout ends the session on the server, so a copied cookie stops working.
- Cancelling on the provider or a failed sign-in returns to the login screen with a message.

---

### FR-012 — PWA Installability

The system must be installable as a basic PWA.

#### Acceptance Criteria

- The app has a manifest.
- The app has basic icons.
- The app can be installed on a smartphone.
- Offline-first support is not required.

---

### FR-013 — UI Language and Presentation

The system must present the interface using the documented UI direction.

#### Acceptance Criteria

- All visible labels and interface copy are in `pt-BR`.
- The UI supports light and dark themes, following the system with a manual override (ADR 0034).
- Values use `pt-BR` display formatting.
- Empty summary values display `-`.
- The history screen displays a "Nenhuma medida ainda." message with a "Registrar hoje" action when no records exist.
- The UI includes loading, empty, error, disabled, and submitting states where applicable.
- The UI avoids strong gradients, heavy glassmorphism, gamified fitness visuals, floating AI assistant patterns, and generic motivational copy.

---

### FR-014 — Read-only Collector Endpoint

The system must let external clients and agents read a user's measurements as JSON with that user's personal API token (`0047-read-only-collector-endpoint-authorized-by-personal-tokens.md`).

#### Acceptance Criteria

- `GET /api/collector/measurements` returns the token owner's measurements with derived values, ordered by date ascending, optionally limited by an inclusive `from`/`to` date range.
- Only a personal API token in `Authorization: Bearer` authorizes it; the session cookie does not, a revoked token stops working, and a token authorizes no other route.
- Each authorized call updates the token's last use shown in Ajustes.

## Non-Functional Requirements

### NFR-001 — Mobile-first

The interface must prioritize smartphone usage.

### NFR-002 — Simplicity

The implementation should favor a clear, maintainable solution over advanced abstractions.

### NFR-003 — TypeScript

Frontend and backend must use TypeScript.

### NFR-004 — Cloudflare Deployment

The app must be deployed fully on Cloudflare.

### NFR-005 — Personal Use

Each account is one person's private log; there is no sharing between accounts, admin role or "owner" account.

### NFR-006 — Data Portability

The user must be able to export data in a portable CSV format.

### NFR-007 — Future Migration Awareness

The data access layer should be isolated enough to support a future migration from Cloudflare D1 to serverless Postgres.

## Scope

### Product

- Personal body metrics tracker; each account keeps its own data.
- Mobile-first interface.
- Separate screens (Início, Histórico, Tendências, Ajustes) behind a bottom tab bar, and registration as a full-screen route (`0033-use-bottom-navigation.md`).

### Measurements

- One record per date per account, with date-based create/edit behavior.
- Required field: weight.
- Optional fields: body fat percentage, muscle percentage, resting metabolism, waist, sleep hours, disposition (1–5) and notes.
- BMI calculated from the user's height; body fat mass and muscle mass calculated when possible.

### Weekly Analysis

- Weeks run Monday to Sunday; the current week can be partial.
- Compare the partial current week against the previous full week.
- Show weekly averages, absolute variation, and percentage-point variation for percentage metrics.
- Show metric direction as up/down/stable, in one neutral tone, without health advice, diagnosis, recommendations, or motivational interpretation (`0031-use-neutral-variation-color.md`).
- Show the weekly registration count against a 7-day target, with the recorded days (`0035-use-seven-day-weekly-target.md`).
- Show trend charts in the Tendências screen only (`0030-allow-charts-in-trends.md`).

### Data Management

- Store data in Cloudflare D1.
- Export records to CSV; import historical data from CSV, upserting by date.

### Authentication

- Sign-in with GitHub or Google, linked by verified email, with open sign-up on the first sign-in (`0044-multi-user-accounts-with-oauth-sign-in.md`).
- Server-side sessions; data routes protected; logout available.

### Deployment

- Full deployment on Cloudflare: one Worker serves the API and the built web app, with D1 for persistence (`0040-serve-the-web-app-from-the-api-worker.md`).

## Non-Goals

The app does not provide:

- password or email sign-in, sharing data between accounts, or role-based access control;
- Google Sheets integration or push sync to external services; a read-only pull of a user's measurements with a personal token is allowed (`0047-read-only-collector-endpoint-authorized-by-personal-tokens.md`);
- offline-first behavior;
- charts outside the Tendências screen and advanced chart features (`0030-allow-charts-in-trends.md`);
- automatic recommendations, health diagnosis or body composition interpretation;
- training or diet tracking;
- desktop-optimized dashboards;
- a native mobile app;
- notifications or reminders;
- serverless Postgres, a planned later migration.

Ideas outside this scope, such as optional measurement time, offline-first logging, Google Sheets backup, moving averages or goal phases, are in [future ideas](product/future-ideas.md).

## Scope Rule

If a feature does not help the user log measurements, view weekly progress, import history, export backup, or protect personal data, it is not implemented.
