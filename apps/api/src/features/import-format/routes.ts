import { Hono } from "hono"

import type { AppEnv } from "../../types"
import { renderImportFormat } from "./render-import-format"

export const importFormatRoutes = new Hono<AppEnv>()

importFormatRoutes.get("/import-format.md", (c) => {
  c.header("content-type", "text/markdown; charset=utf-8")

  return c.body(renderImportFormat())
})
