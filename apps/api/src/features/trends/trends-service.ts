import type { MeasurementRepository } from "../../db/repositories/measurements"
import type { TrendsResponse } from "../../../../../types/trends"

export type TrendsRepository = Pick<MeasurementRepository, "list">

/** Every measurement, oldest first, so the client can window and average without paging. */
export async function getTrends(
  repository: TrendsRepository,
  config: { heightCm: number | null },
): Promise<TrendsResponse> {
  const measurements = await repository.list()

  return {
    points: measurements
      .map((measurement) => ({
        bmi: measurement.getDerivedValues(config.heightCm).bmi,
        bodyFatPercentage: measurement.bodyFatPercentage,
        date: measurement.date,
        disposition: measurement.disposition,
        musclePercentage: measurement.musclePercentage,
        restingMetabolismKcal: measurement.restingMetabolismKcal,
        sleepHours: measurement.sleepHours,
        waistCm: measurement.waistCm,
        weightKg: measurement.weightKg,
      }))
      .sort((left, right) => left.date.localeCompare(right.date)),
  }
}
