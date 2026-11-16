import { Hono } from "hono"

import { getUserHeightCm } from "../../config"
import { MeasurementRepository } from "../../db/repositories/measurements"
import type { AppEnv } from "../../types"
import { getTrends } from "./trends-service"

export const trendsRoutes = new Hono<AppEnv>()

trendsRoutes.get("/", async (c) => {
  const repository = new MeasurementRepository(c.env.DB)

  return c.json(
    await getTrends(repository, { heightCm: getUserHeightCm(c.env) }),
  )
})
