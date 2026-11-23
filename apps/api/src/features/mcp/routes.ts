import { createMcpHandler } from "@modelcontextprotocol/server"
import { Hono } from "hono"

import { requireApiToken } from "../../http/require-api-token"
import type { AppEnv } from "../../types"
import { createMcpServer } from "./server"

export const mcpRoutes = new Hono<AppEnv>()

// Every method goes through the token check first; the SDK then answers non-POST requests itself.
mcpRoutes.all("/mcp", requireApiToken, (c) => {
  const handler = createMcpHandler(() =>
    createMcpServer(c.env.DB, c.get("userId")),
  )

  return handler.fetch(c.req.raw)
})
