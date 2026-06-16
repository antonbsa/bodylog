import { apiFetch } from "./client"

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

export type CsvImportSummary = {
  created: number
  errors: Array<{
    message: string
    row: number
  }>
  skipped: number
  updated: number
}

export class CsvImportError extends Error {
  constructor(readonly summary: CsvImportSummary | null) {
    super("Measurement CSV import failed")
  }
}

export async function listMeasurements(options: {
  limit: number
  offset?: number
}): Promise<ListedMeasurement[]> {
  const query = new URLSearchParams({
    limit: String(options.limit),
    offset: String(options.offset ?? 0),
  })
  const response = await apiFetch(`/api/measurements?${query}`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error("Measurement list failed")
  }

  const payload = (await response.json()) as {
    items: ListedMeasurement[]
  }

  return payload.items
}

export async function getMeasurementByDate(
  date: string,
): Promise<Measurement | null> {
  const response = await apiFetch(`/api/measurements/by-date/${date}`, {
    method: "GET",
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error("Measurement lookup failed")
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
  const response = await apiFetch(`/api/measurements/by-date/${date}`, {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "PUT",
  })

  if (!response.ok) {
    throw new Error("Measurement save failed")
  }

  const payload = (await response.json()) as {
    item: Measurement
  }

  return payload.item
}

export async function deleteMeasurement(id: string): Promise<void> {
  const response = await apiFetch(`/api/measurements/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Measurement delete failed")
  }
}

export async function exportMeasurementsCsv(): Promise<Blob> {
  const response = await apiFetch("/api/export/csv", { method: "GET" })

  if (!response.ok) {
    throw new Error("Measurement CSV export failed")
  }

  return response.blob()
}

export async function importMeasurementsCsv(
  file: File,
): Promise<CsvImportSummary> {
  const formData = new FormData()

  formData.append("file", file)

  const response = await apiFetch("/api/import/csv", {
    body: formData,
    method: "POST",
  })
  const payload = (await response.json().catch(() => null)) as
    | (CsvImportSummary & {
        ok?: false
      })
    | null

  if (!response.ok) {
    throw new CsvImportError(payload)
  }

  if (!payload) {
    throw new CsvImportError(null)
  }

  return payload
}
