import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"

import {
  AppError,
  InternalServerError,
  UnauthorizedError,
  ValidationError,
} from "../../../infra/errors"
import {
  getAppPassword,
  getFrontendOrigin,
  getSessionSecret,
  getUserHeightCm,
  getUserTimeZone,
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
import { MeasurementRepository } from "./measurements/measurement-repository"
import {
  createCsvImportValidationError,
  createNotFoundError,
  createValidationError,
  isDateOnly,
  parseMeasurementInput,
  parseMeasurementListQuery,
} from "./request-validation"
import type { AppBindings } from "./types"

export const app = new Hono<{ Bindings: AppBindings }>()

const corsAllowedMethods = "GET,POST,PUT,DELETE,OPTIONS"
const defaultCorsAllowedHeaders = "Content-Type"

const protectedApiRoutePrefixes = [
  "/api/measurements",
  "/api/dashboard",
  "/api/export",
  "/api/import",
]

app.onError((error, c) => {
  const appError =
    error instanceof AppError
      ? error
      : new InternalServerError({ cause: error })

  return c.json(appError.toJSON(), appError.statusCode)
})

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
      throw new UnauthorizedError()
    }
  }

  await next()
})

app.get("/", (c) => {
  return c.json({
    ok: true,
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
    throw new ValidationError({
      action: "Selecione um arquivo CSV válido e tente novamente.",
      message: "Arquivo CSV obrigatório.",
    })
  }

  const repository = new MeasurementRepository(c.env.DB)
  const summary = await importMeasurementsCsv(await file.text(), repository)
  const importedCount = summary.created + summary.updated

  if (importedCount === 0 && summary.errors.length > 0) {
    throw createCsvImportValidationError(summary)
  }

  return c.json(summary)
})

app.get("/api/measurements", async (c) => {
  const query = c.req.query()
  const listQuery = parseMeasurementListQuery(query)

  if (!listQuery.valid) {
    throw createValidationError(listQuery.code)
  }

  const repository = new MeasurementRepository(c.env.DB)
  const measurements = await repository.list(listQuery.query)
  const heightCm = getUserHeightCm(c.env)

  return c.json({
    items: measurements.map((measurement) => ({
      ...measurement.toJSON(),
      derived: measurement.getDerivedValues(heightCm),
    })),
  })
})

app.get("/api/measurements/by-date/:date", async (c) => {
  const date = c.req.param("date")

  if (!isDateOnly(date)) {
    throw createValidationError("INVALID_DATE")
  }

  const repository = new MeasurementRepository(c.env.DB)
  const measurement = await repository.getByDate(date)

  if (!measurement) {
    throw createNotFoundError("MEASUREMENT_NOT_FOUND")
  }

  return c.json({
    item: measurement,
  })
})

app.put("/api/measurements/by-date/:date", async (c) => {
  const date = c.req.param("date")

  if (!isDateOnly(date)) {
    throw createValidationError("INVALID_DATE")
  }

  const body = await c.req.json().catch(() => null)
  const input = parseMeasurementInput(body)

  if (!input.valid) {
    throw createValidationError(input.code)
  }

  const repository = new MeasurementRepository(c.env.DB)
  const existingMeasurement = await repository.getByDate(date)
  const measurement = existingMeasurement
    ? await repository.updateByDate(date, input.measurement)
    : await repository.create({
        date,
        ...input.measurement,
      })

  return c.json({
    item: measurement,
  })
})

app.delete("/api/measurements/:id", async (c) => {
  const id = c.req.param("id")

  if (!id) {
    throw createValidationError("INVALID_MEASUREMENT_ID")
  }

  const repository = new MeasurementRepository(c.env.DB)
  const deleted = await repository.delete(id)

  if (!deleted) {
    throw createNotFoundError("MEASUREMENT_NOT_FOUND")
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
    throw new UnauthorizedError({
      action: "Verifique a senha configurada e tente novamente.",
      message: "Senha inválida.",
    })
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
    throw new UnauthorizedError()
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
