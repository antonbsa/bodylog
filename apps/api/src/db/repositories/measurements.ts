import { Measurement } from "../../domain/measurement"
import type {
  CreateMeasurementInput,
  ImportedMeasurementRow,
  UpdateMeasurementByDateInput,
} from "../../types"

type MeasurementRow = {
  id: string
  date: string
  weight_kg: number
  body_fat_percentage: number | null
  muscle_percentage: number | null
  resting_metabolism_kcal: number | null
  waist_cm: number | null
  sleep_hours: number | null
  disposition: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

type MeasurementRepositoryOptions = {
  createId?: () => string
  now?: () => Date
}

type ListMeasurementsOptions = {
  /** Exclusive upper bound, unlike the inclusive `to`. */
  before?: string
  from?: string
  limit?: number
  offset?: number
  to?: string
}

const measurementColumns = `
  id,
  date,
  weight_kg,
  body_fat_percentage,
  muscle_percentage,
  resting_metabolism_kcal,
  waist_cm,
  sleep_hours,
  disposition,
  notes,
  created_at,
  updated_at
`

const importableFieldColumns = [
  ["bodyFatPercentage", "body_fat_percentage"],
  ["musclePercentage", "muscle_percentage"],
  ["restingMetabolismKcal", "resting_metabolism_kcal"],
  ["waistCm", "waist_cm"],
  ["sleepHours", "sleep_hours"],
  ["disposition", "disposition"],
  ["notes", "notes"],
] as const

export class MeasurementRepository {
  private readonly createId: () => string
  private readonly now: () => Date

  constructor(
    private readonly db: D1Database,
    options: MeasurementRepositoryOptions = {},
  ) {
    this.createId = options.createId ?? (() => crypto.randomUUID())
    this.now = options.now ?? (() => new Date())
  }

  async create(input: CreateMeasurementInput): Promise<Measurement> {
    const timestamp = this.currentTimestamp()
    const measurement = new Measurement({
      id: this.createId(),
      date: input.date,
      weightKg: input.weightKg,
      bodyFatPercentage: input.bodyFatPercentage ?? null,
      musclePercentage: input.musclePercentage ?? null,
      restingMetabolismKcal: input.restingMetabolismKcal ?? null,
      waistCm: input.waistCm ?? null,
      sleepHours: input.sleepHours ?? null,
      disposition: input.disposition ?? null,
      notes: input.notes ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    await this.db
      .prepare(
        `
          INSERT INTO measurements (
            id,
            date,
            weight_kg,
            body_fat_percentage,
            muscle_percentage,
            resting_metabolism_kcal,
            waist_cm,
            sleep_hours,
            disposition,
            notes,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .bind(
        measurement.id,
        measurement.date,
        measurement.weightKg,
        measurement.bodyFatPercentage,
        measurement.musclePercentage,
        measurement.restingMetabolismKcal,
        measurement.waistCm,
        measurement.sleepHours,
        measurement.disposition,
        measurement.notes,
        measurement.createdAt,
        measurement.updatedAt,
      )
      .run()

    return measurement
  }

  async updateByDate(
    date: string,
    input: UpdateMeasurementByDateInput,
  ): Promise<Measurement | null> {
    await this.db
      .prepare(
        `
          UPDATE measurements
          SET
            weight_kg = ?,
            body_fat_percentage = ?,
            muscle_percentage = ?,
            resting_metabolism_kcal = ?,
            waist_cm = ?,
            sleep_hours = ?,
            disposition = ?,
            notes = ?,
            updated_at = ?
          WHERE date = ?
        `,
      )
      .bind(
        input.weightKg,
        input.bodyFatPercentage ?? null,
        input.musclePercentage ?? null,
        input.restingMetabolismKcal ?? null,
        input.waistCm ?? null,
        input.sleepHours ?? null,
        input.disposition ?? null,
        input.notes ?? null,
        this.currentTimestamp(),
        date,
      )
      .run()

    return this.getByDate(date)
  }

  async getByDate(date: string): Promise<Measurement | null> {
    const row = await this.db
      .prepare(
        `
          SELECT ${measurementColumns}
          FROM measurements
          WHERE date = ?
        `,
      )
      .bind(date)
      .first<MeasurementRow>()

    return row ? mapMeasurementRow(row) : null
  }

  async listDates(): Promise<string[]> {
    const result = await this.db
      .prepare("SELECT date FROM measurements")
      .all<{ date: string }>()

    return result.results.map((row) => row.date)
  }

  /** Writes every row in one D1 batch (a transaction), so a failure leaves the table untouched. */
  async upsertImportedBatch(rows: ImportedMeasurementRow[]): Promise<void> {
    if (rows.length === 0) {
      return
    }

    await this.db.batch(rows.map((row) => this.prepareImportedUpsert(row)))
  }

  private prepareImportedUpsert(row: ImportedMeasurementRow) {
    const fieldEntries = importableFieldColumns.flatMap(([field, column]) =>
      field in row.fields ? [{ column, value: row.fields[field] ?? null }] : [],
    )
    const columns = ["weight_kg", ...fieldEntries.map((entry) => entry.column)]
    const values = [row.weightKg, ...fieldEntries.map((entry) => entry.value)]
    // Overwrite only what the file carries: absent columns and, without a created_at column, the stored creation time stay.
    const updatedColumns = row.createdAt
      ? [...columns, "created_at", "updated_at"]
      : [...columns, "updated_at"]

    return this.db
      .prepare(
        `
          INSERT INTO measurements (id, date, ${columns.join(", ")}, created_at, updated_at)
          VALUES (${new Array(columns.length + 4).fill("?").join(", ")})
          ON CONFLICT(date) DO UPDATE SET
            ${updatedColumns.map((column) => `${column} = excluded.${column}`).join(",\n            ")}
        `,
      )
      .bind(
        this.createId(),
        row.date,
        ...values,
        row.createdAt ?? row.updatedAt,
        row.updatedAt,
      )
  }

  async list(options: ListMeasurementsOptions = {}): Promise<Measurement[]> {
    const whereClauses: string[] = []
    const bindings: Array<number | string> = []

    if (options.from) {
      whereClauses.push("date >= ?")
      bindings.push(options.from)
    }

    if (options.to) {
      whereClauses.push("date <= ?")
      bindings.push(options.to)
    }

    if (options.before) {
      whereClauses.push("date < ?")
      bindings.push(options.before)
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""
    const limitSql =
      options.limit === undefined
        ? options.offset === undefined
          ? ""
          : "LIMIT -1 OFFSET ?"
        : options.offset === undefined
          ? "LIMIT ?"
          : "LIMIT ? OFFSET ?"

    if (options.limit !== undefined) {
      bindings.push(options.limit)
    }

    if (options.offset !== undefined) {
      bindings.push(options.offset)
    }

    const result = await this.db
      .prepare(
        `
          SELECT ${measurementColumns}
          FROM measurements
          ${whereSql}
          ORDER BY date DESC
          ${limitSql}
        `,
      )
      .bind(...bindings)
      .all<MeasurementRow>()

    return result.results.map(mapMeasurementRow)
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .prepare(
        `
          DELETE FROM measurements
          WHERE id = ?
        `,
      )
      .bind(id)
      .run()

    return (result.meta.changes ?? 0) > 0
  }

  private currentTimestamp(): string {
    return this.now().toISOString()
  }
}

function mapMeasurementRow(row: MeasurementRow): Measurement {
  return new Measurement({
    id: row.id,
    date: row.date,
    weightKg: row.weight_kg,
    bodyFatPercentage: row.body_fat_percentage,
    musclePercentage: row.muscle_percentage,
    restingMetabolismKcal: row.resting_metabolism_kcal,
    waistCm: row.waist_cm,
    sleepHours: row.sleep_hours,
    disposition: row.disposition,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}
