import { NotFoundError, ValidationError } from "../../../infra/errors"
import { isWithinMeasurementLimit, normalizeNotes } from "./domain/measurement"
import type { MeasurementInput } from "../../../types/measurements"

type ErrorDetails = {
  action: string
  message: string
}

type MeasurementInputResult =
  | {
      measurement: MeasurementInput
      valid: true
    }
  | {
      code: "INVALID_MEASUREMENT_INPUT"
      valid: false
    }

type MeasurementListQueryResult =
  | {
      query: {
        from?: string
        limit?: number
        offset?: number
        to?: string
      }
      valid: true
    }
  | {
      code: "INVALID_MEASUREMENTS_QUERY"
      valid: false
    }

type ValidationErrorCode =
  | "INVALID_DATE"
  | "INVALID_MEASUREMENT_ID"
  | "INVALID_MEASUREMENT_INPUT"
  | "INVALID_MEASUREMENTS_QUERY"

type NotFoundErrorCode = "MEASUREMENT_NOT_FOUND"

const VALIDATION_ERROR_DETAILS: Record<ValidationErrorCode, ErrorDetails> = {
  INVALID_DATE: {
    action: "Use uma data no formato YYYY-MM-DD.",
    message: "Data inválida.",
  },
  INVALID_MEASUREMENT_ID: {
    action: "Atualize o histórico e tente novamente.",
    message: "Identificador da medida inválido.",
  },
  INVALID_MEASUREMENT_INPUT: {
    action: "Revise os campos da medida e tente novamente.",
    message: "Dados da medida inválidos.",
  },
  INVALID_MEASUREMENTS_QUERY: {
    action: "Revise os filtros de listagem e tente novamente.",
    message: "Parâmetros de listagem inválidos.",
  },
}

const NOT_FOUND_ERROR_DETAILS: Record<NotFoundErrorCode, ErrorDetails> = {
  MEASUREMENT_NOT_FOUND: {
    action: "Atualize o histórico e tente novamente.",
    message: "Medida não encontrada.",
  },
}

export function createValidationError(
  code: ValidationErrorCode,
): ValidationError {
  return new ValidationError(VALIDATION_ERROR_DETAILS[code])
}

export function createNotFoundError(code: NotFoundErrorCode): NotFoundError {
  return new NotFoundError(NOT_FOUND_ERROR_DETAILS[code])
}

export function createCsvImportValidationError(summary: {
  errors: Array<{
    message: string
    row: number
  }>
}): ValidationError {
  const firstError = summary.errors[0]
  const firstErrorMessage = firstError?.message.replace(/\.+$/, "")

  return new ValidationError({
    action: firstErrorMessage
      ? `Corrija a linha ${firstError.row}: ${firstErrorMessage}.`
      : "Revise o arquivo CSV e tente novamente.",
    message: "Nenhum registro foi importado.",
  })
}

export function parseMeasurementInput(body: unknown): MeasurementInputResult {
  const invalid = { code: "INVALID_MEASUREMENT_INPUT", valid: false } as const

  if (!isRecord(body) || !isFiniteNumber(body.weightKg)) {
    return invalid
  }

  const bodyFatPercentage = parseOptionalFiniteNumber(body.bodyFatPercentage)
  const musclePercentage = parseOptionalFiniteNumber(body.musclePercentage)
  const restingMetabolismKcal = parseOptionalFiniteNumber(
    body.restingMetabolismKcal,
  )
  const waistCm = parseOptionalFiniteNumber(body.waistCm)
  const sleepHours = parseOptionalFiniteNumber(body.sleepHours)
  const disposition = parseOptionalFiniteNumber(body.disposition)
  const notes = parseOptionalNotes(body.notes)

  if (
    bodyFatPercentage === undefined ||
    musclePercentage === undefined ||
    restingMetabolismKcal === undefined ||
    waistCm === undefined ||
    sleepHours === undefined ||
    disposition === undefined ||
    notes === undefined
  ) {
    return invalid
  }

  const limitedValues = {
    weightKg: body.weightKg,
    bodyFatPercentage,
    musclePercentage,
    restingMetabolismKcal,
    waistCm,
    sleepHours,
    disposition,
  }
  const isOutOfLimits = Object.entries(limitedValues).some(
    ([field, value]) =>
      value !== null &&
      !isWithinMeasurementLimit(field as keyof typeof limitedValues, value),
  )

  if (isOutOfLimits) {
    return invalid
  }

  return {
    measurement: {
      bodyFatPercentage,
      musclePercentage,
      restingMetabolismKcal,
      waistCm,
      sleepHours,
      disposition,
      notes,
      weightKg: body.weightKg,
    },
    valid: true,
  }
}

export function parseMeasurementListQuery(
  query: Record<string, string>,
): MeasurementListQueryResult {
  const from = query.from
  const to = query.to
  const limit = parseOptionalNonNegativeInteger(query.limit, {
    max: 100,
    min: 1,
  })
  const offset = parseOptionalNonNegativeInteger(query.offset, {
    max: 10000,
    min: 0,
  })

  if (
    (from !== undefined && !isDateOnly(from)) ||
    (to !== undefined && !isDateOnly(to)) ||
    limit === null ||
    offset === null
  ) {
    return {
      code: "INVALID_MEASUREMENTS_QUERY",
      valid: false,
    }
  }

  return {
    query: {
      ...(from === undefined ? {} : { from }),
      ...(limit === undefined ? {} : { limit }),
      ...(offset === undefined ? {} : { offset }),
      ...(to === undefined ? {} : { to }),
    },
    valid: true,
  }
}

export function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function parseOptionalNonNegativeInteger(
  value: string | undefined,
  options: {
    max: number
    min: number
  },
): number | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!/^\d+$/.test(value)) {
    return null
  }

  const parsedValue = Number(value)

  return parsedValue >= options.min && parsedValue <= options.max
    ? parsedValue
    : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function parseOptionalFiniteNumber(value: unknown): number | null | undefined {
  if (value === null || value === undefined) {
    return null
  }

  if (!isFiniteNumber(value)) {
    return undefined
  }

  return value
}

function parseOptionalNotes(value: unknown): string | null | undefined {
  if (value === null || value === undefined) {
    return null
  }

  return typeof value === "string" ? normalizeNotes(value) : undefined
}
