import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import {
  getGitHubClient,
  getGoogleClient,
  isDevLoginEnabled,
} from "../../apps/api/src/config"

describe("auth config", () => {
  it("reads the GitHub OAuth client from the environment", () => {
    expect(
      getGitHubClient({
        GITHUB_CLIENT_ID: "client-id",
        GITHUB_CLIENT_SECRET: "client-secret",
      }),
    ).toEqual({ clientId: "client-id", clientSecret: "client-secret" })
  })

  it("rejects a missing GitHub client secret", () => {
    expect(() =>
      getGitHubClient({
        GITHUB_CLIENT_ID: "client-id",
        GITHUB_CLIENT_SECRET: "",
      }),
    ).toThrow("GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be configured")
  })

  it("reads the Google OAuth client and rejects a missing secret", () => {
    expect(
      getGoogleClient({
        GOOGLE_CLIENT_ID: "client-id",
        GOOGLE_CLIENT_SECRET: "client-secret",
      }),
    ).toEqual({ clientId: "client-id", clientSecret: "client-secret" })
    expect(() =>
      getGoogleClient({
        GOOGLE_CLIENT_ID: "client-id",
        GOOGLE_CLIENT_SECRET: "",
      }),
    ).toThrow("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured")
  })

  it("enables dev login only for the exact value true", () => {
    expect(isDevLoginEnabled({ DEV_LOGIN_ENABLED: "true" })).toBe(true)
    expect(isDevLoginEnabled({ DEV_LOGIN_ENABLED: "TRUE" })).toBe(false)
    expect(isDevLoginEnabled({})).toBe(false)
  })
})

describe("wrangler assets config", () => {
  const wrangler = readFileSync("apps/api/wrangler.toml", "utf8")

  it.each(["production", "preview"])(
    "runs the Worker first for /import-format.md in %s",
    (environment) => {
      const section = wrangler
        .split(/^\[/m)
        .find((part) => part.startsWith(`env.${environment}.assets]`))

      expect(section).toMatch(
        /run_worker_first = \[[^\]]*"\/import-format\.md"/,
      )
    },
  )
})
