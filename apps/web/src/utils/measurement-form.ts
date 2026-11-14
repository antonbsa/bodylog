import {
  MEASUREMENT_LIMITS,
  calculateDerivedValues,
  normalizeNotes,
} from "../../../../domain/measurement"
import { maskedDigitsToNumber, numberToMaskedDigits } from "./numeric-mask"
import type {
  Measurement,
  MeasurementDerivedValues,
  MeasurementInput,
} from "../../../../types/measurements"

export type NumericFieldKey =
  | "bodyFatPercentage"
  | "musclePercentage"
  | "restingMetabolismKcal"
  | "sleepHours"
  | "waistCm"
  | "weightKg"

export type NumericFieldConfig = {
  decimals: number
  label: string
  maxDigits: number
  unit: string
}

export const NUMERIC_FIELD_ORDER: readonly NumericFieldKey[] = [
  "weightKg",
  "bodyFatPercentage",
  "musclePercentage",
  "restingMetabolismKcal",
  "waistCm",
  "sleepHours",
]

export const NUMERIC_FIELDS: Record<NumericFieldKey, NumericFieldConfig> = {
  bodyFatPercentage: {
    decimals: 1,
    label: "Gordura",
    maxDigits: 4,
    unit: "%",
  },
  musclePercentage: {
    decimals: 1,
    label: "Músculo",
    maxDigits: 4,
    unit: "%",
  },
  restingMetabolismKcal: {
    decimals: 0,
    label: "Metabolismo",
    maxDigits: 4,
    unit: "kcal",
  },
  sleepHours: { decimals: 1, label: "Sono", maxDigits: 3, unit: "h" },
  waistCm: { decimals: 1, label: "Cintura", maxDigits: 4, unit: "cm" },
  weightKg: { decimals: 1, label: "Peso", maxDigits: 4, unit: "kg" },
}

export type FormValues = {
  digits: Record<NumericFieldKey, string>
  disposition: number | null
  notes: string
}

export type FormErrors = Partial<Record<NumericFieldKey, string>>

const SLEEP_STEP_HOURS = 0.5
const SLEEP_DEFAULT_HOURS = 7

export const EMPTY_FORM: FormValues = {
  digits: {
    bodyFatPercentage: "",
    musclePercentage: "",
    restingMetabolismKcal: "",
    sleepHours: "",
    waistCm: "",
    weightKg: "",
  },
  disposition: null,
  notes: "",
}

export function formFromMeasurement(
  measurement: Measurement | null,
): FormValues {
  if (!measurement) {
    return EMPTY_FORM
  }

  const digits = { ...EMPTY_FORM.digits }

  for (const key of NUMERIC_FIELD_ORDER) {
    digits[key] = numberToMaskedDigits(
      measurement[key],
      NUMERIC_FIELDS[key].decimals,
    )
  }

  return {
    digits,
    disposition: measurement.disposition,
    notes: measurement.notes ?? "",
  }
}

export function isSameForm(a: FormValues, b: FormValues): boolean {
  return (
    a.disposition === b.disposition &&
    a.notes === b.notes &&
    NUMERIC_FIELD_ORDER.every((key) => a.digits[key] === b.digits[key])
  )
}

export function getFieldNumber(
  values: FormValues,
  key: NumericFieldKey,
): number | null {
  return maskedDigitsToNumber(values.digits[key], NUMERIC_FIELDS[key].decimals)
}

/** Returns the error message for a field, or an empty string when it is valid. */
export function validateField(
  key: NumericFieldKey,
  values: FormValues,
): string {
  const value = getFieldNumber(values, key)

  if (value === null) {
    return key === "weightKg" ? "Informe o peso." : ""
  }

  const { max, min } = MEASUREMENT_LIMITS[key]

  if (value < min || value > max) {
    return `Use um valor entre ${min} e ${max} ${NUMERIC_FIELDS[key].unit}.`
  }

  return ""
}

export function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  for (const key of NUMERIC_FIELD_ORDER) {
    const message = validateField(key, values)

    if (message) {
      errors[key] = message
    }
  }

  return errors
}

/** Builds the PUT body: an emptied field is sent as null so the stored value is cleared. */
export function buildMeasurementInput(
  values: FormValues,
): MeasurementInput | null {
  const weightKg = getFieldNumber(values, "weightKg")

  if (weightKg === null) {
    return null
  }

  return {
    bodyFatPercentage: getFieldNumber(values, "bodyFatPercentage"),
    disposition: values.disposition,
    musclePercentage: getFieldNumber(values, "musclePercentage"),
    notes: normalizeNotes(values.notes),
    restingMetabolismKcal: getFieldNumber(values, "restingMetabolismKcal"),
    sleepHours: getFieldNumber(values, "sleepHours"),
    waistCm: getFieldNumber(values, "waistCm"),
    weightKg,
  }
}

/** Derived values from the current form; null while the weight is missing or invalid. */
export function deriveFromForm(
  values: FormValues,
  heightCm: number,
): MeasurementDerivedValues | null {
  if (validateField("weightKg", values) !== "") {
    return null
  }

  const weightKg = getFieldNumber(values, "weightKg")

  if (weightKg === null) {
    return null
  }

  return calculateDerivedValues(
    {
      bodyFatPercentage: validPercentage(values, "bodyFatPercentage"),
      musclePercentage: validPercentage(values, "musclePercentage"),
      weightKg,
    },
    heightCm,
  )
}

function validPercentage(
  values: FormValues,
  key: "bodyFatPercentage" | "musclePercentage",
): number | null {
  return validateField(key, values) === "" ? getFieldNumber(values, key) : null
}

/**
 * Next sleep digits for a stepper tap. An empty field first takes the
 * previous recorded value (7 h when there is none); later taps step 0.5 h
 * within 0-24 h.
 */
export function stepSleepDigits(
  currentDigits: string,
  direction: 1 | -1,
  previousHours: number | null,
): string {
  const { decimals } = NUMERIC_FIELDS.sleepHours
  const { max, min } = MEASUREMENT_LIMITS.sleepHours
  const current = maskedDigitsToNumber(currentDigits, decimals)
  const next =
    current === null
      ? (previousHours ?? SLEEP_DEFAULT_HOURS)
      : Math.min(max, Math.max(min, current + direction * SLEEP_STEP_HOURS))

  return numberToMaskedDigits(next, decimals)
}
