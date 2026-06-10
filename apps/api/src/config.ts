export type AppBindings = {
  DB: D1Database
  USER_HEIGHT_CM: string
}

export function getUserHeightCm(
  env: Pick<AppBindings, "USER_HEIGHT_CM">,
): number {
  const heightCm = Number(env.USER_HEIGHT_CM)

  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    throw new Error("USER_HEIGHT_CM must be a positive number in centimeters")
  }

  return heightCm
}
