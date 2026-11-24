import { Hono } from "hono"

import { requireApiToken } from "../../http/require-api-token"
import type { AppEnv } from "../../types"
import { listCollectorMeasurements } from "./list-measurements"

export const collectorRoutes = new Hono<AppEnv>()

// Guarding the route, not the prefix, keeps unknown /api/collector paths a 404.
collectorRoutes.get("/measurements", requireApiToken, async (c) => {
  const body = await listCollectorMeasurements(c.env.DB, c.get("userId"), {
    from: c.req.query("from") ?? null,
    to: c.req.query("to") ?? null,
  })

  return c.json(body)
})
