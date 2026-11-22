import { Hono } from "hono"

import { MeasurementRepository } from "../../db/repositories/measurements"
import { getUserSettings } from "../../http/user-settings"
import type { AppEnv } from "../../types"
import { getTrends } from "./trends-service"

export const trendsRoutes = new Hono<AppEnv>()

trendsRoutes.get("/", async (c) => {
  const repository = new MeasurementRepository(c.env.DB, c.get("userId"))

  const { heightCm } = await getUserSettings(c)

  return c.json(await getTrends(repository, { heightCm }))
})
