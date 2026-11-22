import type { ApiTokenSummary } from "../../../../../types/api-tokens"

export type NewApiToken = {
  name: string
  tokenHash: string
  lastFour: string
}

export type CreateApiTokenResult =
  | { created: true; token: ApiTokenSummary }
  | { created: false; reason: "limit-reached" | "duplicate-name" }

type ApiTokenRow = {
  id: string
  name: string
  last_four: string
  created_at: string
  last_used_at: string | null
}

type ApiTokenRepositoryOptions = {
  createId?: () => string
  now?: () => Date
}

/** One user's personal API tokens; every statement is scoped to that user. */
export class ApiTokenRepository {
  private readonly createId: () => string
  private readonly now: () => Date

  constructor(
    private readonly db: D1Database,
    private readonly userId: string,
    options: ApiTokenRepositoryOptions = {},
  ) {
    this.createId = options.createId ?? (() => crypto.randomUUID())
    this.now = options.now ?? (() => new Date())
  }

  async list(): Promise<ApiTokenSummary[]> {
    const { results } = await this.db
      .prepare(
        "SELECT id, name, last_four, created_at, last_used_at FROM api_tokens WHERE user_id = ? ORDER BY created_at, rowid",
      )
      .bind(this.userId)
      .all<ApiTokenRow>()

    return results.map(mapApiTokenRow)
  }

  /** Inserts only while the user is under `maxTokens` and has no token with this name, in one statement so concurrent creates can't pass the limit. */
  async create(
    token: NewApiToken,
    maxTokens: number,
  ): Promise<CreateApiTokenResult> {
    const id = this.createId()
    const createdAt = this.now().toISOString()
    const result = await this.db
      .prepare(
        `INSERT INTO api_tokens (id, user_id, name, token_hash, last_four, created_at)
         SELECT ?1, ?2, ?3, ?4, ?5, ?6
         WHERE (SELECT COUNT(*) FROM api_tokens WHERE user_id = ?2) < ?7
           AND NOT EXISTS (SELECT 1 FROM api_tokens WHERE user_id = ?2 AND name = ?3)`,
      )
      .bind(
        id,
        this.userId,
        token.name,
        token.tokenHash,
        token.lastFour,
        createdAt,
        maxTokens,
      )
      .run()

    if (result.meta.changes === 1) {
      return {
        created: true,
        token: {
          createdAt,
          id,
          lastFour: token.lastFour,
          lastUsedAt: null,
          name: token.name,
        },
      }
    }

    const count = await this.db
      .prepare("SELECT COUNT(*) AS count FROM api_tokens WHERE user_id = ?")
      .bind(this.userId)
      .first<{ count: number }>()

    return {
      created: false,
      reason:
        (count?.count ?? 0) >= maxTokens ? "limit-reached" : "duplicate-name",
    }
  }

  /** Returns false when the user has no token with this id. */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .prepare("DELETE FROM api_tokens WHERE id = ? AND user_id = ?")
      .bind(id, this.userId)
      .run()

    return result.meta.changes > 0
  }
}

function mapApiTokenRow(row: ApiTokenRow): ApiTokenSummary {
  return {
    createdAt: row.created_at,
    id: row.id,
    lastFour: row.last_four,
    lastUsedAt: row.last_used_at,
    name: row.name,
  }
}
