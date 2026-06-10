import { Hono } from "hono"
import { setCookie } from "hono/cookie"

import { getAppPassword, getSessionSecret, type AppBindings } from "./config"
import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "./auth/session"

export const app = new Hono<{ Bindings: AppBindings }>()

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

app.post("/api/auth/login", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    password?: unknown
  } | null

  if (body?.password !== getAppPassword(c.env)) {
    return c.json(
      {
        error: "INVALID_PASSWORD",
        ok: false,
      },
      401,
    )
  }

  const requestUrl = new URL(c.req.url)
  const isLocalRequest =
    requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1"
  const sessionValue = await createSessionCookieValue(getSessionSecret(c.env))

  setCookie(c, SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: isLocalRequest ? "Lax" : "None",
    secure: !isLocalRequest,
  })

  return c.json({
    ok: true,
  })
})

export default app
