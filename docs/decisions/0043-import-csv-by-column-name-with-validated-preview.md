---
status: Accepted
area: product
amends: ["0006"]
amended-by: ["0048"]
---

# 0043 — Import CSV by Column Name with a Validated Preview

## Status

Accepted

## Context

ADR 0006 limited the import to the canonical CSV and left alternate spreadsheet headers for later. The history to import lives in a spreadsheet with its own headers (`Data`, `Peso`, `Metabolismo basal`), `;` delimiters, Windows-1252 encoding, `DD/MM/YYYY` dates and decimal commas. The import also wrote row by row as soon as the file was chosen, so a wrong file could overwrite days already logged and a failure left the data half imported.

## Decision

- **Columns by name.** Headers are normalized (lowercase, accents stripped, `_`, `-` and space equal) and must then equal an entry of a closed alias list per field (canonical English, pt-BR snake_case, spreadsheet name). There is no substring or fuzzy matching, and two headers mapping to one field reject the file. Unknown and derived columns (such as `IMC`) are ignored and reported, and cells past the last header (a spreadsheet's side area) are ignored silently. Only date and weight are required.
- **Tolerant file format.** The delimiter (`,` or `;`) is detected from the header line; the encoding is UTF-8 (BOM stripped) with a Windows-1252 fallback. Dates are `YYYY-MM-DD` or `D/M/YYYY`, numbers accept a dot or comma decimal, and a dot is a thousands separator only for resting metabolism. Anything else, including units, symbols, ranges and years without four digits, is an invalid value instead of a guess.
- **Preview before writing.** `POST /api/import/csv/preview` validates without writing and reports the period, the counts of new, updated, no-measurement and invalid rows, the dates to update, the ignored columns and every invalid row. `POST /api/import/csv` re-validates the same file and writes, and rejects a file with invalid rows unless `skipInvalid=true`.
- **Field-preserving overwrite.** An imported row replaces only the fields whose column is in the file (an empty cell clears the field); fields without a column keep their stored value. `created_at` is kept and `updated_at` is the import time unless the file carries those columns.
- **All or nothing.** All valid rows are written in one D1 `batch()`.

## Consequences

- ADR 0006's consequence that only the canonical headers import no longer holds; the canonical CSV still imports and round-trips with no ignored columns.
- Row errors carry `row`, `column`, `value` and a Portuguese `message`; stable error codes are added when the app gets i18n.
- Alternatives not taken: a manual column-mapping UI, deducing the year of `DD/MM` dates, fuzzy header matching.
