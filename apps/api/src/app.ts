import { type ErrorHandler, Hono, type NotFoundHandler } from "hono"

import {
  AppError,
  InternalServerError,
  NotFoundError,
} from "../../../infra/errors"
import { apiTokenRoutes } from "./features/api-tokens/routes"
import { authRoutes } from "./features/auth/routes"
import { collectorRoutes } from "./features/collector/routes"
import { csvExportRoutes, csvImportRoutes } from "./features/csv/routes"
import { dashboardRoutes } from "./features/dashboard/routes"
import { historyRoutes } from "./features/history/routes"
import { meRoutes } from "./features/me/routes"
import { measurementRoutes } from "./features/measurements/routes"
import { trendsRoutes } from "./features/trends/routes"
import { requireSession } from "./http/require-session"
import type { AppEnv } from "./types"

export const app = new Hono<AppEnv>()

export const handleAppError: ErrorHandler<AppEnv> = (error, c) => {
  const appError =
    error instanceof AppError
      ? error
      : new InternalServerError({ cause: error })

  return c.json(appError.toJSON(), appError.statusCode)
}

// In production only /api/* reaches the Worker (run_worker_first); other paths are static assets or the SPA.
export const handleNotFound: NotFoundHandler<AppEnv> = (c) => {
  const error = new NotFoundError({
    action: "Verifique o endereço e tente novamente.",
    message: "Rota não encontrada.",
  })

  return c.json(error.toJSON(), error.statusCode)
}

app.onError(handleAppError)
app.notFound(handleNotFound)

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
  })
})

app.route("/api/auth", authRoutes)

app.route("/api/collector", collectorRoutes)

// Guarding each prefix rather than /api/* keeps unknown /api paths a 404 instead of a 401.
const protectedApi = new Hono<AppEnv>()

for (const [prefix, routes] of [
  ["/measurements", measurementRoutes],
  ["/dashboard", dashboardRoutes],
  ["/history", historyRoutes],
  ["/trends", trendsRoutes],
  ["/export", csvExportRoutes],
  ["/import", csvImportRoutes],
  ["/me", meRoutes],
  ["/tokens", apiTokenRoutes],
] as const) {
  protectedApi.use(`${prefix}/*`, requireSession)
  protectedApi.route(prefix, routes)
}

app.route("/api", protectedApi)
