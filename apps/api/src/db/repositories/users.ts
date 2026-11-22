export type User = {
  id: string
  displayName: string
  email: string | null
}

/** What a provider says about the person signing in; `email` is set only when the provider verified it. */
export type ProviderProfile = {
  provider: string
  providerUserId: string
  displayName: string
  email: string | null
}

type UserRow = {
  id: string
  display_name: string
  email: string | null
}

type UserRepositoryOptions = {
  createId?: () => string
  now?: () => Date
}

export class UserRepository {
  private readonly createId: () => string
  private readonly now: () => Date

  constructor(
    private readonly db: D1Database,
    options: UserRepositoryOptions = {},
  ) {
    this.createId = options.createId ?? (() => crypto.randomUUID())
    this.now = options.now ?? (() => new Date())
  }

  async getById(id: string): Promise<User | null> {
    const row = await this.db
      .prepare("SELECT id, display_name, email FROM users WHERE id = ?")
      .bind(id)
      .first<UserRow>()

    return row ? mapUserRow(row) : null
  }

  /** Returns the identity's user with its display name and email refreshed, creating both on first sign-in. */
  async upsertFromProfile(profile: ProviderProfile): Promise<User> {
    const timestamp = this.now().toISOString()
    const existing = await this.db
      .prepare(
        "SELECT user_id FROM user_identities WHERE provider = ? AND provider_user_id = ?",
      )
      .bind(profile.provider, profile.providerUserId)
      .first<{ user_id: string }>()

    if (existing) {
      await this.db.batch([
        this.db
          .prepare(
            "UPDATE users SET display_name = ?, email = ?, updated_at = ? WHERE id = ?",
          )
          .bind(
            profile.displayName,
            profile.email,
            timestamp,
            existing.user_id,
          ),
        this.db
          .prepare(
            "UPDATE user_identities SET email = ? WHERE provider = ? AND provider_user_id = ?",
          )
          .bind(profile.email, profile.provider, profile.providerUserId),
      ])

      return {
        id: existing.user_id,
        displayName: profile.displayName,
        email: profile.email,
      }
    }

    const id = this.createId()

    await this.db.batch([
      this.db
        .prepare(
          "INSERT INTO users (id, display_name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(id, profile.displayName, profile.email, timestamp, timestamp),
      this.db
        .prepare(
          "INSERT INTO user_identities (provider, provider_user_id, user_id, email, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(
          profile.provider,
          profile.providerUserId,
          id,
          profile.email,
          timestamp,
        ),
    ])

    return { id, displayName: profile.displayName, email: profile.email }
  }
}

function mapUserRow(row: UserRow): User {
  return { id: row.id, displayName: row.display_name, email: row.email }
}
