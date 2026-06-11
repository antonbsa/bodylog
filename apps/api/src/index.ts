import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"

import { getAppPassword, getSessionSecret, type AppBindings } from "./config"
import {
  createSessionCookieValue,
  isValidSessionCookieValue,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "./auth/session"

export const app = new Hono<{ Bindings: AppBindings }>()

const protectedApiRoutePrefixes = [
  "/api/measurements",
  "/api/dashboard",
  "/api/export",
  "/api/import",
]

function isProtectedApiRoute(path: string): boolean {
  return protectedApiRoutePrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

app.use("/api/*", async (c, next) => {
  if (isProtectedApiRoute(c.req.path)) {
    const sessionCookieValue = getCookie(c, SESSION_COOKIE_NAME)
    const hasValidSession = await isValidSessionCookieValue(
      sessionCookieValue,
      getSessionSecret(c.env),
    )

    if (!hasValidSession) {
      return c.json(
        {
          error: "UNAUTHENTICATED",
          ok: false,
        },
        401,
      )
    }
  }

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

  // Local dev runs over plain HTTP; production cross-origin cookies need Secure + SameSite=None.
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

app.get("/api/auth/session", async (c) => {
  const sessionCookieValue = getCookie(c, SESSION_COOKIE_NAME)
  const hasValidSession = await isValidSessionCookieValue(
    sessionCookieValue,
    getSessionSecret(c.env),
  )

  if (!hasValidSession) {
    return c.json(
      {
        authenticated: false,
      },
      401,
    )
  }

  return c.json({
    authenticated: true,
  })
})

app.post("/api/auth/logout", (c) => {
  const requestUrl = new URL(c.req.url)
  const isLocalRequest =
    requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1"

  // Local dev runs over plain HTTP; production cross-origin cookies need Secure + SameSite=None.
  deleteCookie(c, SESSION_COOKIE_NAME, {
    httpOnly: true,
    path: "/",
    sameSite: isLocalRequest ? "Lax" : "None",
    secure: !isLocalRequest,
  })

  return c.json({
    ok: true,
  })
})

export default app
