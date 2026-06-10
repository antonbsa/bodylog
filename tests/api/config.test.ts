import { describe, expect, it } from "vitest"

import { getUserHeightCm } from "../../apps/api/src/config"

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
