# Local DB Tooling

Development-only tooling for preparing and seeding the local Cloudflare D1 database.

These commands never target remote or production D1. They only use Wrangler's local D1 mode.

## Commands

Prepare local D1 for development:

```sh
npm run db:setup:local
```

This applies local migrations and seeds mock measurements only when the local `measurements` table is empty.

Seed or update the default mock measurements:

```sh
npm run db:seed:local
```

Reset local measurements and seed them again:

```sh
npm run db:reset:local
```

For deterministic data, pass an explicit date:

```sh
npm run db:seed:local -- --today 2026-06-11
```

## Seed Data

The seed creates:

- the previous full Monday-to-Sunday week;
- the current partial week through the selected `today` date;
- one current-week record with missing optional values.

Dates are generated in TypeScript because weekly grouping and current-week comparison depend on the current date. The SQL shape stays readable in `seed-template.sql`.
