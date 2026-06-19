import {
  CsvImportError,
  type CsvImportErrorSummary,
  createFallbackApiError,
  parseApiError,
  throwApiError,
} from "../../../../infra/errors"
import { api } from "./client"

export type Measurement = {
  id: string
  date: string
  weightKg: number
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  createdAt: string
  updatedAt: string
}

export type MeasurementDerivedValues = {
  bmi: number
  bodyFatKg: number | null
  muscleKg: number | null
}

export type ListedMeasurement = Measurement & {
  derived: MeasurementDerivedValues
}

export type SaveMeasurementInput = {
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  weightKg: number
}

export type CsvImportSummary = CsvImportErrorSummary

export async function listMeasurements(options: {
  limit: number
  offset?: number
}): Promise<ListedMeasurement[]> {
  const query = new URLSearchParams({
    limit: String(options.limit),
    offset: String(options.offset ?? 0),
  })
  const response = await api(`/api/measurements?${query}`, {
    method: "GET",
  })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Atualize a página e tente novamente.",
      message: "Não foi possível carregar o histórico.",
    })
  }

  const payload = (await response.json()) as {
    items: ListedMeasurement[]
  }

  return payload.items
}

export async function getMeasurementByDate(
  date: string,
): Promise<Measurement | null> {
  const response = await api(`/api/measurements/by-date/${date}`, {
    method: "GET",
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    await throwApiError(response, {
      action: "Verifique a data selecionada e tente novamente.",
      message: "Não foi possível carregar a medida dessa data.",
    })
  }

  const payload = (await response.json()) as {
    item: Measurement | null
  }

  return payload.item
}

export async function saveMeasurementByDate(
  date: string,
  input: SaveMeasurementInput,
): Promise<Measurement> {
  const response = await api(`/api/measurements/by-date/${date}`, {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "PUT",
  })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Revise os campos da medida e tente novamente.",
      message: "Não foi possível salvar a medida.",
    })
  }

  const payload = (await response.json()) as {
    item: Measurement
  }

  return payload.item
}

export async function deleteMeasurement(id: string): Promise<void> {
  const response = await api(`/api/measurements/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Atualize o histórico e tente novamente.",
      message: "Não foi possível excluir a medida.",
    })
  }
}

export async function exportMeasurementsCsv(): Promise<Blob> {
  const response = await api("/api/export/csv", { method: "GET" })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Tente exportar novamente em instantes.",
      message: "Não foi possível exportar o CSV.",
    })
  }

  return response.blob()
}

export async function importMeasurementsCsv(
  file: File,
): Promise<CsvImportSummary> {
  const formData = new FormData()

  formData.append("file", file)

  const response = await api("/api/import/csv", {
    body: formData,
    method: "POST",
  })

  if (!response.ok) {
    throw new CsvImportError(
      null,
      await parseApiError(response, {
        action: "Revise o arquivo CSV e tente novamente.",
        message: "Não foi possível importar o CSV.",
      }),
    )
  }

  const payload = (await response
    .json()
    .catch(() => null)) as CsvImportSummary | null

  if (!payload) {
    throw new CsvImportError(
      null,
      createFallbackApiError({
        action: "Tente importar o arquivo novamente.",
        message: "A resposta da importação está inválida.",
      }),
    )
  }

  return payload
}
