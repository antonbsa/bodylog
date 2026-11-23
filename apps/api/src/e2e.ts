import { Hono } from "hono"

import type { SessionResponse } from "../../../types/auth"
import { app, handleAppError, handleNotFound } from "./app"
import { MeasurementRepository } from "./db/repositories/measurements"
import { UserRepository } from "./db/repositories/users"
import { startSession } from "./features/auth/session"
import {
  createValidationError,
  isDateOnly,
  parseMeasurementInput,
} from "./http/request-validation"
import type { AppEnv, CreateMeasurementInput } from "./types"

/** Worker entry for `wrangler dev --env e2e` only: the app plus a route that seeds a fresh user, so preview and production bundles never contain it. */
const e2eApp = new Hono<AppEnv>()

e2eApp.onError(handleAppError)
e2eApp.notFound(handleNotFound)

e2eApp.post("/api/test/session", async (c) => {
  // Every item is validated before any write, so invalid input leaves no user behind.
  const measurements = parseSeedMeasurements(
    await c.req.json().catch(() => null),
  )
  const user = await new UserRepository(c.env.DB).upsertFromProfile({
    displayName: "E2E",
    email: null,
    provider: "e2e",
    providerUserId: crypto.randomUUID(),
  })
  const repository = new MeasurementRepository(c.env.DB, user.id)

  for (const measurement of measurements) {
    await repository.create(measurement)
  }

  await startSession(c, user.id)

  return c.json({ user } satisfies SessionResponse)
})

e2eApp.route("/", app)

/** The optional `measurements` of the body, each a date plus a `PUT /api/measurements/by-date/:date` body, on distinct dates. */
function parseSeedMeasurements(body: unknown): CreateMeasurementInput[] {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw createValidationError("INVALID_MEASUREMENT_INPUT")
  }

  const raw = "measurements" in body ? body.measurements : []

  if (!Array.isArray(raw)) {
    throw createValidationError("INVALID_MEASUREMENT_INPUT")
  }

  const measurements = raw.map((item): CreateMeasurementInput => {
    const date: unknown = item?.date

    if (typeof date !== "string" || !isDateOnly(date)) {
      throw createValidationError("INVALID_DATE")
    }

    const input = parseMeasurementInput(item)

    if (!input.valid) {
      throw createValidationError(input.code)
    }

    return { date, ...input.measurement }
  })

  if (
    new Set(measurements.map(({ date }) => date)).size < measurements.length
  ) {
    throw createValidationError("INVALID_MEASUREMENT_INPUT")
  }

  return measurements
}

export default e2eApp
