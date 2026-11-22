import { Hono, type Context } from "hono"

import { ValidationError } from "../../../../../infra/errors"
import { MeasurementRepository } from "../../db/repositories/measurements"
import type { AppEnv } from "../../types"
import { serializeMeasurementsCsv } from "./csv-export"
import { importMeasurementsCsv, previewMeasurementsCsv } from "./csv-import"

export const csvExportRoutes = new Hono<AppEnv>()

csvExportRoutes.get("/csv", async (c) => {
  const repository = new MeasurementRepository(c.env.DB, c.get("userId"))
  const csv = serializeMeasurementsCsv(await repository.list())

  c.header(
    "content-disposition",
    'attachment; filename="bodylog-measurements.csv"',
  )
  c.header("content-type", "text/csv; charset=utf-8")

  return c.body(csv)
})

export const csvImportRoutes = new Hono<AppEnv>()

async function readUpload(c: Context<AppEnv>) {
  const body = await c.req.parseBody().catch(() => null)
  const file = body?.file

  if (!(file instanceof File)) {
    throw new ValidationError({
      action: "Selecione um arquivo CSV válido e tente novamente.",
      message: "Arquivo CSV obrigatório.",
    })
  }

  return {
    bytes: await file.arrayBuffer(),
    skipInvalid: body?.skipInvalid === "true",
  }
}

csvImportRoutes.post("/csv/preview", async (c) => {
  const { bytes } = await readUpload(c)

  return c.json(
    await previewMeasurementsCsv(
      bytes,
      new MeasurementRepository(c.env.DB, c.get("userId")),
    ),
  )
})

csvImportRoutes.post("/csv", async (c) => {
  const { bytes, skipInvalid } = await readUpload(c)

  return c.json(
    await importMeasurementsCsv(
      bytes,
      new MeasurementRepository(c.env.DB, c.get("userId")),
      {
        skipInvalid,
      },
    ),
  )
})
