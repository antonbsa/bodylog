import {
  HEIGHT_CM_LIMIT,
  isWithinHeightLimit,
} from "../../../../domain/measurement"
import type { NumericFieldConfig } from "./measurement-form"
import { formatDisplayNumber } from "./number-format"

export const HEIGHT_FIELD: NumericFieldConfig = {
  decimals: 0,
  label: "Altura",
  maxDigits: 3,
  unit: "cm",
}

/** The error under the height field, or "" when the digits are a height the API accepts. */
export function validateHeightDigits(digits: string): string {
  if (digits === "") {
    return "Informe a altura."
  }

  return isWithinHeightLimit(Number(digits))
    ? ""
    : `Use um valor entre ${HEIGHT_CM_LIMIT.min} e ${HEIGHT_CM_LIMIT.max} cm.`
}

export function formatHeight(heightCm: number | null): string {
  return heightCm === null
    ? "Não informada"
    : `${formatDisplayNumber(heightCm)} cm`
}
