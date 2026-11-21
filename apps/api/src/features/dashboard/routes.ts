import { Hono } from "hono"

import { getUserHeightCm, getUserTimeZone } from "../../config"
import { MeasurementRepository } from "../../db/repositories/measurements"
import type { AppEnv } from "../../types"
import {
  getCurrentDateOnly,
  getWeeklyDashboard,
} from "./weekly-dashboard-service"

export const dashboardRoutes = new Hono<AppEnv>()

dashboardRoutes.get("/weekly", async (c) => {
  const repository = new MeasurementRepository(c.env.DB, c.get("userId"))
  const dashboard = await getWeeklyDashboard(repository, {
    currentDate: getCurrentDateOnly(getUserTimeZone(c.env)),
    heightCm: getUserHeightCm(c.env),
  })

  return c.json(dashboard)
})
