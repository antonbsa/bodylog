import { Hono } from "hono"

import { MeasurementRepository } from "../../db/repositories/measurements"
import { getUserSettings } from "../../http/user-settings"
import type { AppEnv } from "../../types"
import {
  getCurrentDateOnly,
  getWeeklyDashboard,
} from "./weekly-dashboard-service"

export const dashboardRoutes = new Hono<AppEnv>()

dashboardRoutes.get("/weekly", async (c) => {
  const repository = new MeasurementRepository(c.env.DB, c.get("userId"))
  const { heightCm, timeZone } = await getUserSettings(c)
  const dashboard = await getWeeklyDashboard(repository, {
    currentDate: getCurrentDateOnly(timeZone),
    heightCm,
  })

  return c.json(dashboard)
})
