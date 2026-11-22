import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import * as oauth from "oauth4webapi"

import {
  type ProviderProfile,
  UserRepository,
} from "../../db/repositories/users"
import type { AppBindings, AppEnv } from "../../types"
import { getCookieSecurityOptions, startSession } from "./session"

const FLOW_MAX_AGE_SECONDS = 10 * 60

type SignInError = "declined" | "failed" | "state"

/** What differs between OAuth providers; the flow, cookies and callback outcomes are shared. */
export type OAuthProvider = {
  /** Path segment under `/api/auth` and the `user_identities.provider` value. */
  id: string
  label: string
  authorizationServer: oauth.AuthorizationServer
  scope: string
  /** Set for OpenID Connect providers, so a token response without a valid ID token is rejected. */
  requireIdToken?: boolean
  getClient: (env: AppBindings) => { clientId: string; clientSecret: string }
  fetchProfile: (
    tokens: oauth.TokenEndpointResponse,
  ) => Promise<ProviderProfile>
}

/** The callback page sets the cookie on a 200 and redirects client-side: WebKit drops a Set-Cookie on a redirect ending a cross-site chain. */
function signedInPage(): string {
  // Mirrors the web app's "Carregando..." auth check (colors from apps/web/src/styles/tokens.css) so the hand-off doesn't flash.
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="refresh" content="0;url=/">
<title>BodyLog</title>
<script>try{var t=localStorage.getItem("bodylog-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}</script>
<style>
:root{--bg:#f4f4f1;--fg-2:#5c5c57;--accent:#0969da;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#111111;--fg-2:#a6a6a6;--accent:#58a6ff;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#111111;--fg-2:#a6a6a6;--accent:#58a6ff;color-scheme:dark}
html,body{height:100%;margin:0}
body{display:grid;place-items:center;align-content:center;gap:12px;background:var(--bg);color:var(--fg-2);font:16px/1.5 "Geist",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
p{margin:0}
a{color:var(--accent);opacity:0;animation:show 0s 3s forwards}
@keyframes show{to{opacity:1}}
</style>
</head>
<body><p>Carregando...</p><a href="/">Continuar para o BodyLog</a></body>
</html>`
}

/** Routes for `GET /api/auth/<id>` (start) and `/api/auth/<id>/callback`: authorization code with PKCE. */
export function createOAuthRoutes(provider: OAuthProvider) {
  const flowCookieName = `bodylog_${provider.id}_oauth`
  const flowCookiePath = `/api/auth/${provider.id}`
  const getRedirectUri = (requestUrl: string) =>
    `${new URL(requestUrl).origin}${flowCookiePath}/callback`
  const routes = new Hono<AppEnv>()

  routes.get("/", async (c) => {
    const { clientId } = provider.getClient(c.env)
    const state = oauth.generateRandomState()
    const codeVerifier = oauth.generateRandomCodeVerifier()
    const authorizationUrl = new URL(
      provider.authorizationServer.authorization_endpoint as string,
    )

    authorizationUrl.search = new URLSearchParams({
      client_id: clientId,
      code_challenge: await oauth.calculatePKCECodeChallenge(codeVerifier),
      code_challenge_method: "S256",
      redirect_uri: getRedirectUri(c.req.url),
      response_type: "code",
      scope: provider.scope,
      state,
    }).toString()

    // Both values are base64url, so "." can't occur inside either.
    setCookie(c, flowCookieName, `${state}.${codeVerifier}`, {
      ...getCookieSecurityOptions(c.req.url),
      maxAge: FLOW_MAX_AGE_SECONDS,
      path: flowCookiePath,
    })

    return c.redirect(authorizationUrl.toString(), 302)
  })

  routes.get("/callback", async (c) => {
    const flowCookie = getCookie(c, flowCookieName)
    const [state, codeVerifier] = flowCookie?.split(".") ?? []
    const fail = (error: SignInError) => c.redirect(`/?error=${error}`, 302)

    deleteCookie(c, flowCookieName, {
      ...getCookieSecurityOptions(c.req.url),
      path: flowCookiePath,
    })

    if (!state || !codeVerifier) {
      return fail("state")
    }

    const { clientId, clientSecret } = provider.getClient(c.env)
    const client: oauth.Client = { client_id: clientId }
    let callbackParameters: URLSearchParams

    try {
      callbackParameters = oauth.validateAuthResponse(
        provider.authorizationServer,
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
        provider.authorizationServer,
        client,
        oauth.ClientSecretPost(clientSecret),
        callbackParameters,
        getRedirectUri(c.req.url),
        codeVerifier,
      )
      // A provider may answer a bad code with 200 and an `error` body (GitHub does); this throws on the missing access_token.
      const tokens = await oauth.processAuthorizationCodeResponse(
        provider.authorizationServer,
        client,
        tokenResponse,
        { requireIdToken: provider.requireIdToken },
      )

      const profile = await provider.fetchProfile(tokens)
      const user = await new UserRepository(c.env.DB).upsertFromProfile(profile)

      await startSession(c, user.id)
    } catch (error) {
      // Only name and message: oauth4webapi errors can carry the token response, access_token included, in `cause`.
      console.error(
        `${provider.label} sign-in failed`,
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : "unknown error",
      )
      return fail("failed")
    }

    c.header("cache-control", "no-store")

    return c.html(signedInPage())
  })

  return routes
}
