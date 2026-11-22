import { describe, expect, it } from "vitest"

import { formatApiTokenDetails } from "../../apps/web/src/utils/api-tokens"

// Midday UTC keeps the local calendar day the same in any time zone the tests run in.
const token = {
  createdAt: "2026-11-02T12:00:00.000Z",
  id: "t1",
  lastFour: "x9Qk",
  name: "Agente",
}

describe("formatApiTokenDetails", () => {
  it("says a token that was never used has no use yet", () => {
    expect(formatApiTokenDetails({ ...token, lastUsedAt: null })).toBe(
      "•••• x9Qk · Criado em 02/11/2026 · Nunca usado",
    )
  })

  it("shows the last use date", () => {
    expect(
      formatApiTokenDetails({
        ...token,
        lastUsedAt: "2026-11-20T12:00:00.000Z",
      }),
    ).toBe("•••• x9Qk · Criado em 02/11/2026 · Último uso em 20/11/2026")
  })
})
