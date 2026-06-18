import type { Measurement } from "../domain/measurement"

export const measurementCsvHeaders = [
  "date",
  "weight_kg",
  "body_fat_percentage",
  "muscle_percentage",
  "resting_metabolism_kcal",
  "created_at",
  "updated_at",
] as const

export function serializeMeasurementsCsv(measurements: Measurement[]): string {
  const rows = measurements.map((measurement) =>
    [
      measurement.date,
      measurement.weightKg,
      measurement.bodyFatPercentage,
      measurement.musclePercentage,
      measurement.restingMetabolismKcal,
      measurement.createdAt,
      measurement.updatedAt,
    ].map(formatCsvCell),
  )

  return [
    measurementCsvHeaders.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n")
}

function formatCsvCell(value: number | string | null): string {
  if (value === null) {
    return ""
  }

  const text = String(value)

  if (!/[",\n\r]/.test(text)) {
    return text
  }

  return `"${text.replaceAll('"', '""')}"`
}
