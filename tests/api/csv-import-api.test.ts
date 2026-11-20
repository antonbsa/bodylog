import { describe, expect, it } from "vitest"

import { app } from "../../apps/api/src/app"
import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
} from "../../apps/api/src/features/auth/session"
import { MeasurementRepository } from "../../apps/api/src/db/repositories/measurements"
import { createSqliteD1 } from "./sqlite-d1"

const baseEnv = {
  APP_PASSWORD: "correct-password",
  SESSION_SECRET: "test-session-secret",
  USER_HEIGHT_CM: "168",
  USER_TIME_ZONE: "America/Sao_Paulo",
}

const SPREADSHEET = Buffer.from(
  [
    "Data;Peso;IMC;Gordura;Músculo;Metabolismo basal;Cintura;Sono;Disposição",
    "28/6/2026;72,5;25,7;14,2;43,1;1.696;81,5;7,5;4",
    ";71,0;;;;;;;",
    "27/06/2026;;24,9;;;;;;",
    "26/06/2026;72,1;25,5;14,6;;1.650;;6-7;3",
    "25/06/2026;72;;;;;;;",
  ].join("\n"),
  "latin1",
)

function setup(
  seed: Array<{
    date: string
    notes?: string
    weight: number
    waist?: number
  }> = [],
) {
  const { d1, sqlite } = createSqliteD1()

  for (const row of seed) {
    sqlite
      .prepare(
        `INSERT INTO measurements (id, date, weight_kg, waist_cm, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`,
      )
      .run(
        `id-${row.date}`,
        row.date,
        row.weight,
        row.waist ?? null,
        row.notes ?? null,
      )
  }

  const rows = () =>
    sqlite.prepare("SELECT * FROM measurements ORDER BY date").all() as Array<
      Record<string, unknown>
    >

  return { env: { ...baseEnv, DB: d1 }, rows }
}

async function post(
  env: ReturnType<typeof setup>["env"],
  path: string,
  content: Buffer | string,
  extra: Record<string, string> = {},
) {
  const form = new FormData()

  form.append(
    "file",
    new File(
      [typeof content === "string" ? content : new Uint8Array(content)],
      "m.csv",
      { type: "text/csv" },
    ),
  )

  for (const [key, value] of Object.entries(extra)) {
    form.append(key, value)
  }

  const cookie = `${SESSION_COOKIE_NAME}=${await createSessionCookieValue(baseEnv.SESSION_SECRET)}`

  return app.request(
    path,
    { body: form, headers: { cookie }, method: "POST" },
    env,
  )
}

describe("POST /api/import/csv/preview", () => {
  it("reports the plan without writing anything", async () => {
    const { env, rows } = setup([{ date: "2026-06-28", weight: 80 }])
    const response = await post(env, "/api/import/csv/preview", SPREADSHEET)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      counts: { created: 1, invalid: 2, noMeasurement: 1, updated: 1 },
      ignoredColumns: ["IMC"],
      invalidRows: [
        { column: "Data", message: "Data obrigatória.", row: 3, value: "" },
        {
          column: "Sono",
          message: expect.stringContaining("Número inválido"),
          row: 5,
          value: "6-7",
        },
      ],
      period: { from: "2026-06-25", to: "2026-06-28" },
      updatedDates: ["2026-06-28"],
    })
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toMatchObject({ weight_kg: 80 })
  })

  it("answers file-level problems with a 400 in Portuguese", async () => {
    const { env } = setup()
    const response = await post(
      env,
      "/api/import/csv/preview",
      "Data,Gordura\n1/1/2026,10",
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      message: 'A coluna obrigatória "Peso" não foi encontrada.',
      name: "ValidationError",
    })
  })

  it("requires a session", async () => {
    const response = await app.request(
      "/api/import/csv/preview",
      { method: "POST" },
      setup().env,
    )

    expect(response.status).toBe(401)
  })
})

describe("POST /api/import/csv", () => {
  it("rejects a file with invalid rows unless skipInvalid is true, writing nothing", async () => {
    const { env, rows } = setup()
    const response = await post(env, "/api/import/csv", SPREADSHEET)

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      message:
        "O arquivo tem 2 linhas inválidas. Nenhuma medida foi importada.",
    })
    expect(rows()).toEqual([])
  })

  it("writes exactly the valid rows with skipInvalid=true", async () => {
    const { env, rows } = setup()
    const response = await post(env, "/api/import/csv", SPREADSHEET, {
      skipInvalid: "true",
    })

    expect(await response.json()).toEqual({
      created: 2,
      skippedInvalid: 2,
      updated: 0,
    })
    expect(rows().map((row) => row.date)).toEqual(["2026-06-25", "2026-06-28"])
    expect(rows()[1]).toMatchObject({
      body_fat_percentage: 14.2,
      disposition: 4,
      resting_metabolism_kcal: 1696,
      waist_cm: 81.5,
      weight_kg: 72.5,
    })
  })

  it("imports a clean file without skipInvalid", async () => {
    const { env, rows } = setup()
    const response = await post(
      env,
      "/api/import/csv",
      "date,weight_kg\n2026-06-10,72.9",
    )

    expect(await response.json()).toEqual({
      created: 1,
      skippedInvalid: 0,
      updated: 0,
    })
    expect(rows()).toHaveLength(1)
  })

  it("keeps stored fields without a column and the creation time on update", async () => {
    const { env, rows } = setup([
      { date: "2026-06-10", notes: "keep me", waist: 80, weight: 70 },
    ])
    const response = await post(
      env,
      "/api/import/csv",
      "Data,Peso,Cintura\n10/06/2026,72,",
    )

    expect(await response.json()).toEqual({
      created: 0,
      skippedInvalid: 0,
      updated: 1,
    })
    expect(rows()[0]).toMatchObject({
      created_at: "2026-01-01T00:00:00.000Z",
      id: "id-2026-06-10",
      notes: "keep me",
      waist_cm: null,
      weight_kg: 72,
    })
    expect(rows()[0]?.updated_at).not.toBe("2026-01-01T00:00:00.000Z")
  })

  it("replaces created_at and updated_at when the file carries them", async () => {
    const { env, rows } = setup([{ date: "2026-06-10", weight: 70 }])

    await post(
      env,
      "/api/import/csv",
      "date,weight_kg,created_at,updated_at\n2026-06-10,72,2026-02-01T00:00:00.000Z,2026-03-01T00:00:00.000Z",
    )

    expect(rows()[0]).toMatchObject({
      created_at: "2026-02-01T00:00:00.000Z",
      updated_at: "2026-03-01T00:00:00.000Z",
    })
  })

  it("rejects a file with nothing valid to write", async () => {
    const { env } = setup()
    const response = await post(
      env,
      "/api/import/csv",
      "date,weight_kg\n2026-06-10,",
      {
        skipInvalid: "true",
      },
    )

    expect(response.status).toBe(400)
  })
})

describe("MeasurementRepository.upsertImportedBatch", () => {
  it("writes all rows or none when one statement fails", async () => {
    const { d1, sqlite } = createSqliteD1()
    const repository = new MeasurementRepository(d1)
    const row = { date: "2026-06-10", fields: {}, updatedAt: "t", weightKg: 72 }

    // A NOT NULL violation on the second row must roll back the first.
    await expect(
      repository.upsertImportedBatch([
        row,
        { ...row, date: "2026-06-11", weightKg: null as unknown as number },
      ]),
    ).rejects.toThrow()
    expect(
      sqlite.prepare("SELECT COUNT(*) AS n FROM measurements").get(),
    ).toEqual({ n: 0 })
  })
})
