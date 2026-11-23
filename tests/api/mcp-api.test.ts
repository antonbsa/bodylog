import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/app"
import { buildImportAgentPrompt } from "../../domain/import-agent-prompt"
import { renderImportFormat } from "../../apps/api/src/features/import-format/render-import-format"
import { collectorMeasurementsOutputSchema } from "../../apps/api/src/features/mcp/server"
import type {
  ApiTokenListResponse,
  CreateApiTokenResponse,
} from "../../types/api-tokens"
import type { CollectorMeasurementsResponse } from "../../types/measurements"
import { createTestEnv } from "./test-env"

type ToolResult = {
  content: { text: string; type: string }[]
  isError?: boolean
  structuredContent?: CollectorMeasurementsResponse
}

/** Legacy (2025) clients get the JSON-RPC message as one SSE `data:` frame; modern ones get plain JSON. */
async function readRpc<T>(response: Response) {
  const text = await response.text()
  const data = text.startsWith("{")
    ? text
    : text
        .split("\n")
        .find((line) => line.startsWith("data:"))!
        .slice(5)

  return JSON.parse(data) as T
}

/** Ana (180 cm) and Bia each own measurements and one token. */
async function setup() {
  const testEnv = createTestEnv()

  testEnv.createUser("ana", "Ana", { heightCm: 180 })
  testEnv.createUser("bia", "Bia")
  const anaCookie = testEnv.createSession("ana")
  const biaCookie = testEnv.createSession("bia")

  for (const [date, weight] of [
    ["2026-06-12", 72.4],
    ["2026-06-10", 72.9],
    ["2026-06-11", 72.6],
  ] as const) {
    testEnv.insertMeasurement("ana", { date, weight_kg: weight })
  }

  testEnv.insertMeasurement("bia", { date: "2026-06-11", weight_kg: 60 })

  const createToken = async (cookie: string) =>
    (await (
      await app.request(
        "/api/tokens",
        {
          body: JSON.stringify({ name: "Agente" }),
          headers: { cookie, "content-type": "application/json" },
          method: "POST",
        },
        testEnv.env,
      )
    ).json()) as CreateApiTokenResponse

  const anaToken = await createToken(anaCookie)
  const biaToken = await createToken(biaCookie)

  const rpc = (
    headers: Record<string, string>,
    method: string,
    params: unknown = {},
  ) =>
    app.request(
      "/mcp",
      {
        body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
        headers: {
          accept: "application/json, text/event-stream",
          "content-type": "application/json",
          ...headers,
        },
        method: "POST",
      },
      testEnv.env,
    )

  const callTool = async (
    token: string,
    args: Record<string, unknown> = {},
  ) => {
    const response = await rpc(bearer(token), "tools/call", {
      arguments: args,
      name: "list_measurements",
    })
    const body = await readRpc<{ result: ToolResult }>(response)

    return body.result
  }

  const collect = async (token: string, query = "") =>
    (await (
      await app.request(
        `/api/collector/measurements${query}`,
        { headers: bearer(token) },
        testEnv.env,
      )
    ).json()) as CollectorMeasurementsResponse

  return { ...testEnv, anaCookie, anaToken, biaToken, callTool, collect, rpc }
}

const bearer = (token: string) => ({ authorization: `Bearer ${token}` })

describe("POST /mcp", () => {
  it("initializes the server with its pt-BR title", async () => {
    const { anaToken, rpc } = await setup()
    const response = await rpc(bearer(anaToken.token), "initialize", {
      capabilities: {},
      clientInfo: { name: "test", version: "1" },
      protocolVersion: "2025-06-18",
    })
    const body = await readRpc<{
      result: { serverInfo: { name: string; title: string } }
    }>(response)

    expect(response.status).toBe(200)
    expect(body.result.serverInfo).toMatchObject({
      name: "bodylog",
      title: "BodyLog",
    })
  })

  it("lists list_measurements with its input and output schemas", async () => {
    const { anaToken, rpc } = await setup()
    const body = await readRpc<{
      result: {
        tools: {
          annotations?: { readOnlyHint?: boolean }
          inputSchema: { properties: Record<string, unknown> }
          name: string
          outputSchema?: unknown
          title: string
        }[]
      }
    }>(await rpc(bearer(anaToken.token), "tools/list"))

    expect(body.result.tools).toHaveLength(1)
    expect(body.result.tools[0]).toMatchObject({
      annotations: { readOnlyHint: true },
      name: "list_measurements",
      title: "Listar medidas",
    })
    expect(Object.keys(body.result.tools[0].inputSchema.properties)).toEqual([
      "from",
      "to",
    ])
    expect(body.result.tools[0].outputSchema).toBeDefined()
  })

  it("returns the owner's measurements in date order, equal to the HTTP collector", async () => {
    const { anaToken, callTool, collect } = await setup()
    const result = await callTool(anaToken.token)

    expect(result.isError).toBeUndefined()
    expect(result.structuredContent?.items.map((item) => item.date)).toEqual([
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
    ])
    expect(result.structuredContent).toEqual(await collect(anaToken.token))
    expect(JSON.parse(result.content[0].text)).toEqual(result.structuredContent)
  })

  it("filters by an inclusive date range", async () => {
    const { anaToken, callTool, collect } = await setup()
    const result = await callTool(anaToken.token, {
      from: "2026-06-11",
      to: "2026-06-12",
    })

    expect(result.structuredContent?.filters).toEqual({
      from: "2026-06-11",
      to: "2026-06-12",
    })
    expect(result.structuredContent?.count).toBe(2)
    expect(result.structuredContent).toEqual(
      await collect(anaToken.token, "?from=2026-06-11&to=2026-06-12"),
    )
  })

  it("answers an invalid date with a pt-BR tool error, not a protocol error", async () => {
    const { anaToken, callTool } = await setup()
    const result = await callTool(anaToken.token, { from: "11/06/2026" })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain("Data inválida.")
  })

  it("accepts a real collector response in its output schema", async () => {
    const { anaToken, collect } = await setup()

    expect(
      collectorMeasurementsOutputSchema.safeParse(await collect(anaToken.token))
        .success,
    ).toBe(true)
  })

  it("rejects a wrong, missing or non-bearer token with the standard 401 body", async () => {
    const { anaToken, rpc } = await setup()

    for (const headers of [
      bearer("bl_wrong"),
      {},
      { authorization: `Basic ${anaToken.token}` },
    ]) {
      const response = await rpc(headers, "tools/list")

      expect(response.status).toBe(401)
      expect(response.headers.get("www-authenticate")).toBeNull()
      expect(await response.json()).toMatchObject({
        message: "Token de API inválido ou ausente.",
        name: "UnauthorizedError",
      })
    }
  })

  it("rejects a revoked token", async () => {
    const { anaCookie, anaToken, env, rpc } = await setup()

    await app.request(
      `/api/tokens/${anaToken.item.id}`,
      { headers: { cookie: anaCookie }, method: "DELETE" },
      env,
    )

    expect((await rpc(bearer(anaToken.token), "tools/list")).status).toBe(401)
  })

  it("does not accept the session cookie alone", async () => {
    const { anaCookie, rpc } = await setup()

    expect((await rpc({ cookie: anaCookie }, "tools/list")).status).toBe(401)
  })

  it("records the last use, which the token list then shows", async () => {
    const { anaCookie, anaToken, env, rpc } = await setup()
    const before = Date.now()

    await rpc(bearer(anaToken.token), "tools/list")

    const list = (await (
      await app.request("/api/tokens", { headers: { cookie: anaCookie } }, env)
    ).json()) as ApiTokenListResponse
    const lastUsedAt = list.items[0].lastUsedAt

    expect(lastUsedAt).not.toBeNull()
    expect(Date.parse(lastUsedAt!)).toBeGreaterThanOrEqual(before)
  })
})

describe("GET /mcp", () => {
  it("is answered by the SDK as an unsupported method with a valid token, and 401 without one", async () => {
    const { anaToken, env } = await setup()
    const withToken = await app.request(
      "/mcp",
      { headers: bearer(anaToken.token) },
      env,
    )
    const withoutToken = await app.request("/mcp", {}, env)

    expect(withToken.status).toBe(405)
    expect(withoutToken.status).toBe(401)
  })
})

describe("import format resource and prompt", () => {
  it("lists and reads the import format as Markdown, the same as /import-format.md", async () => {
    const { anaToken, env, rpc } = await setup()
    const list = await readRpc<{
      result: { resources: { mimeType: string; uri: string }[] }
    }>(await rpc(bearer(anaToken.token), "resources/list"))
    const read = await readRpc<{
      result: { contents: { mimeType: string; text: string; uri: string }[] }
    }>(
      await rpc(bearer(anaToken.token), "resources/read", {
        uri: "bodylog://import-format",
      }),
    )
    const page = await app.request("/import-format.md", {}, env)

    expect(list.result.resources).toEqual([
      expect.objectContaining({
        mimeType: "text/markdown",
        uri: "bodylog://import-format",
      }),
    ])
    expect(read.result.contents[0]).toMatchObject({
      mimeType: "text/markdown",
      uri: "bodylog://import-format",
    })
    expect(read.result.contents[0].text).toBe(renderImportFormat())
    expect(read.result.contents[0].text).toBe(await page.text())
  })

  it("lists convert_spreadsheet and returns the shared text with the format embedded", async () => {
    const { anaToken, rpc } = await setup()
    const list = await readRpc<{
      result: { prompts: { name: string; title: string }[] }
    }>(await rpc(bearer(anaToken.token), "prompts/list"))
    const get = await readRpc<{
      result: {
        messages: {
          content: { resource?: { text: string; uri: string }; text?: string }
          role: string
        }[]
      }
    }>(
      await rpc(bearer(anaToken.token), "prompts/get", {
        name: "convert_spreadsheet",
      }),
    )
    const [instructions, format] = get.result.messages

    expect(list.result.prompts).toEqual([
      expect.objectContaining({
        name: "convert_spreadsheet",
        title: "Converter planilha",
      }),
    ])
    expect(instructions.role).toBe("user")
    expect(instructions.content.text).toBe(
      buildImportAgentPrompt("do formato de importação incluído abaixo"),
    )
    expect(format.content.resource).toMatchObject({
      text: renderImportFormat(),
      uri: "bodylog://import-format",
    })
  })

  it("requires a token for resources and prompts", async () => {
    const { rpc } = await setup()

    expect((await rpc({}, "resources/list")).status).toBe(401)
    expect((await rpc({}, "prompts/list")).status).toBe(401)
  })
})
