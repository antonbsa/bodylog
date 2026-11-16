import { getCookie } from "hono/cookie"
import { createMiddleware } from "hono/factory"

import { UnauthorizedError } from "../../../../infra/errors"
import { getSessionSecret } from "../config"
import {
  isValidSessionCookieValue,
  SESSION_COOKIE_NAME,
} from "../features/auth/session"
import type { AppEnv } from "../types"

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const hasValidSession = await isValidSessionCookieValue(
    getCookie(c, SESSION_COOKIE_NAME),
    getSessionSecret(c.env),
  )

  if (!hasValidSession) {
    throw new UnauthorizedError()
  }

  await next()
})
