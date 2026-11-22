const SIGN_IN_ERROR_MESSAGES = new Map([
  ["declined", "Você cancelou o login. Tente de novo quando quiser."],
  ["failed", "Não foi possível entrar. Tente novamente em instantes."],
  [
    "state",
    "O login expirou ou foi aberto em outra janela. Tente entrar de novo.",
  ],
])

/** The message for the `?error=` code the sign-in callback redirects with; null for no code or an unknown one. */
export function getSignInErrorMessage(search: string): string | null {
  const code = new URLSearchParams(search).get("error")

  return code ? (SIGN_IN_ERROR_MESSAGES.get(code) ?? null) : null
}

/** The same address without the `error` parameter, so a reload doesn't show the message again. */
export function withoutSignInError(url: string): string {
  const parsed = new URL(url)

  parsed.searchParams.delete("error")

  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}
