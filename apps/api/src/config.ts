import type { AppBindings } from "./types"

export function getGoogleClient(
  env: Pick<AppBindings, "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET">,
): { clientId: string; clientSecret: string } {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured",
    )
  }

  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  }
}

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
