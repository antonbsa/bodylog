export type ErrorStatusCode = 400 | 401 | 404 | 405 | 500 | 503

export type SerializedAppError = {
  action: string
  message: string
  name: string
  statusCode: ErrorStatusCode
}

export type CsvImportErrorSummary = {
  created: number
  errors: Array<{
    message: string
    row: number
  }>
  skipped: number
  updated: number
}

type ErrorFallback = {
  action: string
  message: string
}

type AppErrorOptions = {
  action?: string
  cause?: unknown
  message?: string
}

type AppErrorDefaults = {
  action: string
  message: string
  name: string
  statusCode: ErrorStatusCode
}

export class AppError extends Error {
  readonly action: string
  readonly statusCode: ErrorStatusCode

  constructor(defaults: AppErrorDefaults, options: AppErrorOptions = {}) {
    super(options.message ?? defaults.message, {
      cause: options.cause,
    })
    this.name = defaults.name
    this.action = options.action ?? defaults.action
    this.statusCode = defaults.statusCode
  }

  toJSON(): SerializedAppError {
    return {
      action: this.action,
      message: this.message,
      name: this.name,
      statusCode: this.statusCode,
    }
  }
}

export class InternalServerError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      {
        action: "Tente novamente. Se o problema continuar, revise os logs.",
        message: "Erro interno inesperado.",
        name: "InternalServerError",
        statusCode: 500,
      },
      options,
    )
  }
}

export class ServiceError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      {
        action: "Verifique se o serviço está disponível e tente novamente.",
        message: "Serviço indisponível no momento.",
        name: "ServiceError",
        statusCode: 503,
      },
      options,
    )
  }
}

export class MethodNotAllowedError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      {
        action: "Verifique se o método HTTP usado é compatível com a rota.",
        message: "Método não permitido para este endpoint.",
        name: "MethodNotAllowedError",
        statusCode: 405,
      },
      options,
    )
  }
}

export class ValidationError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      {
        action: "Revise os dados enviados e tente novamente.",
        message: "Dados inválidos.",
        name: "ValidationError",
        statusCode: 400,
      },
      options,
    )
  }
}

export class UnauthorizedError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      {
        action: "Entre novamente para continuar.",
        message: "Sessão inválida ou expirada.",
        name: "UnauthorizedError",
        statusCode: 401,
      },
      options,
    )
  }
}

export class NotFoundError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      {
        action: "Verifique o identificador e tente novamente.",
        message: "Recurso não encontrado.",
        name: "NotFoundError",
        statusCode: 404,
      },
      options,
    )
  }
}

export class ApiError extends Error {
  readonly action: string
  readonly statusCode: number

  constructor(readonly details: SerializedAppError) {
    super(details.message)
    this.name = details.name
    this.action = details.action
    this.statusCode = details.statusCode
  }
}

export class CsvImportError extends ApiError {
  constructor(
    readonly summary: CsvImportErrorSummary | null,
    readonly apiError: ApiError,
  ) {
    super(apiError.details)
  }
}

export function isSerializedAppError(
  value: unknown,
): value is SerializedAppError {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<SerializedAppError>

  return (
    typeof candidate.action === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.name === "string" &&
    isErrorStatusCode(candidate.statusCode)
  )
}

export async function parseApiError(
  response: Response,
  fallback: ErrorFallback,
): Promise<ApiError> {
  const payload = await response.json().catch(() => null)

  if (isSerializedAppError(payload)) {
    return new ApiError(payload)
  }

  return createFallbackApiError(fallback)
}

export function createFallbackApiError(fallback: ErrorFallback): ApiError {
  return new ApiError(
    new InternalServerError({
      action: fallback.action,
      message: fallback.message,
    }).toJSON(),
  )
}

export async function throwApiError(
  response: Response,
  fallback: ErrorFallback,
): Promise<never> {
  throw await parseApiError(response, fallback)
}

export function formatApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `${error.message} ${error.action}`
  }

  return "Não foi possível concluir a ação. Tente novamente."
}

function isErrorStatusCode(value: unknown): value is ErrorStatusCode {
  return (
    value === 400 ||
    value === 401 ||
    value === 404 ||
    value === 405 ||
    value === 500 ||
    value === 503
  )
}
