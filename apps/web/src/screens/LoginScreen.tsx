import { useEffect, useState } from "react"
import { GithubLogo } from "@phosphor-icons/react/dist/csr/GithubLogo"
import { GoogleLogo } from "@phosphor-icons/react/dist/csr/GoogleLogo"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { Button } from "../components/Button"
import { devLogin } from "../api/auth"
import {
  getSignInErrorMessage,
  withoutSignInError,
} from "../utils/sign-in-error"

type LoginScreenProps = {
  onLoginSuccess: () => void
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [errorMessage, setErrorMessage] = useState(
    () => getSignInErrorMessage(window.location.search) ?? "",
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("error")) {
      window.history.replaceState(
        window.history.state,
        "",
        withoutSignInError(window.location.href),
      )
    }
  }, [])

  async function handleDevLogin() {
    setErrorMessage("")
    setIsSubmitting(true)

    const result = await devLogin()

    setIsSubmitting(false)

    if (result.ok) {
      onLoginSuccess()
      return
    }

    setErrorMessage(formatApiErrorMessage(result.error))
  }

  return (
    <main className="app-shell login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="eyebrow">BodyLog</p>
        <h1 id="login-title">Entrar</h1>
        <p className="intro">Entre com sua conta para acessar suas medidas.</p>

        <div className="login-form">
          {errorMessage ? (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <Button asChild>
            <a href="/api/auth/github">
              <GithubLogo aria-hidden size={18} weight="fill" />
              Entrar com GitHub
            </a>
          </Button>

          <Button asChild>
            <a href="/api/auth/google">
              <GoogleLogo aria-hidden size={18} weight="bold" />
              Entrar com Google
            </a>
          </Button>

          {import.meta.env.DEV ? (
            <Button
              disabled={isSubmitting}
              onClick={handleDevLogin}
              type="button"
              variant="secondary"
            >
              {isSubmitting ? "Entrando..." : "Entrar como dev"}
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  )
}
