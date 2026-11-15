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
