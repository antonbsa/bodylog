import { createHash } from "node:crypto"

import { SESSION_COOKIE_NAME } from "../../apps/api/src/features/auth/session"
import { createSqliteD1 } from "./sqlite-d1"

const DAY_MS = 24 * 60 * 60 * 1000

export type MeasurementSeed = {
  id?: string
  date: string
  weight_kg: number
  body_fat_percentage?: number | null
  muscle_percentage?: number | null
  resting_metabolism_kcal?: number | null
  waist_cm?: number | null
  sleep_hours?: number | null
  disposition?: number | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

/** An app env over the SQLite-backed D1, with helpers that write users, sessions and measurements straight to the tables. */
export function createTestEnv(overrides: Record<string, string> = {}) {
  const { d1, sqlite } = createSqliteD1()
  const env = {
    DB: d1,
    GITHUB_CLIENT_ID: "test-client-id",
    GITHUB_CLIENT_SECRET: "test-client-secret",
    ...overrides,
  }

  function createUser(
    id: string,
    displayName = id,
    options: { heightCm?: number | null } = {},
  ) {
    sqlite
      .prepare(
        "INSERT INTO users (id, display_name, email, height_cm, created_at, updated_at) VALUES (?, ?, NULL, ?, 't', 't')",
      )
      .run(id, displayName, options.heightCm ?? null)

    return id
  }

  /** Inserts a session row for the user and returns the `cookie` header that carries it. */
  function createSession(
    userId: string,
    options: { expiresAt?: Date; maxExpiresAt?: Date; sessionId?: string } = {},
  ) {
    const now = Date.now()
    const sessionId = options.sessionId ?? `session-${crypto.randomUUID()}`

    sqlite
      .prepare(
        "INSERT INTO sessions (id_hash, user_id, expires_at, max_expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        createHash("sha256").update(sessionId).digest("hex"),
        userId,
        (options.expiresAt ?? new Date(now + 30 * DAY_MS)).toISOString(),
        (options.maxExpiresAt ?? new Date(now + 180 * DAY_MS)).toISOString(),
        new Date(now).toISOString(),
      )

    return `${SESSION_COOKIE_NAME}=${sessionId}`
  }

  /** A user with a live session, for tests that only need "someone signed in". */
  function signIn(userId = "user-a") {
    createUser(userId)

    return createSession(userId)
  }

  function insertMeasurement(userId: string, row: MeasurementSeed) {
    sqlite
      .prepare(
        `INSERT INTO measurements (id, user_id, date, weight_kg, body_fat_percentage, muscle_percentage, resting_metabolism_kcal, waist_cm, sleep_hours, disposition, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        row.id ?? `${userId}-${row.date}`,
        userId,
        row.date,
        row.weight_kg,
        row.body_fat_percentage ?? null,
        row.muscle_percentage ?? null,
        row.resting_metabolism_kcal ?? null,
        row.waist_cm ?? null,
        row.sleep_hours ?? null,
        row.disposition ?? null,
        row.notes ?? null,
        row.created_at ?? "2026-06-10T12:00:00.000Z",
        row.updated_at ?? row.created_at ?? "2026-06-10T12:00:00.000Z",
      )
  }

  function measurementRows(userId: string) {
    return sqlite
      .prepare("SELECT * FROM measurements WHERE user_id = ? ORDER BY date")
      .all(userId) as Array<Record<string, unknown>>
  }

  return {
    createSession,
    createUser,
    env,
    insertMeasurement,
    measurementRows,
    signIn,
    sqlite,
  }
}

export const SIGNED_IN_USER_ID = "user-a"
/** The cookie header every `createSignedInEnv` env accepts, since each one stores the same fixed session id. */
export const SIGNED_IN_COOKIE = `${SESSION_COOKIE_NAME}=test-session`

export const SIGNED_IN_HEIGHT_CM = 168

/** A test env with one signed-in user, 168 cm tall, owning `rows`; requests authenticate with `SIGNED_IN_COOKIE`. */
export function createSignedInEnv(rows: MeasurementSeed[] = []) {
  const testEnv = createTestEnv()

  testEnv.createUser(SIGNED_IN_USER_ID, SIGNED_IN_USER_ID, {
    heightCm: SIGNED_IN_HEIGHT_CM,
  })
  testEnv.createSession(SIGNED_IN_USER_ID, { sessionId: "test-session" })

  for (const row of rows) {
    testEnv.insertMeasurement(SIGNED_IN_USER_ID, row)
  }

  return testEnv
}
