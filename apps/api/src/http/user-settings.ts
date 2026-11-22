import type { Context } from "hono"

import { UnauthorizedError } from "../../../../infra/errors"
import { UserRepository } from "../db/repositories/users"
import type { AppEnv } from "../types"

/** Sets "today" for a user whose device hasn't reported a zone yet (ADR 0046). */
export const DEFAULT_TIME_ZONE = "America/Sao_Paulo"

export type UserSettings = {
  heightCm: number | null
  timeZone: string
}

/** The signed-in user's height and the zone that sets their "today" and current week. */
export async function getUserSettings(
  c: Context<AppEnv>,
): Promise<UserSettings> {
  const user = await new UserRepository(c.env.DB).getById(c.get("userId"))

  if (!user) {
    throw new UnauthorizedError()
  }

  return {
    heightCm: user.heightCm,
    timeZone: user.timeZone ?? DEFAULT_TIME_ZONE,
  }
}
