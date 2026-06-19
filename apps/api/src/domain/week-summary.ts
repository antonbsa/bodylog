import type { Measurement } from "./measurement"
import { roundToTwoDecimals } from "./numeric"
import type { WeekRange } from "./week-range"

export type WeeklyAverages = {
  weightKg: number | null
  bmi: number | null
  bodyFatPercentage: number | null
  bodyFatKg: number | null
  musclePercentage: number | null
  muscleKg: number | null
  restingMetabolismKcal: number | null
}

export const weeklyAverageMetricKeys = [
  "weightKg",
  "bmi",
  "bodyFatPercentage",
  "bodyFatKg",
  "musclePercentage",
  "muscleKg",
  "restingMetabolismKcal",
] as const satisfies readonly (keyof WeeklyAverages)[]

type WeekSummaryOptions = {
  currentDate: string
  heightCm: number
  isCurrentWeek: boolean
}

type MetricAccumulator = {
  values: number[]
}

/**
 * Value object encapsulating weekly average calculation rules: only
 * existing measurements count, missing optional values are ignored per
 * metric, and an average is null when no values are available.
 */
export class WeekSummary {
  readonly weekStartDate: string
  readonly weekEndDate: string
  readonly measurementCount: number
  readonly isCurrentWeek: boolean
  readonly isPartialWeek: boolean
  readonly averages: WeeklyAverages

  private constructor(fields: {
    averages: WeeklyAverages
    isCurrentWeek: boolean
    isPartialWeek: boolean
    measurementCount: number
    weekEndDate: string
    weekStartDate: string
  }) {
    this.weekStartDate = fields.weekStartDate
    this.weekEndDate = fields.weekEndDate
    this.measurementCount = fields.measurementCount
    this.isCurrentWeek = fields.isCurrentWeek
    this.isPartialWeek = fields.isPartialWeek
    this.averages = fields.averages
  }

  static forRange(
    measurements: Measurement[],
    range: WeekRange,
    options: WeekSummaryOptions,
  ): WeekSummary {
    const weeklyMeasurements = measurements.filter(
      (measurement) =>
        measurement.date >= range.weekStartDate &&
        measurement.date <= range.weekEndDate,
    )

    return new WeekSummary({
      averages: calculateWeeklyAverages(weeklyMeasurements, options.heightCm),
      isCurrentWeek: options.isCurrentWeek,
      isPartialWeek:
        options.isCurrentWeek && options.currentDate < range.weekEndDate,
      measurementCount: weeklyMeasurements.length,
      weekEndDate: range.weekEndDate,
      weekStartDate: range.weekStartDate,
    })
  }
}

function calculateWeeklyAverages(
  measurements: Measurement[],
  heightCm: number,
): WeeklyAverages {
  const accumulators = createMetricAccumulators()

  for (const measurement of measurements) {
    const derivedValues = measurement.getDerivedValues(heightCm)

    accumulators.weightKg.values.push(measurement.weightKg)
    accumulators.bmi.values.push(derivedValues.bmi)
    addOptionalValue(
      accumulators.bodyFatPercentage,
      measurement.bodyFatPercentage,
    )
    addOptionalValue(accumulators.bodyFatKg, derivedValues.bodyFatKg)
    addOptionalValue(
      accumulators.musclePercentage,
      measurement.musclePercentage,
    )
    addOptionalValue(accumulators.muscleKg, derivedValues.muscleKg)
    addOptionalValue(
      accumulators.restingMetabolismKcal,
      measurement.restingMetabolismKcal,
    )
  }

  return weeklyAverageMetricKeys.reduce<WeeklyAverages>(
    (averages, metricKey) => ({
      ...averages,
      [metricKey]: average(accumulators[metricKey].values),
    }),
    createEmptyAverages(),
  )
}

function createMetricAccumulators(): Record<
  keyof WeeklyAverages,
  MetricAccumulator
> {
  return {
    weightKg: { values: [] },
    bmi: { values: [] },
    bodyFatPercentage: { values: [] },
    bodyFatKg: { values: [] },
    musclePercentage: { values: [] },
    muscleKg: { values: [] },
    restingMetabolismKcal: { values: [] },
  }
}

function createEmptyAverages(): WeeklyAverages {
  return {
    weightKg: null,
    bmi: null,
    bodyFatPercentage: null,
    bodyFatKg: null,
    musclePercentage: null,
    muscleKg: null,
    restingMetabolismKcal: null,
  }
}

function addOptionalValue(
  accumulator: MetricAccumulator,
  value: number | null,
): void {
  if (value !== null) {
    accumulator.values.push(value)
  }
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }

  return roundToTwoDecimals(
    values.reduce((total, value) => total + value, 0) / values.length,
  )
}
