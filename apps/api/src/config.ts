import type { AppBindings } from "./types"

export function getGitHubClient(
  env: Pick<AppBindings, "GITHUB_CLIENT_ID" | "GITHUB_CLIENT_SECRET">,
): { clientId: string; clientSecret: string } {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    throw new Error(
      "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be configured",
    )
  }

  return {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  }
}

export function isDevLoginEnabled(
  env: Pick<AppBindings, "DEV_LOGIN_ENABLED">,
): boolean {
  return env.DEV_LOGIN_ENABLED === "true"
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
