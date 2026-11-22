import { getGitHubClient } from "../../config"
import type { ProviderProfile } from "../../db/repositories/users"
import { createOAuthRoutes } from "./oauth-flow"

type GitHubUser = { id: number; login: string; name: string | null }
type GitHubEmail = { email: string; primary: boolean; verified: boolean }

async function fetchGitHubApi<T>(
  path: string,
  accessToken: string,
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${accessToken}`,
      "user-agent": "BodyLog",
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub ${path} answered ${response.status}`)
  }

  return (await response.json()) as T
}

async function fetchProfile(accessToken: string): Promise<ProviderProfile> {
  const [user, emails] = await Promise.all([
    fetchGitHubApi<GitHubUser>("/user", accessToken),
    fetchGitHubApi<GitHubEmail[]>("/user/emails", accessToken),
  ])
  const primary = emails.find((email) => email.primary)

  return {
    displayName: user.name || user.login,
    email: primary?.verified ? primary.email : null,
    provider: "github",
    providerUserId: String(user.id),
  }
}

export const githubAuthRoutes = createOAuthRoutes({
  // GitHub sends RFC 9207 `iss` on the callback; without the matching issuer, oauth4webapi rejects it.
  authorizationServer: {
    authorization_endpoint: "https://github.com/login/oauth/authorize",
    issuer: "https://github.com/login/oauth",
    token_endpoint: "https://github.com/login/oauth/access_token",
  },
  fetchProfile: (tokens) => fetchProfile(tokens.access_token),
  getClient: getGitHubClient,
  id: "github",
  label: "GitHub",
  scope: "read:user user:email",
})
