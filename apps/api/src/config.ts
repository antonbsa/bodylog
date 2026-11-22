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
