import { Hono } from "hono"

import type { SessionResponse } from "../../../../../types/auth"
import { UnauthorizedError } from "../../../../../infra/errors"
import { UserRepository } from "../../db/repositories/users"
import {
  createValidationError,
  parseProfileInput,
} from "../../http/request-validation"
import type { AppEnv } from "../../types"

export const meRoutes = new Hono<AppEnv>()

meRoutes.patch("/", async (c) => {
  const body = await c.req.json().catch(() => null)
  const update = parseProfileInput(body)

  if (!update) {
    throw createValidationError("INVALID_PROFILE_INPUT")
  }

  const user = await new UserRepository(c.env.DB).updateProfile(
    c.get("userId"),
    update,
  )

  if (!user) {
    throw new UnauthorizedError()
  }

  return c.json({ user } satisfies SessionResponse)
})
