const ptBrNumberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

const ptBrPreciseNumberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

export function formatDisplayNumber(value: number): string {
  return ptBrNumberFormatter.format(value)
}

export function formatPreciseDisplayNumber(value: number): string {
  return ptBrPreciseNumberFormatter.format(value)
}

export function formatOptionalPreciseDisplayNumber(
  value: number | null,
): string {
  return value === null ? "-" : formatPreciseDisplayNumber(value)
}

export function formatSignedDisplayNumber(value: number): string {
  const sign = value > 0 ? "+" : ""

  return `${sign}${formatPreciseDisplayNumber(value)}`
}

export function formatInputNumber(value: number | null): string {
  return value === null ? "" : String(value).replace(".", ",")
}

export function parseDecimalInput(value: string): number | undefined {
  const normalizedValue = value.trim().replace(",", ".")

  if (normalizedValue === "") {
    return undefined
  }

  const parsedValue = Number(normalizedValue)

  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

const ptBrOneDecimalFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
})

export function formatOneDecimal(value: number): string {
  return ptBrOneDecimalFormatter.format(value)
}
