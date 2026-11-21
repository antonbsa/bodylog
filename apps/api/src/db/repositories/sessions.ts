export type SessionRecord = {
  idHash: string
  userId: string
  expiresAt: string
  maxExpiresAt: string
  createdAt: string
}

type SessionRow = {
  id_hash: string
  user_id: string
  expires_at: string
  max_expires_at: string
  created_at: string
}

export class SessionRepository {
  private readonly db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  async create(session: SessionRecord): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO sessions (id_hash, user_id, expires_at, max_expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(
        session.idHash,
        session.userId,
        session.expiresAt,
        session.maxExpiresAt,
        session.createdAt,
      )
      .run()
  }

  async getByIdHash(idHash: string): Promise<SessionRecord | null> {
    const row = await this.db
      .prepare(
        "SELECT id_hash, user_id, expires_at, max_expires_at, created_at FROM sessions WHERE id_hash = ?",
      )
      .bind(idHash)
      .first<SessionRow>()

    return row
      ? {
          idHash: row.id_hash,
          userId: row.user_id,
          expiresAt: row.expires_at,
          maxExpiresAt: row.max_expires_at,
          createdAt: row.created_at,
        }
      : null
  }

  async updateExpiresAt(idHash: string, expiresAt: string): Promise<void> {
    await this.db
      .prepare("UPDATE sessions SET expires_at = ? WHERE id_hash = ?")
      .bind(expiresAt, idHash)
      .run()
  }

  async delete(idHash: string): Promise<void> {
    await this.db
      .prepare("DELETE FROM sessions WHERE id_hash = ?")
      .bind(idHash)
      .run()
  }

  /** `now` is an ISO timestamp; stored timestamps share its format, so text order is time order. */
  async deleteExpired(now: string): Promise<void> {
    await this.db
      .prepare("DELETE FROM sessions WHERE expires_at <= ?")
      .bind(now)
      .run()
  }
}
