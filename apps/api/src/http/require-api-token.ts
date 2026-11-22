import { createMiddleware } from "hono/factory"

import { UnauthorizedError } from "../../../../infra/errors"
import { recordApiTokenUse } from "../db/repositories/api-tokens"
import type { AppEnv } from "../types"
import { hashSecret } from "./credentials"

const BEARER_PATTERN = /^bearer +(.+)$/i

/** Authorizes a route by a personal API token in `Authorization: Bearer`; the session cookie never does (ADR 0047). */
export const requireApiToken = createMiddleware<AppEnv>(async (c, next) => {
  const token = BEARER_PATTERN.exec(c.req.header("authorization") ?? "")?.[1]
  const userId = token
    ? await recordApiTokenUse(c.env.DB, await hashSecret(token), new Date())
    : null

  if (!userId) {
    throw new UnauthorizedError({
      action: "Envie o cabeçalho Authorization: Bearer <token>.",
      message: "Token de API inválido ou ausente.",
    })
  }

  c.set("userId", userId)
  await next()
})
