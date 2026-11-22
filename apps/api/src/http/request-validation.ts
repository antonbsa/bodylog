import { NotFoundError, ValidationError } from "../../../../infra/errors"
import {
  API_TOKEN_NAME_MAX_LENGTH,
  normalizeApiTokenName,
} from "../../../../domain/api-token"
import {
  isWithinHeightLimit,
  isWithinMeasurementLimit,
  normalizeNotes,
} from "../../../../domain/measurement"
import type { UpdateProfileRequest } from "../../../../types/auth"
import type { MeasurementInput } from "../../../../types/measurements"

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
  | "DUPLICATE_API_TOKEN_NAME"
  | "INVALID_API_TOKEN_NAME"
  | "INVALID_DATE"
  | "INVALID_MEASUREMENT_ID"
  | "INVALID_MEASUREMENT_INPUT"
  | "INVALID_MEASUREMENTS_QUERY"
  | "INVALID_PROFILE_INPUT"

type NotFoundErrorCode = "API_TOKEN_NOT_FOUND" | "MEASUREMENT_NOT_FOUND"

const VALIDATION_ERROR_DETAILS: Record<ValidationErrorCode, ErrorDetails> = {
  DUPLICATE_API_TOKEN_NAME: {
    action: "Escolha outro nome para o token.",
    message: "Já existe um token com esse nome.",
  },
  INVALID_API_TOKEN_NAME: {
    action: `Use um nome de 1 a ${API_TOKEN_NAME_MAX_LENGTH} caracteres.`,
    message: "Nome do token inválido.",
  },
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
  // The zone is sent by the app, never typed, so the action speaks only of the height.
  INVALID_PROFILE_INPUT: {
    action: "Revise a altura e tente novamente.",
    message: "Dados do perfil inválidos.",
  },
}

const NOT_FOUND_ERROR_DETAILS: Record<NotFoundErrorCode, ErrorDetails> = {
  API_TOKEN_NOT_FOUND: {
    action: "Atualize a lista de tokens e tente novamente.",
    message: "Token não encontrado.",
  },
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

export function createCsvFileError(
  message: string,
  action = "Revise o arquivo CSV e tente novamente.",
): ValidationError {
  return new ValidationError({ action, message })
}

export function createCsvInvalidRowsError(
  invalidRows: number,
): ValidationError {
  return new ValidationError({
    action: "Corrija o arquivo ou pule as linhas inválidas na importação.",
    message:
      invalidRows === 1
        ? "O arquivo tem 1 linha inválida. Nenhuma medida foi importada."
        : `O arquivo tem ${invalidRows} linhas inválidas. Nenhuma medida foi importada.`,
  })
}

export function createApiTokenLimitError(maxTokens: number): ValidationError {
  return new ValidationError({
    action: "Revogue um token para criar outro.",
    message: `Você já tem ${maxTokens} tokens.`,
  })
}

/** The normalized `name` of a `POST /api/tokens` body, or null when it is missing or invalid. */
export function parseApiTokenName(body: unknown): string | null {
  return isRecord(body) && typeof body.name === "string"
    ? normalizeApiTokenName(body.name)
    : null
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

/** A `PATCH /api/me` body with at least one valid field. */
export function parseProfileInput(body: unknown): UpdateProfileRequest | null {
  if (!isRecord(body) || (!("heightCm" in body) && !("timeZone" in body))) {
    return null
  }

  const update: UpdateProfileRequest = {}

  if ("heightCm" in body) {
    const { heightCm } = body

    if (
      heightCm !== null &&
      !(isFiniteNumber(heightCm) && isWithinHeightLimit(heightCm))
    ) {
      return null
    }

    update.heightCm = heightCm
  }

  if ("timeZone" in body) {
    if (!isTimeZone(body.timeZone)) {
      return null
    }

    update.timeZone = body.timeZone
  }

  return update
}

/**
 * An IANA zone name Intl accepts, refusing UTC offsets like "+03:00" even where Intl takes them.
 * Kept as sent: the app compares it with the device's own spelling, which the Worker's ICU may canonicalize differently.
 */
function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !/^[A-Za-z][\w+\-/]*$/.test(value)) {
    return false
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format()

    return true
  } catch {
    return false
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
