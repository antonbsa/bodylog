export type AppBindings = {
  APP_PASSWORD: string
  DB: D1Database
  SESSION_SECRET: string
  USER_HEIGHT_CM: string
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
