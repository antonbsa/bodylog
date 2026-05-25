# Product Brief

## Product Name

BodyLog - Your body metrics tracker

## Problem

Daily body metrics are currently recorded in a Google Sheets spreadsheet. The workflow works, but it is not ideal for frequent mobile use.

The spreadsheet is good for storage and formulas, but it creates friction for daily logging and makes weekly progress harder to read quickly on a smartphone.

## Current Workflow

The user records bioimpedance scale measurements under similar daily conditions.

Current tracked fields:

- weight;
- BMI;
- body fat percentage;
- muscle percentage;
- resting metabolism.

The spreadsheet calculates:

- body fat mass in kg;
- muscle mass in kg;
- weekly averages;
- weekly variation compared with the previous week.

## Target User

The initial and only target user for V1 is the project owner.

The app is not intended to support multiple users in V1.

## Product Goal

Build a personal, mobile-first interface for daily body metrics logging and weekly progress tracking.

The app should reduce logging friction and make weekly evolution easier to understand than the current spreadsheet.

## V1 Objective

Deliver a functional app that allows the user to:

- register daily body measurements;
- edit and delete measurements;
- view measurement history;
- view weekly averages;
- compare the current partial week against the previous full week;
- import existing historical data from CSV;
- export records to CSV for backup;
- use the app through a simple authenticated personal interface.

## Non-Goals for V1

V1 is not intended to provide:

- multi-user support;
- advanced authentication;
- Google Sheets integration;
- advanced charts;
- automatic recommendations;
- health diagnosis;
- training or diet tracking;
- offline-first behavior;
- desktop-optimized dashboards;
- serverless Postgres migration.

## Product Constraints

- The app should be mobile-first.
- The app should be simple enough to complete and maintain as a personal project.
- V1 should prioritize delivery over completeness.
- The project should be useful as a portfolio project.
- The implementation should use TypeScript across frontend and backend.
- Deployment should happen fully on Cloudflare for V1.

## Success Criteria

V1 is successful when:

- the user can log a daily measurement faster than using the spreadsheet;
- the user can review weekly progress without manually calculating averages;
- historical spreadsheet data can be imported from CSV;
- the user can export data as CSV backup;
- the app is usable from a smartphone;
- the app is deployed on Cloudflare and protected by simple authentication.
