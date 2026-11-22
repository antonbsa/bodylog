import { Hono } from "hono"

import { MeasurementRepository } from "../../db/repositories/measurements"
import {
  createNotFoundError,
  createValidationError,
  isDateOnly,
  parseMeasurementInput,
  parseMeasurementListQuery,
} from "../../http/request-validation"
import { getUserSettings } from "../../http/user-settings"
import type { MeasurementLookup } from "../../../../../types/measurements"
import type { AppEnv } from "../../types"

export const measurementRoutes = new Hono<AppEnv>()

measurementRoutes.get("/", async (c) => {
  const query = c.req.query()
  const listQuery = parseMeasurementListQuery(query)

  if (!listQuery.valid) {
    throw createValidationError(listQuery.code)
  }

  const repository = new MeasurementRepository(c.env.DB, c.get("userId"))
  const measurements = await repository.list(listQuery.query)
  const { heightCm } = await getUserSettings(c)

  return c.json({
    items: measurements.map((measurement) => ({
      ...measurement.toJSON(),
      derived: measurement.getDerivedValues(heightCm),
    })),
  })
})

measurementRoutes.get("/by-date/:date", async (c) => {
  const date = c.req.param("date")

  if (!isDateOnly(date)) {
    throw createValidationError("INVALID_DATE")
  }

  const repository = new MeasurementRepository(c.env.DB, c.get("userId"))
  const measurement = await repository.getByDate(date)

  if (!measurement) {
    throw createNotFoundError("MEASUREMENT_NOT_FOUND")
  }

  return c.json({
    item: measurement,
    heightCm: (await getUserSettings(c)).heightCm,
  } satisfies MeasurementLookup)
})

measurementRoutes.put("/by-date/:date", async (c) => {
  const date = c.req.param("date")

  if (!isDateOnly(date)) {
    throw createValidationError("INVALID_DATE")
  }

  const body = await c.req.json().catch(() => null)
  const input = parseMeasurementInput(body)

  if (!input.valid) {
    throw createValidationError(input.code)
  }

  const repository = new MeasurementRepository(c.env.DB, c.get("userId"))
  const existingMeasurement = await repository.getByDate(date)
  const measurement = existingMeasurement
    ? await repository.updateByDate(date, input.measurement)
    : await repository.create({
        date,
        ...input.measurement,
      })

  return c.json({
    item: measurement,
  })
})

measurementRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id")

  if (!id) {
    throw createValidationError("INVALID_MEASUREMENT_ID")
  }

  const repository = new MeasurementRepository(c.env.DB, c.get("userId"))
  const deleted = await repository.delete(id)

  if (!deleted) {
    throw createNotFoundError("MEASUREMENT_NOT_FOUND")
  }

  return c.json({
    ok: true,
  })
})
