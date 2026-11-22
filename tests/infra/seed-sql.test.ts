import { describe, expect, it } from "vitest"

import { buildDefaultSeedMeasurements } from "../../infra/scripts/local-db/seed-data"
import { buildSeedSql } from "../../infra/scripts/local-db/seed-sql"
import { createSqliteD1 } from "../api/sqlite-d1"

const seedSql = buildSeedSql(
  buildDefaultSeedMeasurements(new Date("2026-06-11T12:00:00Z")),
  new Date("2026-06-11T12:00:00Z"),
)

function countByOwner(sqlite: ReturnType<typeof createSqliteD1>["sqlite"]) {
  return sqlite
    .prepare(
      "SELECT user_id, COUNT(*) AS count FROM measurements GROUP BY user_id",
    )
    .all()
}

describe("local seed SQL", () => {
  it("creates the dev user once and attaches every seeded row to it", () => {
    const { sqlite } = createSqliteD1()

    sqlite.exec(seedSql)
    sqlite.exec(seedSql)

    expect(
      sqlite
        .prepare(
          "SELECT provider, provider_user_id, user_id FROM user_identities",
        )
        .all(),
    ).toEqual([
      { provider: "dev", provider_user_id: "dev", user_id: "dev-seed:user" },
    ])
    expect(countByOwner(sqlite)).toEqual([
      { count: expect.any(Number), user_id: "dev-seed:user" },
    ])
  })

  it("gives the dev user it creates a height, so seeded BMI shows", () => {
    const { sqlite } = createSqliteD1()

    sqlite.exec(seedSql)

    expect(sqlite.prepare("SELECT height_cm FROM users").all()).toEqual([
      { height_cm: 180 },
    ])
  })

  it("attaches the rows to a dev user that dev-login already created", () => {
    const { sqlite } = createSqliteD1()

    sqlite.exec(`
      INSERT INTO users (id, display_name, created_at, updated_at) VALUES ('from-dev-login', 'Dev', 't', 't');
      INSERT INTO user_identities (provider, provider_user_id, user_id, created_at) VALUES ('dev', 'dev', 'from-dev-login', 't');
    `)
    sqlite.exec(seedSql)

    expect(sqlite.prepare("SELECT id FROM users").all()).toEqual([
      { id: "from-dev-login" },
    ])
    expect(countByOwner(sqlite)).toEqual([
      { count: expect.any(Number), user_id: "from-dev-login" },
    ])
  })

  it("leaves another user's measurement on a seeded date alone", () => {
    const { sqlite } = createSqliteD1()

    sqlite.exec(`
      INSERT INTO users (id, display_name, created_at, updated_at) VALUES ('ana', 'Ana', 't', 't');
      INSERT INTO measurements (id, user_id, date, weight_kg, created_at, updated_at) VALUES ('ana-1', 'ana', '2026-06-11', 55, 't', 't');
    `)
    sqlite.exec(seedSql)

    expect(
      sqlite
        .prepare("SELECT weight_kg FROM measurements WHERE id = 'ana-1'")
        .get(),
    ).toEqual({ weight_kg: 55 })
  })
})
