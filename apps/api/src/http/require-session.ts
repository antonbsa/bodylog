import { createMiddleware } from "hono/factory"

import { UnauthorizedError } from "../../../../infra/errors"
import { resolveSession } from "../features/auth/session"
import type { AppEnv } from "../types"

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const userId = await resolveSession(c)

  if (!userId) {
    throw new UnauthorizedError()
  }

  c.set("userId", userId)
  await next()
})
