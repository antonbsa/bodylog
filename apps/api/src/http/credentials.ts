/** 32 random bytes in base64url, the secret behind session cookies and API tokens. */
export function createOpaqueSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))

  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

/** SHA-256 in hex; enough for high-entropy secrets, which need no slow KDF. */
export async function hashSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  )

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}
