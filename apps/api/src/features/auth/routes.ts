import { Hono } from "hono"

import { NotFoundError, UnauthorizedError } from "../../../../../infra/errors"
import { isDevLoginEnabled } from "../../config"
import { UserRepository } from "../../db/repositories/users"
import { requireSession } from "../../http/require-session"
import type { AppEnv } from "../../types"
import { githubAuthRoutes } from "./github"
import { endSession, startSession } from "./session"

export const authRoutes = new Hono<AppEnv>()

authRoutes.route("/github", githubAuthRoutes)

authRoutes.get("/session", requireSession, async (c) => {
  const user = await new UserRepository(c.env.DB).getById(c.get("userId"))

  if (!user) {
    throw new UnauthorizedError()
  }

  return c.json({ user })
})

authRoutes.post("/logout", async (c) => {
  await endSession(c)

  return c.json({
    ok: true,
  })
})

authRoutes.post("/dev-login", async (c) => {
  if (!isDevLoginEnabled(c.env)) {
    // Same answer as an unknown route, so deployed environments don't reveal it exists.
    throw new NotFoundError({
      action: "Verifique o endereço e tente novamente.",
      message: "Rota não encontrada.",
    })
  }

  const user = await new UserRepository(c.env.DB).upsertFromProfile({
    displayName: "Dev",
    email: null,
    provider: "dev",
    providerUserId: "dev",
  })

  await startSession(c, user.id)

  return c.json({ user })
})
