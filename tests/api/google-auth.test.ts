import { afterEach, describe, expect, it, vi } from "vitest"

import { app } from "../../apps/api/src/app"
import { SESSION_COOKIE_NAME } from "../../apps/api/src/features/auth/session"
import { createTestEnv } from "./test-env"

const ORIGIN = "https://bodylog.example"

type Env = ReturnType<typeof createTestEnv>["env"]
type GoogleClaims = {
  sub?: string
  email?: string
  email_verified?: boolean
  name?: string
}
type GitHubProfile = { id: number; email: string; verified: boolean }

const base64url = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url")

/** An ID token as Google's token endpoint returns it; oauth4webapi checks its claims but not the signature, since it came over TLS from the issuer. */
function idToken(claims: GoogleClaims) {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    aud: "test-google-client-id",
    email: "mona@example.com",
    email_verified: true,
    exp: now + 3600,
    iat: now,
    iss: "https://accounts.google.com",
    name: "Mona Google",
    sub: "google-sub-1",
    ...claims,
  }

  return `${base64url({ alg: "RS256", typ: "JWT" })}.${base64url(payload)}.c2ln`
}

/** Stubs the token endpoints of both providers and GitHub's profile calls, so tests can sign in with either. */
function stubProviders(
  profiles: { google?: GoogleClaims; github?: GitHubProfile } = {},
) {
  const tokenRequests: URLSearchParams[] = []
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input)

      if (url === "https://oauth2.googleapis.com/token") {
        tokenRequests.push(new URLSearchParams(String(init?.body)))

        return Response.json({
          access_token: "ya29.token",
          expires_in: 3599,
          id_token: idToken(profiles.google ?? {}),
          scope: "openid email profile",
          token_type: "Bearer",
        })
      }

      const github = profiles.github ?? {
        email: "mona@example.com",
        id: 4242,
        verified: true,
      }

      if (url === "https://github.com/login/oauth/access_token") {
        return Response.json({ access_token: "gho", token_type: "bearer" })
      }

      if (url === "https://api.github.com/user") {
        return Response.json({ id: github.id, login: "octocat", name: null })
      }

      if (url === "https://api.github.com/user/emails") {
        return Response.json([
          { email: github.email, primary: true, verified: github.verified },
        ])
      }

      throw new Error(`Unexpected fetch ${url}`)
    },
  )

  vi.stubGlobal("fetch", fetchMock)

  return { fetchMock, tokenRequests }
}

async function startFlow(env: Env, provider: "github" | "google") {
  const response = await app.request(`${ORIGIN}/api/auth/${provider}`, {}, env)
  const flowValue = response.headers
    .get("set-cookie")
    ?.match(new RegExp(`bodylog_${provider}_oauth=([^;]+)`))?.[1]
  const location = new URL(response.headers.get("location") ?? "")

  return {
    flowValue,
    location,
    response,
    state: location.searchParams.get("state"),
  }
}

async function callback(
  env: Env,
  provider: "github" | "google",
  query: string,
  flowValue: string | undefined,
) {
  return app.request(
    `${ORIGIN}/api/auth/${provider}/callback?${query}`,
    {
      headers: flowValue
        ? { cookie: `bodylog_${provider}_oauth=${flowValue}` }
        : {},
    },
    env,
  )
}

async function signIn(env: Env, provider: "github" | "google") {
  const { flowValue, state } = await startFlow(env, provider)

  return callback(env, provider, `code=good-code&state=${state}`, flowValue)
}

function identities(sqlite: ReturnType<typeof createTestEnv>["sqlite"]) {
  return sqlite
    .prepare(
      "SELECT provider, provider_user_id, user_id, email FROM user_identities ORDER BY provider",
    )
    .all()
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("GET /api/auth/google", () => {
  it("redirects to Google with PKCE S256, the OpenID scopes and a callback on the request origin", async () => {
    const { env } = createTestEnv()
    const { flowValue, location, response } = await startFlow(env, "google")

    expect(response.status).toBe(302)
    expect(location.origin + location.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    )
    expect(Object.fromEntries(location.searchParams)).toEqual({
      client_id: "test-google-client-id",
      code_challenge: expect.stringMatching(/^[\w-]{43}$/),
      code_challenge_method: "S256",
      redirect_uri: `${ORIGIN}/api/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      state: expect.any(String),
    })
    expect(flowValue?.split(".")[0]).toBe(location.searchParams.get("state"))
    expect(response.headers.get("set-cookie")).toContain(
      "Path=/api/auth/google",
    )
  })
})

describe("GET /api/auth/google/callback", () => {
  it("creates the user on first sign-in and opens a session", async () => {
    const { env, sqlite } = createTestEnv()
    const { tokenRequests } = stubProviders()
    const { flowValue, state } = await startFlow(env, "google")
    const response = await callback(
      env,
      "google",
      `code=good-code&state=${state}`,
      flowValue,
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('content="0;url=/"')
    expect(tokenRequests[0]?.get("code_verifier")).toBe(
      flowValue?.split(".")[1],
    )
    expect(tokenRequests[0]?.get("redirect_uri")).toBe(
      `${ORIGIN}/api/auth/google/callback`,
    )

    const sessionCookie = response.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`))
      ?.split(";")[0]
    const session = await app.request(
      "/api/auth/session",
      { headers: { cookie: sessionCookie ?? "" } },
      env,
    )

    expect(await session.json()).toEqual({
      user: {
        displayName: "Mona Google",
        email: "mona@example.com",
        heightCm: null,
        id: expect.any(String),
        timeZone: null,
      },
    })
    expect(identities(sqlite)).toEqual([
      {
        email: "mona@example.com",
        provider: "google",
        provider_user_id: "google-sub-1",
        user_id: expect.any(String),
      },
    ])
  })

  it("returns a later sign-in to the same user", async () => {
    const { env, sqlite } = createTestEnv()

    stubProviders()
    await signIn(env, "google")
    stubProviders({ google: { name: "Mona Renamed" } })
    const response = await signIn(env, "google")

    expect(response.status).toBe(200)
    expect(sqlite.prepare("SELECT display_name FROM users").all()).toEqual([
      { display_name: "Mona Renamed" },
    ])
  })

  it("accepts the RFC 9207 issuer Google adds to the callback", async () => {
    const { env } = createTestEnv()

    stubProviders()
    const { flowValue, state } = await startFlow(env, "google")
    const response = await callback(
      env,
      "google",
      `code=good-code&state=${state}&iss=${encodeURIComponent("https://accounts.google.com")}`,
      flowValue,
    )

    expect(response.status).toBe(200)
  })

  it("rejects an ID token issued for another client with error=failed", async () => {
    const { env, sqlite } = createTestEnv({
      GOOGLE_CLIENT_ID: "another-client-id",
    })

    stubProviders()
    vi.spyOn(console, "error").mockImplementation(() => {})
    const response = await signIn(env, "google")

    expect(response.headers.get("location")).toBe("/?error=failed")
    expect(sqlite.prepare("SELECT * FROM users").all()).toEqual([])
  })

  it("sends a cancelled consent back to the login screen as declined", async () => {
    const { env } = createTestEnv()
    const { fetchMock } = stubProviders()
    const { flowValue, state } = await startFlow(env, "google")
    const response = await callback(
      env,
      "google",
      `error=access_denied&state=${state}`,
      flowValue,
    )

    expect(response.headers.get("location")).toBe("/?error=declined")
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("account linking by verified email", () => {
  it("opens the existing GitHub account when Google signs in with its verified email", async () => {
    const { env, sqlite } = createTestEnv()

    stubProviders()
    await signIn(env, "github")
    await signIn(env, "google")

    const [github, google] = identities(sqlite) as Array<{ user_id: string }>

    expect(sqlite.prepare("SELECT id FROM users").all()).toHaveLength(1)
    expect(google?.user_id).toBe(github?.user_id)
  })

  it("opens the existing Google account when GitHub signs in with its verified email", async () => {
    const { env, sqlite } = createTestEnv()

    stubProviders({
      github: { email: "Mona@Example.com", id: 7, verified: true },
    })
    await signIn(env, "google")
    await signIn(env, "github")

    const [github, google] = identities(sqlite) as Array<{ user_id: string }>

    expect(sqlite.prepare("SELECT id FROM users").all()).toHaveLength(1)
    expect(github?.user_id).toBe(google?.user_id)
  })

  it("creates a separate account for an unverified Google email", async () => {
    const { env, sqlite } = createTestEnv()

    stubProviders({ google: { email_verified: false } })
    await signIn(env, "github")
    await signIn(env, "google")

    const [github, google] = identities(sqlite) as Array<{
      email: string | null
      user_id: string
    }>

    expect(sqlite.prepare("SELECT id FROM users").all()).toHaveLength(2)
    expect(google?.user_id).not.toBe(github?.user_id)
    expect(google?.email).toBeNull()
  })

  it("never links a second identity of the same provider to a user", async () => {
    const { env, sqlite } = createTestEnv()

    stubProviders({ google: { sub: "google-sub-1" } })
    await signIn(env, "google")
    stubProviders({ google: { sub: "google-sub-2" } })
    await signIn(env, "google")

    expect(sqlite.prepare("SELECT id FROM users").all()).toHaveLength(2)
  })

  it("creates a separate account for an unverified GitHub email", async () => {
    const { env, sqlite } = createTestEnv()

    stubProviders({
      github: { email: "mona@example.com", id: 7, verified: false },
    })
    await signIn(env, "google")
    await signIn(env, "github")

    expect(sqlite.prepare("SELECT id FROM users").all()).toHaveLength(2)
  })
})
