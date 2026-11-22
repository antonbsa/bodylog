import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import * as oauth from "oauth4webapi"

import { getGitHubClient } from "../../config"
import {
  type ProviderProfile,
  UserRepository,
} from "../../db/repositories/users"
import type { AppEnv } from "../../types"
import { getCookieSecurityOptions, startSession } from "./session"

const FLOW_COOKIE_NAME = "bodylog_github_oauth"
const FLOW_COOKIE_PATH = "/api/auth/github"
const FLOW_MAX_AGE_SECONDS = 10 * 60
const SCOPE = "read:user user:email"

// GitHub sends RFC 9207 `iss` on the callback; without the matching issuer, oauth4webapi rejects it.
const authorizationServer: oauth.AuthorizationServer = {
  authorization_endpoint: "https://github.com/login/oauth/authorize",
  issuer: "https://github.com/login/oauth",
  token_endpoint: "https://github.com/login/oauth/access_token",
}

type SignInError = "declined" | "failed" | "state"

type GitHubUser = { id: number; login: string; name: string | null }
type GitHubEmail = { email: string; primary: boolean; verified: boolean }

function getRedirectUri(requestUrl: string): string {
  return `${new URL(requestUrl).origin}/api/auth/github/callback`
}

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

/** The callback page sets the cookie on a 200 and redirects client-side: WebKit drops a Set-Cookie on a redirect ending a cross-site chain. */
function signedInPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/"><title>BodyLog</title></head>
<body><p><a href="/">Continuar para o BodyLog</a></p></body>
</html>`
}

export const githubAuthRoutes = new Hono<AppEnv>()

githubAuthRoutes.get("/", async (c) => {
  const { clientId } = getGitHubClient(c.env)
  const state = oauth.generateRandomState()
  const codeVerifier = oauth.generateRandomCodeVerifier()
  const authorizationUrl = new URL(
    authorizationServer.authorization_endpoint as string,
  )

  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    code_challenge: await oauth.calculatePKCECodeChallenge(codeVerifier),
    code_challenge_method: "S256",
    redirect_uri: getRedirectUri(c.req.url),
    scope: SCOPE,
    state,
  }).toString()

  // Both values are base64url, so "." can't occur inside either.
  setCookie(c, FLOW_COOKIE_NAME, `${state}.${codeVerifier}`, {
    ...getCookieSecurityOptions(c.req.url),
    maxAge: FLOW_MAX_AGE_SECONDS,
    path: FLOW_COOKIE_PATH,
  })

  return c.redirect(authorizationUrl.toString(), 302)
})

githubAuthRoutes.get("/callback", async (c) => {
  const flowCookie = getCookie(c, FLOW_COOKIE_NAME)
  const [state, codeVerifier] = flowCookie?.split(".") ?? []
  const fail = (error: SignInError) => c.redirect(`/?error=${error}`, 302)

  deleteCookie(c, FLOW_COOKIE_NAME, {
    ...getCookieSecurityOptions(c.req.url),
    path: FLOW_COOKIE_PATH,
  })

  if (!state || !codeVerifier) {
    return fail("state")
  }

  const { clientId, clientSecret } = getGitHubClient(c.env)
  const client: oauth.Client = { client_id: clientId }
  let callbackParameters: URLSearchParams

  try {
    callbackParameters = oauth.validateAuthResponse(
      authorizationServer,
      client,
      new URL(c.req.url),
      state,
    )
  } catch (error) {
    if (error instanceof oauth.AuthorizationResponseError) {
      return fail(error.error === "access_denied" ? "declined" : "failed")
    }

    return fail("state")
  }

  try {
    const tokenResponse = await oauth.authorizationCodeGrantRequest(
      authorizationServer,
      client,
      oauth.ClientSecretPost(clientSecret),
      callbackParameters,
      getRedirectUri(c.req.url),
      codeVerifier,
    )
    // GitHub answers a bad code with 200 and an `error` body; this throws on the missing access_token.
    const tokens = await oauth.processAuthorizationCodeResponse(
      authorizationServer,
      client,
      tokenResponse,
    )

    const profile = await fetchProfile(tokens.access_token)
    const user = await new UserRepository(c.env.DB).upsertFromProfile(profile)

    await startSession(c, user.id)
  } catch (error) {
    // Only name and message: oauth4webapi errors can carry the token response, access_token included, in `cause`.
    console.error(
      "GitHub sign-in failed",
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : "unknown error",
    )
    return fail("failed")
  }

  c.header("cache-control", "no-store")

  return c.html(signedInPage())
})
