# Scope

## V1 In Scope

### Product

- Personal body metrics tracker.
- Single-user usage.
- Mobile-first interface.
- Weekly dashboard as the main screen.
- Measurement history list.

### UI Direction

The detailed UI/design direction is intentionally pending.

Before implementing frontend UI screens, decide and document the basic visual direction, navigation pattern, and any design references. This should happen before building the dashboard, measurement form, history list, or import/export screens.

### Measurements

- One record per date.
- Date-based create/edit behavior.
- Required field: weight.
- Optional fields:
  - body fat percentage;
  - muscle percentage;
  - resting metabolism.
- BMI calculated from configured height.
- Body fat mass calculated when possible.
- Muscle mass calculated when possible.

### Weekly Analysis

- Week starts on Monday.
- Week ends on Sunday.
- Current week can be partial.
- Compare partial current week against previous full week.
- Show weekly averages.
- Show absolute variation.
- Show relative percentage variation.
- Show percentage-point variation for percentage metrics.
- Show metric direction as up/down/stable.
- Do not classify changes as good or bad.

### Data Management

- Store data in Cloudflare D1.
- Export records to CSV.
- Import historical data from CSV.
- Upsert imported records by date.

### Authentication

- Simple single-user password authentication.
- Password stored as a secret/environment variable.
- Data routes protected.
- Logout available.

### Deployment

- Full deployment on Cloudflare.
- Cloudflare Workers for API.
- Cloudflare D1 for persistence.
- Cloudflare Pages or Workers Static Assets for frontend.

## V1 Out of Scope

- Multi-user support.
- Account registration.
- OAuth/social login.
- Role-based access control.
- Google Sheets automatic integration.
- Offline-first behavior.
- Automatic sync.
- Advanced charts.
- Desktop-optimized dashboards.
- Training tracking.
- Diet tracking.
- Health recommendations.
- Automatic body composition interpretation.
- Native mobile app.
- Notifications/reminders.
- Serverless Postgres.

## V1.1 / V2 Candidates

- Daily notes/observations.
- Optional measurement time.
- Full offline-first logging.
- Sync after reconnecting.
- Google Sheets automatic backup.
- Advanced charts.
- Desktop-friendly dashboards.
- Trend analysis.
- Moving averages.
- Goal phases such as bulking, cutting, or maintenance.
- Serverless Postgres migration.

## Scope Rule

If a feature does not help the user log measurements, view weekly progress, import history, export backup, or protect personal data in V1, it should not be implemented in V1.
