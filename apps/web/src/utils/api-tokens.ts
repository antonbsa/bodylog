import type { ApiTokenSummary } from "../../../../types/api-tokens"
import { formatDisplayDateFromIso, toIsoDate } from "./date-format"

/** The secondary line of a token row: last four characters, creation and last use, as local dates. */
export function formatApiTokenDetails(token: ApiTokenSummary): string {
  const createdOn = formatLocalDate(token.createdAt)
  const lastUse = token.lastUsedAt
    ? `Último uso em ${formatLocalDate(token.lastUsedAt)}`
    : "Nunca usado"

  return `•••• ${token.lastFour} · Criado em ${createdOn} · ${lastUse}`
}

function formatLocalDate(timestamp: string): string {
  return formatDisplayDateFromIso(toIsoDate(new Date(timestamp)))
}
