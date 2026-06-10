import {
  calculateDerivedMeasurementValues,
  roundToTwoDecimals,
} from "./derived-calculations"
import type { Measurement } from "./types"

export const WEIGHT_STABLE_THRESHOLD_KG = 0.5
export const BODY_FAT_MASS_STABLE_THRESHOLD_KG = 0.4
export const MUSCLE_MASS_STABLE_THRESHOLD_KG = 0.3

export type WeeklyAverages = {
  weightKg: number | null
  bmi: number | null
  bodyFatPercentage: number | null
  bodyFatKg: number | null
  musclePercentage: number | null
  muscleKg: number | null
  restingMetabolismKcal: number | null
}

export type WeekSummary = {
  weekStartDate: string
  weekEndDate: string
  measurementCount: number
  isCurrentWeek: boolean
  isPartialWeek: boolean
  averages: WeeklyAverages
}

export type MetricDirection = "up" | "down" | "stable"

export type MetricVariation = {
  absolute?: number
  absolutePercentagePoints?: number
  relativePercentage: number | null
  direction: MetricDirection | null
}

export type WeeklyComparison = {
  current: WeekSummary
  previous: WeekSummary
  variation: Partial<Record<keyof WeeklyAverages, MetricVariation>>
}

export type WeeklyComparisonConfig = {
  currentDate: string
  heightCm: number
}

type WeekRange = {
  weekStartDate: string
  weekEndDate: string
}

type MetricAccumulator = {
  values: number[]
}

const metricKeys = [
  "weightKg",
  "bmi",
  "bodyFatPercentage",
  "bodyFatKg",
  "musclePercentage",
  "muscleKg",
  "restingMetabolismKcal",
] as const satisfies readonly (keyof WeeklyAverages)[]

const percentageMetricKeys = new Set<keyof WeeklyAverages>([
  "bodyFatPercentage",
  "musclePercentage",
])

export function createWeeklyComparison(
  measurements: Measurement[],
  config: WeeklyComparisonConfig,
): WeeklyComparison {
  const currentRange = getWeekRange(config.currentDate)
  const previousRange = getPreviousWeekRange(currentRange.weekStartDate)

  const current = summarizeWeek(measurements, {
    ...currentRange,
    currentDate: config.currentDate,
    heightCm: config.heightCm,
    isCurrentWeek: true,
  })
  const previous = summarizeWeek(measurements, {
    ...previousRange,
    currentDate: config.currentDate,
    heightCm: config.heightCm,
    isCurrentWeek: false,
  })

  return {
    current,
    previous,
    variation: compareWeeklyAverages(current.averages, previous.averages),
  }
}

export function getWeekRange(date: string): WeekRange {
  const parsedDate = parseDateOnly(date)
  const dayOfWeek = parsedDate.getUTCDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const weekStart = addDays(parsedDate, -daysSinceMonday)
  const weekEnd = addDays(weekStart, 6)

  return {
    weekStartDate: formatDateOnly(weekStart),
    weekEndDate: formatDateOnly(weekEnd),
  }
}

export function compareWeeklyAverages(
  current: WeeklyAverages,
  previous: WeeklyAverages,
): Partial<Record<keyof WeeklyAverages, MetricVariation>> {
  return metricKeys.reduce<
    Partial<Record<keyof WeeklyAverages, MetricVariation>>
  >((variation, metricKey) => {
    const currentValue = current[metricKey]
    const previousValue = previous[metricKey]

    if (currentValue === null || previousValue === null) {
      return variation
    }

    const absoluteDifference = roundToTwoDecimals(currentValue - previousValue)
    const metricVariation: MetricVariation = {
      relativePercentage:
        previousValue === 0
          ? null
          : roundToTwoDecimals((absoluteDifference / previousValue) * 100),
      direction: getDirection(metricKey, current, previous),
    }

    if (percentageMetricKeys.has(metricKey)) {
      metricVariation.absolutePercentagePoints = absoluteDifference
    } else {
      metricVariation.absolute = absoluteDifference
    }

    variation[metricKey] = metricVariation

    return variation
  }, {})
}

function summarizeWeek(
  measurements: Measurement[],
  options: WeekRange & {
    currentDate: string
    heightCm: number
    isCurrentWeek: boolean
  },
): WeekSummary {
  const weeklyMeasurements = measurements.filter(
    (measurement) =>
      measurement.date >= options.weekStartDate &&
      measurement.date <= options.weekEndDate,
  )

  return {
    weekStartDate: options.weekStartDate,
    weekEndDate: options.weekEndDate,
    measurementCount: weeklyMeasurements.length,
    isCurrentWeek: options.isCurrentWeek,
    isPartialWeek:
      options.isCurrentWeek && options.currentDate < options.weekEndDate,
    averages: calculateWeeklyAverages(weeklyMeasurements, options.heightCm),
  }
}

function calculateWeeklyAverages(
  measurements: Measurement[],
  heightCm: number,
): WeeklyAverages {
  const accumulators = createMetricAccumulators()

  for (const measurement of measurements) {
    const derivedValues = calculateDerivedMeasurementValues(measurement, {
      heightCm,
    })

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

  return metricKeys.reduce<WeeklyAverages>(
    (averages, metricKey) => ({
      ...averages,
      [metricKey]: average(accumulators[metricKey].values),
    }),
    createEmptyAverages(),
  )
}

function getDirection(
  metricKey: keyof WeeklyAverages,
  current: WeeklyAverages,
  previous: WeeklyAverages,
): MetricDirection | null {
  if (metricKey === "bodyFatPercentage") {
    return getThresholdDirection(
      current.bodyFatKg,
      previous.bodyFatKg,
      BODY_FAT_MASS_STABLE_THRESHOLD_KG,
    )
  }

  if (metricKey === "musclePercentage") {
    return getThresholdDirection(
      current.muscleKg,
      previous.muscleKg,
      MUSCLE_MASS_STABLE_THRESHOLD_KG,
    )
  }

  if (metricKey === "weightKg") {
    return getThresholdDirection(
      current.weightKg,
      previous.weightKg,
      WEIGHT_STABLE_THRESHOLD_KG,
    )
  }

  if (metricKey === "bodyFatKg") {
    return getThresholdDirection(
      current.bodyFatKg,
      previous.bodyFatKg,
      BODY_FAT_MASS_STABLE_THRESHOLD_KG,
    )
  }

  if (metricKey === "muscleKg") {
    return getThresholdDirection(
      current.muscleKg,
      previous.muscleKg,
      MUSCLE_MASS_STABLE_THRESHOLD_KG,
    )
  }

  return getExactDirection(current[metricKey], previous[metricKey])
}

function getThresholdDirection(
  currentValue: number | null,
  previousValue: number | null,
  stableThreshold: number,
): MetricDirection | null {
  if (currentValue === null || previousValue === null) {
    return null
  }

  const difference = currentValue - previousValue

  if (Math.abs(difference) < stableThreshold) {
    return "stable"
  }

  return difference > 0 ? "up" : "down"
}

function getExactDirection(
  currentValue: number | null,
  previousValue: number | null,
): MetricDirection | null {
  if (currentValue === null || previousValue === null) {
    return null
  }

  if (currentValue === previousValue) {
    return "stable"
  }

  return currentValue > previousValue ? "up" : "down"
}

function createMetricAccumulators(): Record<
  keyof WeeklyAverages,
  MetricAccumulator
> {
  return metricKeys.reduce<Record<keyof WeeklyAverages, MetricAccumulator>>(
    (accumulators, metricKey) => ({
      ...accumulators,
      [metricKey]: { values: [] },
    }),
    {
      weightKg: { values: [] },
      bmi: { values: [] },
      bodyFatPercentage: { values: [] },
      bodyFatKg: { values: [] },
      musclePercentage: { values: [] },
      muscleKg: { values: [] },
      restingMetabolismKcal: { values: [] },
    },
  )
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

function getPreviousWeekRange(weekStartDate: string): WeekRange {
  const previousWeekStart = addDays(parseDateOnly(weekStartDate), -7)
  const previousWeekEnd = addDays(previousWeekStart, 6)

  return {
    weekStartDate: formatDateOnly(previousWeekStart),
    weekEndDate: formatDateOnly(previousWeekEnd),
  }
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)

  return nextDate
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}
