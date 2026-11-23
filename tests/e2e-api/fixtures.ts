import type { BrowserContext } from "@playwright/test"

import type { MeasurementInput } from "../../types/measurements"

export { expect, test } from "@playwright/test"

type SeedMeasurement = Partial<MeasurementInput> &
  Pick<MeasurementInput, "weightKg"> & { date: string }

/** Creates a fresh user owning `measurements` through the e2e Worker's test route; the session cookie lands in `context`, so its pages open signed in. */
export async function signInFreshUser(
  context: BrowserContext,
  measurements: SeedMeasurement[] = [],
) {
  const response = await context.request.post("/api/test/session", {
    data: { measurements },
  })

  if (!response.ok()) {
    throw new Error(
      `POST /api/test/session failed: ${response.status()} ${await response.text()}`,
    )
  }
}
