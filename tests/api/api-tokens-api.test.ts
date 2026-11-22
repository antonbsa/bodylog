import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/app"
import type {
  ApiTokenListResponse,
  CreateApiTokenResponse,
} from "../../types/api-tokens"
import { createTestEnv } from "./test-env"

function setup() {
  const testEnv = createTestEnv()
  const ana = testEnv.signIn("ana")
  const bia = testEnv.signIn("bia")

  const request = (
    headers: Record<string, string>,
    path: string,
    init: RequestInit = {},
  ) => app.request(path, { ...init, headers }, testEnv.env)

  const create = (cookie: string, name: unknown) =>
    request({ cookie, "content-type": "application/json" }, "/api/tokens", {
      body: JSON.stringify({ name }),
      method: "POST",
    })

  const list = async (cookie: string) =>
    (await (
      await request({ cookie }, "/api/tokens")
    ).json()) as ApiTokenListResponse

  const revoke = (cookie: string, id: string) =>
    request({ cookie }, `/api/tokens/${id}`, { method: "DELETE" })

  const tokenRows = () =>
    testEnv.sqlite
      .prepare("SELECT * FROM api_tokens ORDER BY created_at")
      .all() as Array<Record<string, unknown>>

  return { ...testEnv, ana, bia, create, list, request, revoke, tokenRows }
}

describe("POST /api/tokens", () => {
  it("returns the token once and stores only its hash", async () => {
    const { ana, create, tokenRows } = setup()
    const response = await create(ana, "  Agente  ")
    const body = (await response.json()) as CreateApiTokenResponse

    expect(response.status).toBe(201)
    expect(body.token).toMatch(/^bl_[A-Za-z0-9_-]{43}$/)
    expect(body.item).toEqual({
      createdAt: expect.any(String),
      id: expect.any(String),
      lastFour: body.token.slice(-4),
      lastUsedAt: null,
      name: "Agente",
    })

    const [row] = tokenRows()

    expect(row.token_hash).toBe(
      createHash("sha256").update(body.token).digest("hex"),
    )
    expect(Object.values(row)).not.toContain(body.token)
  })

  it.each([
    ["empty", ""],
    ["blank", "   "],
    ["longer than 50 characters", "a".repeat(51)],
    ["not a string", 42],
    ["missing", undefined],
  ])("rejects a name that is %s", async (_, name) => {
    const { ana, create, tokenRows } = setup()
    const response = await create(ana, name)

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      message: "Nome do token inválido.",
    })
    expect(tokenRows()).toEqual([])
  })

  it("accepts a name of exactly 50 characters", async () => {
    const { ana, create } = setup()

    expect((await create(ana, "a".repeat(50))).status).toBe(201)
  })

  it("rejects a name the user already has, but not one another user has", async () => {
    const { ana, bia, create } = setup()

    await create(ana, "Agente")
    const duplicate = await create(ana, " Agente ")

    expect(duplicate.status).toBe(400)
    expect(await duplicate.json()).toMatchObject({
      message: "Já existe um token com esse nome.",
    })
    expect((await create(bia, "Agente")).status).toBe(201)
  })

  it("rejects a fourth token until one is revoked", async () => {
    const { ana, create, list, revoke } = setup()

    for (const name of ["Um", "Dois", "Três"]) {
      expect((await create(ana, name)).status).toBe(201)
    }

    const fourth = await create(ana, "Quatro")

    expect(fourth.status).toBe(400)
    expect(await fourth.json()).toMatchObject({
      action: "Revogue um token para criar outro.",
      message: "Você já tem 3 tokens.",
    })

    const [first] = (await list(ana)).items

    expect((await revoke(ana, first.id)).status).toBe(200)
    expect((await create(ana, "Quatro")).status).toBe(201)
  })
})

describe("GET /api/tokens", () => {
  it("lists the caller's tokens, oldest first, never with the token itself", async () => {
    const { ana, create, request } = setup()
    const first = (await (
      await create(ana, "Agente")
    ).json()) as CreateApiTokenResponse
    const second = (await (
      await create(ana, "Planilha")
    ).json()) as CreateApiTokenResponse

    const response = await request({ cookie: ana }, "/api/tokens")
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(JSON.parse(text)).toEqual({ items: [first.item, second.item] })
    expect(text).not.toContain(first.token)
    expect(text).not.toContain(second.token)
  })
})

describe("DELETE /api/tokens/:id", () => {
  it("deletes the caller's token", async () => {
    const { ana, create, list, revoke, tokenRows } = setup()
    const { item } = (await (
      await create(ana, "Agente")
    ).json()) as CreateApiTokenResponse
    const response = await revoke(ana, item.id)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(tokenRows()).toEqual([])
    expect((await list(ana)).items).toEqual([])
  })

  it("answers 404 for an unknown id", async () => {
    const { ana, revoke } = setup()
    const response = await revoke(ana, "missing")

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({
      message: "Token não encontrado.",
    })
  })
})

describe("token management authorization", () => {
  it("requires a session, and a personal token is not one", async () => {
    const { ana, create, request } = setup()
    const { item, token } = (await (
      await create(ana, "Agente")
    ).json()) as CreateApiTokenResponse

    const anonymous: Record<string, string>[] = [
      {},
      { authorization: `Bearer ${token}` },
    ]

    for (const headers of anonymous) {
      const responses = await Promise.all([
        request(headers, "/api/tokens"),
        request(
          { ...headers, "content-type": "application/json" },
          "/api/tokens",
          { body: JSON.stringify({ name: "Outro" }), method: "POST" },
        ),
        request(headers, `/api/tokens/${item.id}`, { method: "DELETE" }),
      ])

      expect(responses.map((response) => response.status)).toEqual([
        401, 401, 401,
      ])
    }
  })
})
