import {
  addDays,
  differenceInDays,
  startOfMondayWeek,
  toIsoDate,
} from "./dates"
import type { SeedMeasurement } from "./types"

export function buildDefaultSeedMeasurements(today: Date): SeedMeasurement[] {
  const currentWeekStart = startOfMondayWeek(today)
  const previousWeekStart = addDays(currentWeekStart, -7)

  return [
    ...previousWeekMeasurements(previousWeekStart),
    ...currentWeekMeasurements(currentWeekStart, today),
  ]
}

function previousWeekMeasurements(weekStart: Date): SeedMeasurement[] {
  return Array.from({ length: 7 }, (_, dayIndex) => {
    const date = toIsoDate(addDays(weekStart, dayIndex))

    return {
      date,
      weightKg: roundMetric(73.4 - dayIndex * 0.08),
      bodyFatPercentage: roundMetric(16.4 - dayIndex * 0.05),
      musclePercentage: roundMetric(42.6 + dayIndex * 0.03),
      restingMetabolismKcal: 1680 + dayIndex * 2,
    }
  })
}

function currentWeekMeasurements(
  weekStart: Date,
  today: Date,
): SeedMeasurement[] {
  const daysAvailable = differenceInDays(today, weekStart) + 1

  return Array.from({ length: daysAvailable }, (_, dayIndex) => {
    const date = toIsoDate(addDays(weekStart, dayIndex))
    const measurement = {
      date,
      weightKg: roundMetric(72.6 - dayIndex * 0.06),
      bodyFatPercentage: roundMetric(15.7 - dayIndex * 0.04),
      musclePercentage: roundMetric(43.1 + dayIndex * 0.04),
      restingMetabolismKcal: 1700 + dayIndex * 3,
    }

    if (dayIndex === 1) {
      return {
        ...measurement,
        bodyFatPercentage: null,
        restingMetabolismKcal: null,
      }
    }

    return measurement
  })
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100
}
