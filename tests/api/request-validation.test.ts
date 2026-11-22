import { describe, expect, it } from "vitest"

import { isDateOnly } from "../../apps/api/src/http/request-validation"

describe("isDateOnly", () => {
  it.each(["2026-02-28", "2024-02-29"])("accepts %s", (value) => {
    expect(isDateOnly(value)).toBe(true)
  })

  it.each([
    "2026-02-29",
    "2026-02-31",
    "2026-13-01",
    "2026-00-10",
    "2026-06-00",
    "11/06/2026",
  ])("rejects %s", (value) => {
    expect(isDateOnly(value)).toBe(false)
  })
})
