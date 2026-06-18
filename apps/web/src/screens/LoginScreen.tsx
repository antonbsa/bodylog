import { useState, type SubmitEvent } from "react"
import { TextField } from "@radix-ui/themes"

import { Button } from "../components/Button"
import { login } from "../api/auth"

type LoginScreenProps = {
  onLoginSuccess: () => void
}

function getLoginErrorMessage(error: "INVALID_PASSWORD" | "UNKNOWN_ERROR") {
  if (error === "INVALID_PASSWORD") {
    return "Senha inválida. Tente novamente."
  }

  return "Não foi possível entrar. Tente novamente."
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLoginSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    const result = await login(password)

    if (result.ok) {
      setPassword("")
      onLoginSuccess()
      setIsSubmitting(false)
      return
    }

    setErrorMessage(getLoginErrorMessage(result.error))
    setIsSubmitting(false)
  }

  return (
    <main className="app-shell login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="eyebrow">BodyLog</p>
        <h1 id="login-title">Entrar</h1>
        <p className="intro">
          Use a senha configurada para acessar suas medidas.
        </p>

        <form className="login-form" onSubmit={handleLoginSubmit}>
          <label className="visually-hidden" htmlFor="username">
            Usuário
          </label>
          <input
            autoComplete="username"
            className="password-manager-username"
            defaultValue="bodylog"
            id="username"
            name="username"
            type="text"
          />

          <label htmlFor="password">Senha</label>
          <TextField.Root
            autoCapitalize="none"
            autoComplete="password"
            autoCorrect="off"
            disabled={isSubmitting}
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />

          {errorMessage ? (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </section>
    </main>
  )
}
