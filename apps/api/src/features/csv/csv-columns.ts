export type CsvField =
  | "bodyFatPercentage"
  | "createdAt"
  | "date"
  | "disposition"
  | "musclePercentage"
  | "notes"
  | "restingMetabolismKcal"
  | "sleepHours"
  | "updatedAt"
  | "waistCm"
  | "weightKg"

/** Canonical English, pt-BR snake_case and spreadsheet header of each field; the first one names the field in messages. */
export const FIELD_ALIASES: Record<CsvField, string[]> = {
  date: ["date", "data"],
  weightKg: ["weight_kg", "peso_kg", "Peso"],
  bodyFatPercentage: ["body_fat_percentage", "gordura_percentual", "Gordura"],
  musclePercentage: ["muscle_percentage", "musculo_percentual", "Músculo"],
  restingMetabolismKcal: [
    "resting_metabolism_kcal",
    "metabolismo_basal_kcal",
    "Metabolismo basal",
  ],
  waistCm: ["waist_cm", "cintura_cm", "Cintura"],
  sleepHours: ["sleep_hours", "sono_horas", "Sono"],
  disposition: ["disposition", "disposicao", "Disposição"],
  notes: ["notes", "notas"],
  createdAt: ["created_at"],
  updatedAt: ["updated_at"],
}

/** Lowercase, accents stripped, and `_`, `-` and whitespace collapsed to one space. */
export function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[_\-\s]+/g, " ")
    .trim()
}

const FIELD_BY_HEADER = new Map<string, CsvField>(
  (Object.entries(FIELD_ALIASES) as Array<[CsvField, string[]]>).flatMap(
    ([field, aliases]) =>
      aliases.map((alias) => [normalizeHeader(alias), field] as const),
  ),
)

export function findCsvField(header: string): CsvField | undefined {
  return FIELD_BY_HEADER.get(normalizeHeader(header))
}
