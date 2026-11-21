import { describe, expect, it } from "vitest"

import {
  getGitHubClient,
  getUserHeightCm,
  getUserTimeZone,
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

  it("enables dev login only for the exact value true", () => {
    expect(isDevLoginEnabled({ DEV_LOGIN_ENABLED: "true" })).toBe(true)
    expect(isDevLoginEnabled({ DEV_LOGIN_ENABLED: "TRUE" })).toBe(false)
    expect(isDevLoginEnabled({})).toBe(false)
  })
})

describe("getUserHeightCm", () => {
  it("reads the user height from the environment in centimeters", () => {
    expect(getUserHeightCm({ USER_HEIGHT_CM: "168" })).toBe(168)
  })

  it("rejects missing or invalid height configuration", () => {
    expect(() => getUserHeightCm({ USER_HEIGHT_CM: "" })).toThrow(
      "USER_HEIGHT_CM must be a positive number in centimeters",
    )
    expect(() => getUserHeightCm({ USER_HEIGHT_CM: "0" })).toThrow(
      "USER_HEIGHT_CM must be a positive number in centimeters",
    )
    expect(() => getUserHeightCm({ USER_HEIGHT_CM: "not-a-number" })).toThrow(
      "USER_HEIGHT_CM must be a positive number in centimeters",
    )
  })
})

describe("getUserTimeZone", () => {
  it("reads the user time zone from the environment", () => {
    expect(getUserTimeZone({ USER_TIME_ZONE: "America/Sao_Paulo" })).toBe(
      "America/Sao_Paulo",
    )
  })

  it("rejects missing or invalid time zone configuration", () => {
    expect(() => getUserTimeZone({ USER_TIME_ZONE: "" })).toThrow(
      "USER_TIME_ZONE must be configured",
    )
    expect(() => getUserTimeZone({ USER_TIME_ZONE: "not-a-zone" })).toThrow(
      "USER_TIME_ZONE must be a valid IANA time zone",
    )
  })
})
