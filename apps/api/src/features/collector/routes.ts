import { Hono } from "hono"

import type { CollectorMeasurementsResponse } from "../../../../../types/measurements"
import { MeasurementRepository } from "../../db/repositories/measurements"
import { requireApiToken } from "../../http/require-api-token"
import {
  createValidationError,
  isDateOnly,
} from "../../http/request-validation"
import { getUserSettings } from "../../http/user-settings"
import type { AppEnv } from "../../types"

export const collectorRoutes = new Hono<AppEnv>()

// Guarding the route, not the prefix, keeps unknown /api/collector paths a 404.
collectorRoutes.get("/measurements", requireApiToken, async (c) => {
  const from = c.req.query("from") ?? null
  const to = c.req.query("to") ?? null

  if (
    (from !== null && !isDateOnly(from)) ||
    (to !== null && !isDateOnly(to))
  ) {
    throw createValidationError("INVALID_DATE")
  }

  const repository = new MeasurementRepository(c.env.DB, c.get("userId"))
  const measurements = await repository.list({
    ...(from === null ? {} : { from }),
    ...(to === null ? {} : { to }),
    order: "asc",
  })
  const { heightCm } = await getUserSettings(c)

  const body: CollectorMeasurementsResponse = {
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

  return c.json(body)
})
