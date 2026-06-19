import { Measurement } from "../domain/measurement"
import type {
  CreateMeasurementInput,
  ImportedMeasurementInput,
  UpdateMeasurementByDateInput,
} from "./types"

type MeasurementRow = {
  id: string
  date: string
  weight_kg: number
  body_fat_percentage: number | null
  muscle_percentage: number | null
  resting_metabolism_kcal: number | null
  created_at: string
  updated_at: string
}

type MeasurementRepositoryOptions = {
  createId?: () => string
  now?: () => Date
}

type ListMeasurementsOptions = {
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
  created_at,
  updated_at
`

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
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .bind(
        measurement.id,
        measurement.date,
        measurement.weightKg,
        measurement.bodyFatPercentage,
        measurement.musclePercentage,
        measurement.restingMetabolismKcal,
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
            updated_at = ?
          WHERE date = ?
        `,
      )
      .bind(
        input.weightKg,
        input.bodyFatPercentage ?? null,
        input.musclePercentage ?? null,
        input.restingMetabolismKcal ?? null,
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

  async upsertImportedByDate(input: ImportedMeasurementInput): Promise<{
    measurement: Measurement
    operation: "created" | "updated"
  }> {
    const existingMeasurement = await this.getByDate(input.date)

    if (existingMeasurement) {
      await this.db
        .prepare(
          `
            UPDATE measurements
            SET
              weight_kg = ?,
              body_fat_percentage = ?,
              muscle_percentage = ?,
              resting_metabolism_kcal = ?,
              created_at = ?,
              updated_at = ?
            WHERE date = ?
          `,
        )
        .bind(
          input.weightKg,
          input.bodyFatPercentage ?? null,
          input.musclePercentage ?? null,
          input.restingMetabolismKcal ?? null,
          input.createdAt,
          input.updatedAt,
          input.date,
        )
        .run()

      const measurement = await this.getByDate(input.date)

      if (!measurement) {
        throw new Error("Imported measurement update failed")
      }

      return {
        measurement,
        operation: "updated",
      }
    }

    const measurement = new Measurement({
      id: this.createId(),
      date: input.date,
      weightKg: input.weightKg,
      bodyFatPercentage: input.bodyFatPercentage ?? null,
      musclePercentage: input.musclePercentage ?? null,
      restingMetabolismKcal: input.restingMetabolismKcal ?? null,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
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
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .bind(
        measurement.id,
        measurement.date,
        measurement.weightKg,
        measurement.bodyFatPercentage,
        measurement.musclePercentage,
        measurement.restingMetabolismKcal,
        measurement.createdAt,
        measurement.updatedAt,
      )
      .run()

    return {
      measurement,
      operation: "created",
    }
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}
