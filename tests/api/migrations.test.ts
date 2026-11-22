import { readdirSync, readFileSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { describe, expect, it } from "vitest"

const migrationsDir = new URL("../../infra/migrations/", import.meta.url)

function readMigration(prefix: string): string {
  const file = readdirSync(migrationsDir).find((name) =>
    name.startsWith(prefix),
  )

  if (!file) {
    throw new Error(`Missing migration ${prefix}`)
  }

  return readFileSync(new URL(file, migrationsDir), "utf8")
}

describe("migrations", () => {
  it("adds the new nullable columns on a fresh database", () => {
    const db = new DatabaseSync(":memory:")

    db.exec(readMigration("0001"))
    db.exec(readMigration("0002"))
    db.exec(
      `INSERT INTO measurements (id, date, weight_kg, waist_cm, sleep_hours, disposition, notes, created_at, updated_at)
       VALUES ('a', '2026-06-01', 72, 80.5, 7.5, 4, 'ok', 't', 't')`,
    )

    expect(db.prepare("SELECT * FROM measurements").get()).toMatchObject({
      waist_cm: 80.5,
      sleep_hours: 7.5,
      disposition: 4,
      notes: "ok",
    })
  })

  it("keeps existing rows and reads the new columns as null", () => {
    const db = new DatabaseSync(":memory:")

    db.exec(readMigration("0001"))
    db.exec(
      `INSERT INTO measurements (id, date, weight_kg, created_at, updated_at)
       VALUES ('old', '2026-05-01', 75, 't', 't')`,
    )
    db.exec(readMigration("0002"))

    expect(db.prepare("SELECT * FROM measurements").get()).toMatchObject({
      id: "old",
      weight_kg: 75,
      waist_cm: null,
      sleep_hours: null,
      disposition: null,
      notes: null,
    })
  })
})

describe("migration 0003", () => {
  function migratedDb() {
    const db = new DatabaseSync(":memory:")

    db.exec(readMigration("0001"))
    db.exec(readMigration("0002"))
    db.exec(
      `INSERT INTO measurements (id, date, weight_kg, created_at, updated_at)
       VALUES ('ownerless', '2026-05-01', 75, 't', 't')`,
    )
    db.exec(readMigration("0003"))
    db.exec(
      `INSERT INTO users (id, display_name, created_at, updated_at)
       VALUES ('a', 'A', 't', 't'), ('b', 'B', 't', 't')`,
    )

    return db
  }

  const insert = (userId: string, id: string) =>
    `INSERT INTO measurements (id, user_id, date, weight_kg, created_at, updated_at)
     VALUES ('${id}', '${userId}', '2026-06-01', 72, 't', 't')`

  it("drops the measurements that have no owner", () => {
    expect(migratedDb().prepare("SELECT * FROM measurements").all()).toEqual([])
  })

  it("lets two users record the same date but not one user twice", () => {
    const db = migratedDb()

    db.exec(insert("a", "a1"))
    db.exec(insert("b", "b1"))

    expect(() => db.exec(insert("a", "a2"))).toThrow(/UNIQUE/)
  })

  it("requires an existing owner and deletes a user's rows with the user", () => {
    const db = migratedDb()

    expect(() => db.exec(insert("missing", "x"))).toThrow(/FOREIGN KEY/)

    db.exec(insert("a", "a1"))
    db.exec(
      `INSERT INTO sessions (id_hash, user_id, expires_at, max_expires_at, created_at)
       VALUES ('h', 'a', 't', 't', 't')`,
    )
    db.exec("DELETE FROM users WHERE id = 'a'")

    expect(db.prepare("SELECT * FROM measurements").all()).toEqual([])
    expect(db.prepare("SELECT * FROM sessions").all()).toEqual([])
  })

  it("keeps one identity per provider user", () => {
    const db = migratedDb()
    const identity = `INSERT INTO user_identities (provider, provider_user_id, user_id, created_at)
      VALUES ('github', '1', 'a', 't')`

    db.exec(identity)

    expect(() => db.exec(identity)).toThrow(/UNIQUE|PRIMARY KEY/)
  })
})
