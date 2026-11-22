export type User = {
  id: string
  displayName: string
  email: string | null
  heightCm: number | null
  timeZone: string | null
}

/** The fields `PATCH /api/me` may change; an absent key keeps the stored value. */
export type ProfileUpdate = {
  heightCm?: number | null
  timeZone?: string
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
  height_cm: number | null
  time_zone: string | null
}

const USER_COLUMNS = "id, display_name, email, height_cm, time_zone"

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
      .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`)
      .bind(id)
      .first<UserRow>()

    return row ? mapUserRow(row) : null
  }

  async updateProfile(id: string, update: ProfileUpdate): Promise<User | null> {
    const assignments = ["updated_at = ?"]
    const values: Array<number | string | null> = [this.now().toISOString()]

    if (update.heightCm !== undefined) {
      assignments.push("height_cm = ?")
      values.push(update.heightCm)
    }

    if (update.timeZone !== undefined) {
      assignments.push("time_zone = ?")
      values.push(update.timeZone)
    }

    const row = await this.db
      .prepare(
        `UPDATE users SET ${assignments.join(", ")} WHERE id = ? RETURNING ${USER_COLUMNS}`,
      )
      .bind(...values, id)
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

      const user = await this.getById(existing.user_id)

      if (!user) {
        throw new Error(`User ${existing.user_id} vanished during sign-in`)
      }

      return user
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

    return {
      id,
      displayName: profile.displayName,
      email: profile.email,
      heightCm: null,
      timeZone: null,
    }
  }
}

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    heightCm: row.height_cm,
    timeZone: row.time_zone,
  }
}
