import * as oauth from "oauth4webapi"

import { getGoogleClient } from "../../config"
import { createOAuthRoutes } from "./oauth-flow"

export const googleAuthRoutes = createOAuthRoutes({
  authorizationServer: {
    authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    issuer: "https://accounts.google.com",
    token_endpoint: "https://oauth2.googleapis.com/token",
  },
  // The ID token comes straight from the token endpoint over TLS, so its claims are trusted without a JWKS check (OIDC Core 3.1.3.7).
  fetchProfile: async (tokens) => {
    const claims = oauth.getValidatedIdTokenClaims(tokens)

    if (!claims) {
      throw new Error("Google answered without an ID token")
    }

    const email = typeof claims.email === "string" ? claims.email : null
    const name = typeof claims.name === "string" ? claims.name : null

    return {
      displayName: name || email || "Google",
      // Google has sent `email_verified` as both a boolean and the string "true".
      email:
        claims.email_verified === true || claims.email_verified === "true"
          ? email
          : null,
      provider: "google",
      providerUserId: claims.sub,
    }
  },
  getClient: getGoogleClient,
  id: "google",
  label: "Google",
  requireIdToken: true,
  scope: "openid email profile",
})
