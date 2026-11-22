import { describe, expect, it } from "vitest"

import { getTimeZoneToSync } from "../../apps/web/src/utils/time-zone-sync"

describe("getTimeZoneToSync", () => {
  it("sends the device zone when none is stored yet", () => {
    expect(getTimeZoneToSync(null, "America/Sao_Paulo")).toBe(
      "America/Sao_Paulo",
    )
  })

  it("sends the device zone when it differs from the stored one", () => {
    expect(getTimeZoneToSync("America/Sao_Paulo", "Europe/Lisbon")).toBe(
      "Europe/Lisbon",
    )
  })

  it("sends nothing when the device is in the stored zone", () => {
    expect(getTimeZoneToSync("Europe/Lisbon", "Europe/Lisbon")).toBeNull()
  })

  it("sends nothing when the device reports no zone", () => {
    expect(getTimeZoneToSync("Europe/Lisbon", undefined)).toBeNull()
    expect(getTimeZoneToSync(null, "")).toBeNull()
  })
})
