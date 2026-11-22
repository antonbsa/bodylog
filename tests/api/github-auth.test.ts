import { afterEach, describe, expect, it, vi } from "vitest"

import { app } from "../../apps/api/src/app"
import { SESSION_COOKIE_NAME } from "../../apps/api/src/features/auth/session"
import { createTestEnv } from "./test-env"

const ORIGIN = "https://bodylog.example"
const FLOW_COOKIE = "bodylog_github_oauth"

type GitHubStub = {
  emails?: unknown
  emailsStatus?: number
  token?: unknown
  user?: unknown
}

/** Stubs the three GitHub calls the callback makes and records the token request body. */
function stubGitHub(stub: GitHubStub = {}) {
  const tokenRequests: URLSearchParams[] = []
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input)

      if (url === "https://github.com/login/oauth/access_token") {
        tokenRequests.push(new URLSearchParams(String(init?.body)))

        return Response.json(
          stub.token ?? {
            access_token: "gho_token",
            scope: "read:user,user:email",
            token_type: "bearer",
          },
        )
      }

      if (url === "https://api.github.com/user") {
        return Response.json(
          stub.user ?? { id: 4242, login: "octocat", name: "Mona Octocat" },
        )
      }

      if (url === "https://api.github.com/user/emails") {
        return Response.json(
          stub.emails ?? [
            { email: "other@example.com", primary: false, verified: true },
            { email: "mona@example.com", primary: true, verified: true },
          ],
          { status: stub.emailsStatus ?? 200 },
        )
      }

      throw new Error(`Unexpected fetch ${url}`)
    },
  )

  vi.stubGlobal("fetch", fetchMock)

  return { fetchMock, tokenRequests }
}

async function startFlow(env: ReturnType<typeof createTestEnv>["env"]) {
  const response = await app.request(`${ORIGIN}/api/auth/github`, {}, env)
  const flowValue = response.headers
    .get("set-cookie")
    ?.match(new RegExp(`${FLOW_COOKIE}=([^;]+)`))?.[1]
  const location = new URL(response.headers.get("location") ?? "")

  return {
    flowValue,
    location,
    response,
    state: location.searchParams.get("state"),
  }
}

async function callback(
  env: ReturnType<typeof createTestEnv>["env"],
  query: string,
  flowValue: string | undefined,
) {
  return app.request(
    `${ORIGIN}/api/auth/github/callback?${query}`,
    { headers: flowValue ? { cookie: `${FLOW_COOKIE}=${flowValue}` } : {} },
    env,
  )
}

/** Runs a full sign-in: start, then a callback carrying the state GitHub would echo back. */
async function signInWithGitHub(env: ReturnType<typeof createTestEnv>["env"]) {
  const { flowValue, state } = await startFlow(env)

  return callback(env, `code=good-code&state=${state}`, flowValue)
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("GET /api/auth/github", () => {
  it("redirects to GitHub with PKCE S256, the scopes and a callback on the request origin", async () => {
    const { env } = createTestEnv()
    const { flowValue, location, response } = await startFlow(env)

    expect(response.status).toBe(302)
    expect(location.origin + location.pathname).toBe(
      "https://github.com/login/oauth/authorize",
    )
    expect(Object.fromEntries(location.searchParams)).toEqual({
      client_id: "test-client-id",
      code_challenge: expect.stringMatching(/^[\w-]{43}$/),
      code_challenge_method: "S256",
      redirect_uri: `${ORIGIN}/api/auth/github/callback`,
      scope: "read:user user:email",
      state: expect.any(String),
    })
    expect(flowValue?.split(".")[0]).toBe(location.searchParams.get("state"))

    const setCookie = response.headers.get("set-cookie")

    expect(setCookie).toContain("Max-Age=600")
    expect(setCookie).toContain("Path=/api/auth/github")
    expect(setCookie).toContain("HttpOnly")
    expect(setCookie).toContain("SameSite=Lax")
  })
})

describe("GET /api/auth/github/callback", () => {
  it("creates the user on first sign-in and sets the session on a 200 page that redirects to Início", async () => {
    const { env, sqlite } = createTestEnv()
    const { tokenRequests } = stubGitHub()
    const { flowValue, state } = await startFlow(env)
    const response = await callback(
      env,
      `code=good-code&state=${state}`,
      flowValue,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("text/html")
    expect(await response.text()).toContain('content="0;url=/"')

    const cookies = response.headers.getSetCookie()

    expect(
      cookies.some((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`)),
    ).toBe(true)
    expect(
      cookies.some((cookie) => cookie.startsWith(`${FLOW_COOKIE}=;`)),
    ).toBe(true)
    expect(tokenRequests[0]?.get("code")).toBe("good-code")
    expect(tokenRequests[0]?.get("code_verifier")).toBe(
      flowValue?.split(".")[1],
    )
    expect(tokenRequests[0]?.get("redirect_uri")).toBe(
      `${ORIGIN}/api/auth/github/callback`,
    )
    expect(
      sqlite.prepare("SELECT display_name, email FROM users").all(),
    ).toEqual([{ display_name: "Mona Octocat", email: "mona@example.com" }])
    expect(
      sqlite
        .prepare(
          "SELECT provider, provider_user_id, email FROM user_identities",
        )
        .all(),
    ).toEqual([
      {
        email: "mona@example.com",
        provider: "github",
        provider_user_id: "4242",
      },
    ])

    const sessionCookie = cookies
      .find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`))
      ?.split(";")[0]
    const session = await app.request(
      "/api/auth/session",
      { headers: { cookie: sessionCookie ?? "" } },
      env,
    )

    expect(await session.json()).toEqual({
      user: {
        displayName: "Mona Octocat",
        email: "mona@example.com",
        id: expect.any(String),
      },
    })
  })

  it("returns a later sign-in to the same user with name and email refreshed", async () => {
    const { env, sqlite } = createTestEnv()

    stubGitHub()
    await signInWithGitHub(env)
    stubGitHub({
      emails: [{ email: "new@example.com", primary: true, verified: true }],
      user: { id: 4242, login: "octocat", name: null },
    })
    const response = await signInWithGitHub(env)

    expect(response.status).toBe(200)
    expect(
      sqlite.prepare("SELECT display_name, email FROM users").all(),
    ).toEqual([{ display_name: "octocat", email: "new@example.com" }])
    expect(sqlite.prepare("SELECT email FROM user_identities").all()).toEqual([
      { email: "new@example.com" },
    ])
    expect(
      sqlite.prepare("SELECT DISTINCT user_id FROM sessions").all(),
    ).toHaveLength(1)
  })

  it("signs in with a null email when the primary email is not verified", async () => {
    const { env, sqlite } = createTestEnv()

    stubGitHub({
      emails: [
        { email: "verified@example.com", primary: false, verified: true },
        { email: "mona@example.com", primary: true, verified: false },
      ],
    })
    const response = await signInWithGitHub(env)

    expect(response.status).toBe(200)
    expect(sqlite.prepare("SELECT email FROM users").get()).toEqual({
      email: null,
    })
  })

  it("sends a cancelled consent back to the login screen as declined", async () => {
    const { env, sqlite } = createTestEnv()
    const { fetchMock } = stubGitHub()
    const { flowValue, state } = await startFlow(env)
    const response = await callback(
      env,
      `error=access_denied&error_description=denied&state=${state}`,
      flowValue,
    )

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe("/?error=declined")
    expect(fetchMock).not.toHaveBeenCalled()
    expect(sqlite.prepare("SELECT * FROM sessions").all()).toEqual([])
  })

  it.each([
    [
      "a missing flow cookie",
      (state: string) => `code=c&state=${state}`,
      false,
    ],
    ["a mismatched state", () => "code=c&state=forged", true],
    ["a missing state", () => "code=c", true],
  ])(
    "answers %s with error=state and no session",
    async (_, query, withCookie) => {
      const { env, sqlite } = createTestEnv()
      const { fetchMock } = stubGitHub()
      const { flowValue, state } = await startFlow(env)
      const response = await callback(
        env,
        query(state ?? ""),
        withCookie ? flowValue : undefined,
      )

      expect(response.status).toBe(302)
      expect(response.headers.get("location")).toBe("/?error=state")
      expect(response.headers.get("set-cookie")).not.toContain(
        `${SESSION_COOKIE_NAME}=`,
      )
      expect(fetchMock).not.toHaveBeenCalled()
      expect(sqlite.prepare("SELECT * FROM users").all()).toEqual([])
    },
  )

  it("answers GitHub's 200 error body for a bad code with error=failed", async () => {
    const { env, sqlite } = createTestEnv()

    stubGitHub({
      token: {
        error: "bad_verification_code",
        error_description: "The code passed is incorrect or expired.",
      },
    })
    vi.spyOn(console, "error").mockImplementation(() => {})
    const response = await signInWithGitHub(env)

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe("/?error=failed")
    expect(sqlite.prepare("SELECT * FROM users").all()).toEqual([])
  })

  it("answers a failed profile lookup with error=failed", async () => {
    const { env, sqlite } = createTestEnv()

    stubGitHub({ emails: { message: "Bad credentials" }, emailsStatus: 401 })
    vi.spyOn(console, "error").mockImplementation(() => {})
    const response = await signInWithGitHub(env)

    expect(response.headers.get("location")).toBe("/?error=failed")
    expect(sqlite.prepare("SELECT * FROM sessions").all()).toEqual([])
  })

  it("answers a failure to store the account with error=failed instead of a JSON page", async () => {
    const { env, sqlite } = createTestEnv()

    stubGitHub()
    vi.spyOn(console, "error").mockImplementation(() => {})
    sqlite.exec("DROP TABLE user_identities")
    const response = await signInWithGitHub(env)

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe("/?error=failed")
  })

  it("logs a failed sign-in without the token response body", async () => {
    const { env } = createTestEnv()
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {})

    stubGitHub({
      token: { access_token: "gho_secret", token_type: 42 },
    })
    const response = await signInWithGitHub(env)

    expect(response.headers.get("location")).toBe("/?error=failed")
    expect(errorLog).toHaveBeenCalled()
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("gho_secret")
    expect(errorLog.mock.calls.flat().some((arg) => arg instanceof Error)).toBe(
      false,
    )
  })

  it("accepts the RFC 9207 issuer GitHub adds to the callback", async () => {
    const { env } = createTestEnv()

    stubGitHub()
    const { flowValue, state } = await startFlow(env)
    const response = await callback(
      env,
      `code=good-code&state=${state}&iss=${encodeURIComponent("https://github.com/login/oauth")}`,
      flowValue,
    )

    expect(response.status).toBe(200)
  })
})
