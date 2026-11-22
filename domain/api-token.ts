/** Personal API tokens a user may hold at once; creating another needs a revoke first. */
export const MAX_API_TOKENS_PER_USER = 3

export const API_TOKEN_NAME_MAX_LENGTH = 50

/** The trimmed name, or null when it is blank or longer than the limit. */
export function normalizeApiTokenName(value: string): string | null {
  const trimmed = value.trim()

  return trimmed === "" || trimmed.length > API_TOKEN_NAME_MAX_LENGTH
    ? null
    : trimmed
}
