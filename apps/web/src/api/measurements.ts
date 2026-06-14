const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

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

export type SaveMeasurementInput = {
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  weightKg: number
}

export async function getMeasurementByDate(
  date: string,
): Promise<Measurement | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/measurements/by-date/${date}`,
    {
      credentials: "include",
      method: "GET",
    },
  )

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
  const response = await fetch(
    `${API_BASE_URL}/api/measurements/by-date/${date}`,
    {
      body: JSON.stringify(input),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      method: "PUT",
    },
  )

  if (!response.ok) {
    throw new Error("Measurement save failed")
  }

  const payload = (await response.json()) as {
    item: Measurement
  }

  return payload.item
}
