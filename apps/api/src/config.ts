export type AppBindings = {
  APP_PASSWORD: string
  DB: D1Database
  PRODUCTION_FRONTEND_ORIGIN?: string
  SESSION_SECRET: string
  USER_HEIGHT_CM: string
  USER_TIME_ZONE: string
}

export function getAppPassword(env: Pick<AppBindings, "APP_PASSWORD">): string {
  if (!env.APP_PASSWORD) {
    throw new Error("APP_PASSWORD must be configured")
  }

  return env.APP_PASSWORD
}

export function getSessionSecret(
  env: Pick<AppBindings, "SESSION_SECRET">,
): string {
  if (!env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be configured")
  }

  return env.SESSION_SECRET
}

export function getUserHeightCm(
  env: Pick<AppBindings, "USER_HEIGHT_CM">,
): number {
  const heightCm = Number(env.USER_HEIGHT_CM)

  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    throw new Error("USER_HEIGHT_CM must be a positive number in centimeters")
  }

  return heightCm
}

export function getUserTimeZone(
  env: Pick<AppBindings, "USER_TIME_ZONE">,
): string {
  if (!env.USER_TIME_ZONE) {
    throw new Error("USER_TIME_ZONE must be configured")
  }

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: env.USER_TIME_ZONE,
    }).format()
  } catch {
    throw new Error("USER_TIME_ZONE must be a valid IANA time zone")
  }

  return env.USER_TIME_ZONE
}

export function getFrontendOrigin(
  env: Pick<AppBindings, "PRODUCTION_FRONTEND_ORIGIN">,
): string | null {
  if (!env.PRODUCTION_FRONTEND_ORIGIN) {
    return null
  }

  try {
    const url = new URL(env.PRODUCTION_FRONTEND_ORIGIN)

    if (url.origin !== env.PRODUCTION_FRONTEND_ORIGIN) {
      throw new Error(
        "PRODUCTION_FRONTEND_ORIGIN must be an origin without a path",
      )
    }

    return url.origin
  } catch {
    throw new Error("PRODUCTION_FRONTEND_ORIGIN must be a valid URL origin")
  }
}
