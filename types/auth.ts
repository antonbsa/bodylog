export type SessionUser = {
  id: string
  displayName: string
  /** The provider's verified email, or null when it had none verified. */
  email: string | null
  /** Null until the user sets it in Ajustes; BMI is null meanwhile. */
  heightCm: number | null
  /** The IANA zone the device last reported; null until the first sync. */
  timeZone: string | null
}

/** Response of `GET /api/auth/session`, `POST /api/auth/dev-login` and `PATCH /api/me`. */
export type SessionResponse = {
  user: SessionUser
}

/** Body of `PATCH /api/me`: at least one field; a null height clears it. */
export type UpdateProfileRequest = {
  heightCm?: number | null
  timeZone?: string
}
