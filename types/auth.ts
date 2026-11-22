export type SessionUser = {
  id: string
  displayName: string
  /** The provider's verified email, or null when it had none verified. */
  email: string | null
}

/** Response of `GET /api/auth/session` and `POST /api/auth/dev-login`. */
export type SessionResponse = {
  user: SessionUser
}
