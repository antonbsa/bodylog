import { describe, expect, it } from "vitest"

import {
  getAppPassword,
  getSessionSecret,
  getUserHeightCm,
  getUserTimeZone,
} from "../../apps/api/src/config"

describe("auth config", () => {
  it("reads the app password from the environment", () => {
    expect(getAppPassword({ APP_PASSWORD: "secret-password" })).toBe(
      "secret-password",
    )
  })

  it("rejects a missing app password", () => {
    expect(() => getAppPassword({ APP_PASSWORD: "" })).toThrow(
      "APP_PASSWORD must be configured",
    )
  })

  it("reads the session secret from the environment", () => {
    expect(getSessionSecret({ SESSION_SECRET: "session-secret" })).toBe(
      "session-secret",
    )
  })

  it("rejects a missing session secret", () => {
    expect(() => getSessionSecret({ SESSION_SECRET: "" })).toThrow(
      "SESSION_SECRET must be configured",
    )
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
