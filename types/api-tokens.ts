/** A personal API token as listed; the plaintext token is never part of it. */
export type ApiTokenSummary = {
  id: string
  name: string
  /** The token's last four characters, so the user can tell tokens apart. */
  lastFour: string
  createdAt: string
  lastUsedAt: string | null
}

/** Response of `GET /api/tokens`. */
export type ApiTokenListResponse = {
  items: ApiTokenSummary[]
}

/** Body of `POST /api/tokens`. */
export type CreateApiTokenRequest = {
  name: string
}

/** Response of `POST /api/tokens`, the only one that carries the plaintext token. */
export type CreateApiTokenResponse = {
  item: ApiTokenSummary
  token: string
}
