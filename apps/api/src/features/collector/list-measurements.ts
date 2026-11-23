import { UnauthorizedError } from "../../../../../infra/errors"
import type { CollectorMeasurementsResponse } from "../../../../../types/measurements"
import { MeasurementRepository } from "../../db/repositories/measurements"
import { UserRepository } from "../../db/repositories/users"
import {
  createValidationError,
  isDateOnly,
} from "../../http/request-validation"

type CollectorMeasurementsFilters = {
  from: string | null
  to: string | null
}

/** Lists the user's measurements oldest first for the collector HTTP route and the MCP tool; throws the `INVALID_DATE` validation error for a malformed bound. */
export async function listCollectorMeasurements(
  db: D1Database,
  userId: string,
  { from, to }: CollectorMeasurementsFilters,
): Promise<CollectorMeasurementsResponse> {
  if (
    (from !== null && !isDateOnly(from)) ||
    (to !== null && !isDateOnly(to))
  ) {
    throw createValidationError("INVALID_DATE")
  }

  const measurements = await new MeasurementRepository(db, userId).list({
    ...(from === null ? {} : { from }),
    ...(to === null ? {} : { to }),
    order: "asc",
  })
  const user = await new UserRepository(db).getById(userId)

  if (!user) {
    throw new UnauthorizedError()
  }

  const { heightCm } = user

  return {
    count: measurements.length,
    filters: { from, to },
    heightCm,
    // Fields are listed one by one so the contract clients rely on changes only on purpose.
    items: measurements.map((measurement) => ({
      date: measurement.date,
      weightKg: measurement.weightKg,
      bodyFatPercentage: measurement.bodyFatPercentage,
      musclePercentage: measurement.musclePercentage,
      restingMetabolismKcal: measurement.restingMetabolismKcal,
      waistCm: measurement.waistCm,
      sleepHours: measurement.sleepHours,
      disposition: measurement.disposition,
      notes: measurement.notes,
      derived: measurement.getDerivedValues(heightCm),
      createdAt: measurement.createdAt,
      updatedAt: measurement.updatedAt,
    })),
  }
}
