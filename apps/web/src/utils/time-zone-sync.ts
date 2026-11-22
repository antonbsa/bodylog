/** The device zone to store on app start, or null when the stored one already matches or the device reports none. */
export function getTimeZoneToSync(
  storedTimeZone: string | null,
  deviceTimeZone: string | undefined,
): string | null {
  if (!deviceTimeZone || deviceTimeZone === storedTimeZone) {
    return null
  }

  return deviceTimeZone
}
