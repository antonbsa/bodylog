export const SESSION_COOKIE_NAME = "bodylog_session"
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const textEncoder = new TextEncoder()

function encodeBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes))

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    {
      hash: "SHA-256",
      name: "HMAC",
    },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(payload),
  )

  return encodeBase64Url(signature)
}

function equalConstantTime(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false
  }

  let diff = 0

  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return diff === 0
}

export async function createSessionCookieValue(
  sessionSecret: string,
  now = new Date(),
): Promise<string> {
  const issuedAt = String(now.getTime())
  const signature = await sign(issuedAt, sessionSecret)

  return `${issuedAt}.${signature}`
}

export async function isValidSessionCookieValue(
  cookieValue: string | undefined,
  sessionSecret: string,
  now = new Date(),
): Promise<boolean> {
  if (!cookieValue) {
    return false
  }

  const [issuedAt, signature, extra] = cookieValue.split(".")

  if (!issuedAt || !signature || extra) {
    return false
  }

  const issuedAtMs = Number(issuedAt)

  if (!Number.isSafeInteger(issuedAtMs) || issuedAtMs > now.getTime()) {
    return false
  }

  const ageSeconds = Math.floor((now.getTime() - issuedAtMs) / 1000)

  if (ageSeconds > SESSION_MAX_AGE_SECONDS) {
    return false
  }

  const expectedSignature = await sign(issuedAt, sessionSecret)

  return equalConstantTime(signature, expectedSignature)
}
