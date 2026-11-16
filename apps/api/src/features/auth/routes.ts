import { Hono } from "hono"
import { deleteCookie, setCookie } from "hono/cookie"

import { UnauthorizedError } from "../../../../../infra/errors"
import { getAppPassword, getSessionSecret } from "../../config"
import { requireSession } from "../../http/require-session"
import type { AppEnv } from "../../types"
import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "./session"

function getSessionCookieOptions(requestUrl: string) {
  const { hostname } = new URL(requestUrl)
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1"

  return {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    secure: !isLocalhost,
  } as const
}

export const authRoutes = new Hono<AppEnv>()

authRoutes.post("/login", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    password?: unknown
  } | null

  if (body?.password !== getAppPassword(c.env)) {
    throw new UnauthorizedError({
      action: "Verifique a senha configurada e tente novamente.",
      message: "Senha inválida.",
    })
  }

  const sessionValue = await createSessionCookieValue(getSessionSecret(c.env))

  setCookie(c, SESSION_COOKIE_NAME, sessionValue, {
    ...getSessionCookieOptions(c.req.url),
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  return c.json({
    ok: true,
  })
})

authRoutes.get("/session", requireSession, (c) => {
  return c.json({
    authenticated: true,
  })
})

authRoutes.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, getSessionCookieOptions(c.req.url))

  return c.json({
    ok: true,
  })
})
