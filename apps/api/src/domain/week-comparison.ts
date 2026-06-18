import { roundToTwoDecimals } from "./numeric"
import {
  weeklyAverageMetricKeys,
  type WeeklyAverages,
  type WeekSummary,
} from "./week-summary"

export const WEIGHT_STABLE_THRESHOLD_KG = 0.5
export const BODY_FAT_MASS_STABLE_THRESHOLD_KG = 0.4
export const MUSCLE_MASS_STABLE_THRESHOLD_KG = 0.3

export type MetricDirection = "up" | "down" | "stable"

export type MetricVariation = {
  absolute?: number
  absolutePercentagePoints?: number
  relativePercentage: number | null
  direction: MetricDirection | null
}

export type MetricVariationMap = Partial<
  Record<keyof WeeklyAverages, MetricVariation>
>

const percentageMetricKeys = new Set<keyof WeeklyAverages>([
  "bodyFatPercentage",
  "musclePercentage",
])

/**
 * Value object encapsulating weekly comparison rules: absolute variation,
 * relative percentage, direction thresholds, and percentage-point display
 * for percentage-based metrics.
 */
export class WeekComparison {
  static compare(
    current: WeekSummary,
    previous: WeekSummary,
  ): MetricVariationMap {
    return weeklyAverageMetricKeys.reduce<MetricVariationMap>(
      (variation, metricKey) => {
        const currentValue = current.averages[metricKey]
        const previousValue = previous.averages[metricKey]

        if (currentValue === null || previousValue === null) {
          return variation
        }

        const absoluteDifference = roundToTwoDecimals(
          currentValue - previousValue,
        )
        const metricVariation: MetricVariation = {
          relativePercentage:
            previousValue === 0
              ? null
              : roundToTwoDecimals((absoluteDifference / previousValue) * 100),
          direction: getDirection(
            metricKey,
            current.averages,
            previous.averages,
          ),
        }

        if (percentageMetricKeys.has(metricKey)) {
          metricVariation.absolutePercentagePoints = absoluteDifference
        } else {
          metricVariation.absolute = absoluteDifference
        }

        variation[metricKey] = metricVariation

        return variation
      },
      {},
    )
  }
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
