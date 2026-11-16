import { Hono } from "hono"

import { ValidationError } from "../../../../../infra/errors"
import { MeasurementRepository } from "../../db/repositories/measurements"
import { createCsvImportValidationError } from "../../http/request-validation"
import type { AppEnv } from "../../types"
import { serializeMeasurementsCsv } from "./csv-export"
import { importMeasurementsCsv } from "./csv-import"

export const csvExportRoutes = new Hono<AppEnv>()

csvExportRoutes.get("/csv", async (c) => {
  const repository = new MeasurementRepository(c.env.DB)
  const csv = serializeMeasurementsCsv(await repository.list())

  c.header(
    "content-disposition",
    'attachment; filename="bodylog-measurements.csv"',
  )
  c.header("content-type", "text/csv; charset=utf-8")

  return c.body(csv)
})

export const csvImportRoutes = new Hono<AppEnv>()

csvImportRoutes.post("/csv", async (c) => {
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
