import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import type { SeedMeasurement } from "./types"
import { seedIdPrefix } from "./types"

const templatePath = fileURLToPath(
  new URL("./seed-template.sql", import.meta.url),
)

export function buildSeedSql(measurements: SeedMeasurement[]): string {
  const template = readFileSync(templatePath, "utf8")
  const rows = measurements.map(buildSeedRow).join(",\n")

  return template.replace("{{rows}}", rows)
}

function buildSeedRow(measurement: SeedMeasurement): string {
  const timestamp = `${measurement.date}T08:00:00.000Z`

  return `  (
    ${sqlString(`${seedIdPrefix}${measurement.date}`)},
    ${sqlString(measurement.date)},
    ${measurement.weightKg},
    ${sqlNullableNumber(measurement.bodyFatPercentage)},
    ${sqlNullableNumber(measurement.musclePercentage)},
    ${sqlNullableNumber(measurement.restingMetabolismKcal)},
    ${sqlString(timestamp)},
    ${sqlString(timestamp)}
  )`
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function sqlNullableNumber(value: number | null): string {
  return value === null ? "NULL" : String(value)
}
