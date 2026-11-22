import { Hono } from "hono"

import { ValidationError } from "../../../../../infra/errors"
import {
  MAX_API_TOKENS_PER_USER,
  normalizeApiTokenName,
} from "../../../../../domain/api-token"
import type {
  ApiTokenListResponse,
  CreateApiTokenResponse,
} from "../../../../../types/api-tokens"
import { ApiTokenRepository } from "../../db/repositories/api-tokens"
import { createOpaqueSecret, hashSecret } from "../../http/credentials"
import {
  createNotFoundError,
  createValidationError,
} from "../../http/request-validation"
import type { AppEnv } from "../../types"

const API_TOKEN_PREFIX = "bl_"

// Mounted behind requireSession: a personal token never manages tokens.
export const apiTokenRoutes = new Hono<AppEnv>()

apiTokenRoutes.get("/", async (c) => {
  const repository = new ApiTokenRepository(c.env.DB, c.get("userId"))
  const body: ApiTokenListResponse = { items: await repository.list() }

  return c.json(body)
})

apiTokenRoutes.post("/", async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  const rawName =
    typeof body === "object" && body !== null && "name" in body
      ? body.name
      : undefined
  const name =
    typeof rawName === "string" ? normalizeApiTokenName(rawName) : null

  if (name === null) {
    throw createValidationError("INVALID_API_TOKEN_NAME")
  }

  const token = `${API_TOKEN_PREFIX}${createOpaqueSecret()}`
  const repository = new ApiTokenRepository(c.env.DB, c.get("userId"))
  const result = await repository.create(
    { lastFour: token.slice(-4), name, tokenHash: await hashSecret(token) },
    MAX_API_TOKENS_PER_USER,
  )

  if (!result.created) {
    throw result.reason === "limit-reached"
      ? new ValidationError({
          action: "Revogue um token para criar outro.",
          message: `Você já tem ${MAX_API_TOKENS_PER_USER} tokens.`,
        })
      : createValidationError("DUPLICATE_API_TOKEN_NAME")
  }

  const response: CreateApiTokenResponse = { item: result.token, token }

  return c.json(response, 201)
})

apiTokenRoutes.delete("/:id", async (c) => {
  const repository = new ApiTokenRepository(c.env.DB, c.get("userId"))

  if (!(await repository.delete(c.req.param("id")))) {
    throw createNotFoundError("API_TOKEN_NOT_FOUND")
  }

  return c.json({ ok: true })
})
