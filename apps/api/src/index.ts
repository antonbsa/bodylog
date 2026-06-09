import { Hono } from "hono"

type Bindings = {
  DB: D1Database
}

export const app = new Hono<{ Bindings: Bindings }>()

app.use("/api/*", async (c, next) => {
  await next()
  c.header("x-bodylog-api", "ok")
})

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    service: "bodylog-api",
  })
})

app.get("/api/health/d1", async (c) => {
  const row = await c.env.DB.prepare("SELECT 1 AS result").first<{
    result: number
  }>()

  return c.json({
    ok: row?.result === 1,
    database: "body_metrics_tracker",
    result: row?.result ?? null,
  })
})

export default app
