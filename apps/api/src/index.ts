import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"

import {
  getAppPassword,
  getFrontendOrigin,
  getSessionSecret,
  getUserHeightCm,
  getUserTimeZone,
  type AppBindings,
} from "./config"
import {
  createSessionCookieValue,
  isValidSessionCookieValue,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "./auth/session"
import {
  getCurrentDateOnly,
  getWeeklyDashboard,
} from "./dashboard/weekly-dashboard-service"
import { importMeasurementsCsv } from "./measurements/csv-import"
import { serializeMeasurementsCsv } from "./measurements/csv-export"
import { calculateDerivedMeasurementValues } from "./measurements/derived-calculations"
import { MeasurementRepository } from "./measurements/measurement-repository"

export const app = new Hono<{ Bindings: AppBindings }>()

const corsAllowedMethods = "GET,POST,PUT,DELETE,OPTIONS"
const defaultCorsAllowedHeaders = "Content-Type"

const protectedApiRoutePrefixes = [
  "/api/measurements",
  "/api/dashboard",
  "/api/export",
  "/api/import",
]

function isProtectedApiRoute(path: string): boolean {
  return protectedApiRoutePrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

function getAllowedCorsOrigin(
  requestOrigin: string | undefined,
  env: Pick<AppBindings, "PRODUCTION_FRONTEND_ORIGIN">,
): string | null {
  if (!requestOrigin) {
    return null
  }

  const frontendOrigin = getFrontendOrigin(env)

  if (frontendOrigin && requestOrigin === frontendOrigin) {
    return requestOrigin
  }

  try {
    const originUrl = new URL(requestOrigin)
    const isLocalOrigin =
      originUrl.protocol === "http:" &&
      (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1")

    return isLocalOrigin ? requestOrigin : null
  } catch {
    return null
  }
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1"
}

function isSameOrChildHostname(hostname: string, parentHostname: string) {
  return hostname === parentHostname || hostname.endsWith(`.${parentHostname}`)
}

function isSameSiteFrontendOrigin(
  requestUrl: URL,
  env: Pick<AppBindings, "PRODUCTION_FRONTEND_ORIGIN">,
): boolean {
  const frontendOrigin = getFrontendOrigin(env)

  if (!frontendOrigin) {
    return false
  }

  try {
    const frontendUrl = new URL(frontendOrigin)

    return (
      requestUrl.protocol === frontendUrl.protocol &&
      (isSameOrChildHostname(requestUrl.hostname, frontendUrl.hostname) ||
        isSameOrChildHostname(frontendUrl.hostname, requestUrl.hostname))
    )
  } catch {
    return false
  }
}

function getSessionCookieSettings(
  requestUrl: URL,
  env: Pick<AppBindings, "PRODUCTION_FRONTEND_ORIGIN">,
): {
  sameSite: "Lax" | "None"
  secure: boolean
} {
  if (isLocalHostname(requestUrl.hostname)) {
    return {
      sameSite: "Lax",
      secure: false,
    }
  }

  if (isSameSiteFrontendOrigin(requestUrl, env)) {
    return {
      sameSite: "Lax",
      secure: true,
    }
  }

  return {
    sameSite: "None",
    secure: true,
  }
}

app.use("/api/*", async (c, next) => {
  const allowedOrigin = getAllowedCorsOrigin(c.req.header("origin"), c.env)

  if (allowedOrigin) {
    c.header("access-control-allow-origin", allowedOrigin)
    c.header("access-control-allow-credentials", "true")
    c.header("vary", "Origin")
  }

  if (c.req.method === "OPTIONS") {
    c.header("access-control-allow-methods", corsAllowedMethods)
    c.header(
      "access-control-allow-headers",
      c.req.header("access-control-request-headers") ??
        defaultCorsAllowedHeaders,
    )
    c.header("access-control-max-age", "86400")

    return c.body(null, 204)
  }

  await next()
})

app.use("/api/*", async (c, next) => {
  if (isProtectedApiRoute(c.req.path)) {
    const hasValidSession = await isValidSessionCookieValue(
      getCookie(c, SESSION_COOKIE_NAME),
      getSessionSecret(c.env),
    )

    if (!hasValidSession) {
      return c.json(
        {
          error: "UNAUTHENTICATED",
          ok: false,
        },
        401,
      )
    }
  }

  await next()
  c.header("x-bodylog-api", "ok")
})

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    service: "bodylog-api",
  })
})

app.get("/api/health/d1", async (c) => {
  const row = await c.env.DB.prepare("SELECT 1 AS result").first<{
    result: number
  }>()

  return c.json({
    ok: row?.result === 1,
    database: "body_metrics_tracker",
    result: row?.result ?? null,
  })
})

app.get("/api/dashboard/weekly", async (c) => {
  const repository = new MeasurementRepository(c.env.DB)
  const dashboard = await getWeeklyDashboard(repository, {
    currentDate: getCurrentDateOnly(getUserTimeZone(c.env)),
    heightCm: getUserHeightCm(c.env),
  })

  return c.json(dashboard)
})

app.get("/api/export/csv", async (c) => {
  const repository = new MeasurementRepository(c.env.DB)
  const csv = serializeMeasurementsCsv(await repository.list())

  c.header(
    "content-disposition",
    'attachment; filename="bodylog-measurements.csv"',
  )
  c.header("content-type", "text/csv; charset=utf-8")

  return c.body(csv)
})

app.post("/api/import/csv", async (c) => {
  const body = await c.req.parseBody().catch(() => null)
  const file = body?.file

  if (!(file instanceof File)) {
    return c.json(
      {
        error: "CSV_FILE_REQUIRED",
        ok: false,
      },
      400,
    )
  }

  const repository = new MeasurementRepository(c.env.DB)
  const summary = await importMeasurementsCsv(await file.text(), repository)
  const importedCount = summary.created + summary.updated

  if (importedCount === 0 && summary.errors.length > 0) {
    return c.json(
      {
        ...summary,
        ok: false,
      },
      400,
    )
  }

  return c.json(summary)
})

app.get("/api/measurements", async (c) => {
  const query = c.req.query()
  const listQuery = parseMeasurementListQuery(query)

  if (!listQuery.ok) {
    return c.json(
      {
        error: listQuery.error,
        ok: false,
      },
      400,
    )
  }

  const repository = new MeasurementRepository(c.env.DB)
  const measurements = await repository.list(listQuery.value)
  const heightCm = getUserHeightCm(c.env)

  return c.json({
    items: measurements.map((measurement) => ({
      ...measurement,
      derived: calculateDerivedMeasurementValues(measurement, {
        heightCm,
      }),
    })),
  })
})

app.get("/api/measurements/by-date/:date", async (c) => {
  const date = c.req.param("date")

  if (!isDateOnly(date)) {
    return c.json(
      {
        error: "INVALID_DATE",
        ok: false,
      },
      400,
    )
  }

  const repository = new MeasurementRepository(c.env.DB)
  const measurement = await repository.getByDate(date)

  if (!measurement) {
    return c.json(
      {
        item: null,
      },
      404,
    )
  }

  return c.json({
    item: measurement,
  })
})

app.put("/api/measurements/by-date/:date", async (c) => {
  const date = c.req.param("date")

  if (!isDateOnly(date)) {
    return c.json(
      {
        error: "INVALID_DATE",
        ok: false,
      },
      400,
    )
  }

  const input = await parseMeasurementInput(c.req.json())

  if (!input.ok) {
    return c.json(
      {
        error: input.error,
        ok: false,
      },
      400,
    )
  }

  const repository = new MeasurementRepository(c.env.DB)
  const existingMeasurement = await repository.getByDate(date)
  const measurement = existingMeasurement
    ? await repository.updateByDate(date, input.value)
    : await repository.create({
        date,
        ...input.value,
      })

  return c.json({
    item: measurement,
  })
})

app.delete("/api/measurements/:id", async (c) => {
  const id = c.req.param("id")

  if (!id) {
    return c.json(
      {
        error: "INVALID_MEASUREMENT_ID",
        ok: false,
      },
      400,
    )
  }

  const repository = new MeasurementRepository(c.env.DB)
  const deleted = await repository.delete(id)

  if (!deleted) {
    return c.json(
      {
        error: "MEASUREMENT_NOT_FOUND",
        ok: false,
      },
      404,
    )
  }

  return c.json({
    ok: true,
  })
})

app.post("/api/auth/login", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    password?: unknown
  } | null

  if (body?.password !== getAppPassword(c.env)) {
    return c.json(
      {
        error: "INVALID_PASSWORD",
        ok: false,
      },
      401,
    )
  }

  const requestUrl = new URL(c.req.url)
  const sessionCookieSettings = getSessionCookieSettings(requestUrl, c.env)
  const sessionValue = await createSessionCookieValue(getSessionSecret(c.env))

  setCookie(c, SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: sessionCookieSettings.sameSite,
    secure: sessionCookieSettings.secure,
  })

  return c.json({
    ok: true,
  })
})

app.get("/api/auth/session", async (c) => {
  const hasValidSession = await isValidSessionCookieValue(
    getCookie(c, SESSION_COOKIE_NAME),
    getSessionSecret(c.env),
  )

  if (!hasValidSession) {
    return c.json(
      {
        authenticated: false,
      },
      401,
    )
  }

  return c.json({
    authenticated: true,
  })
})

app.post("/api/auth/logout", (c) => {
  const requestUrl = new URL(c.req.url)
  const sessionCookieSettings = getSessionCookieSettings(requestUrl, c.env)

  deleteCookie(c, SESSION_COOKIE_NAME, {
    httpOnly: true,
    path: "/",
    sameSite: sessionCookieSettings.sameSite,
    secure: sessionCookieSettings.secure,
  })

  return c.json({
    ok: true,
  })
})

export default app

type MeasurementInput = {
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  weightKg: number
}

type MeasurementInputResult =
  | {
      ok: true
      value: MeasurementInput
    }
  | {
      error: "INVALID_MEASUREMENT_INPUT"
      ok: false
    }

type MeasurementListQueryResult =
  | {
      ok: true
      value: {
        from?: string
        limit?: number
        offset?: number
        to?: string
      }
    }
  | {
      error: "INVALID_MEASUREMENTS_QUERY"
      ok: false
    }

async function parseMeasurementInput(
  bodyPromise: Promise<unknown>,
): Promise<MeasurementInputResult> {
  const body = (await bodyPromise.catch(() => null)) as Record<
    string,
    unknown
  > | null

  if (!body || !isFiniteNumber(body.weightKg)) {
    return {
      error: "INVALID_MEASUREMENT_INPUT",
      ok: false,
    }
  }

  const bodyFatPercentage = parseOptionalFiniteNumber(body.bodyFatPercentage)
  const musclePercentage = parseOptionalFiniteNumber(body.musclePercentage)
  const restingMetabolismKcal = parseOptionalFiniteNumber(
    body.restingMetabolismKcal,
  )

  if (
    bodyFatPercentage === undefined ||
    musclePercentage === undefined ||
    restingMetabolismKcal === undefined
  ) {
    return {
      error: "INVALID_MEASUREMENT_INPUT",
      ok: false,
    }
  }

  return {
    ok: true,
    value: {
      bodyFatPercentage,
      musclePercentage,
      restingMetabolismKcal,
      weightKg: body.weightKg,
    },
  }
}

function parseMeasurementListQuery(
  query: Record<string, string>,
): MeasurementListQueryResult {
  const from = query.from
  const to = query.to
  const limit = parseOptionalNonNegativeInteger(query.limit, {
    max: 100,
    min: 1,
  })
  const offset = parseOptionalNonNegativeInteger(query.offset, {
    max: 10000,
    min: 0,
  })

  if (
    (from !== undefined && !isDateOnly(from)) ||
    (to !== undefined && !isDateOnly(to)) ||
    limit === null ||
    offset === null
  ) {
    return {
      error: "INVALID_MEASUREMENTS_QUERY",
      ok: false,
    }
  }

  return {
    ok: true,
    value: {
      ...(from === undefined ? {} : { from }),
      ...(limit === undefined ? {} : { limit }),
      ...(offset === undefined ? {} : { offset }),
      ...(to === undefined ? {} : { to }),
    },
  }
}

function parseOptionalNonNegativeInteger(
  value: string | undefined,
  options: {
    max: number
    min: number
  },
): number | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!/^\d+$/.test(value)) {
    return null
  }

  const parsedValue = Number(value)

  return parsedValue >= options.min && parsedValue <= options.max
    ? parsedValue
    : null
}

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function parseOptionalFiniteNumber(value: unknown): number | null | undefined {
  if (value === null || value === undefined) {
    return null
  }

  if (!isFiniteNumber(value)) {
    return undefined
  }

  return value
}
