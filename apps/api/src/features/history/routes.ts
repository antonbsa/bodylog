import { Hono } from "hono"

import { MeasurementRepository } from "../../db/repositories/measurements"
import {
  createValidationError,
  isDateOnly,
} from "../../http/request-validation"
import { getUserSettings } from "../../http/user-settings"
import type { AppEnv } from "../../types"
import { getCurrentDateOnly } from "../dashboard/weekly-dashboard-service"
import { getHistoryWeeks } from "./history-service"

export const historyRoutes = new Hono<AppEnv>()

historyRoutes.get("/weeks", async (c) => {
  const before = c.req.query("before")

  if (before !== undefined && !isDateOnly(before)) {
    throw createValidationError("INVALID_DATE")
  }

  const repository = new MeasurementRepository(c.env.DB, c.get("userId"))
  const { heightCm, timeZone } = await getUserSettings(c)
  const page = await getHistoryWeeks(repository, {
    before,
    currentDate: getCurrentDateOnly(timeZone),
    heightCm,
  })

  return c.json(page)
})
