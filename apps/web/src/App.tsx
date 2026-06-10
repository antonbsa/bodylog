import { useState, type FormEvent } from "react"

const metricPlaceholders = [
  {
    label: "Peso médio",
    value: "-",
    detail: "Semana atual",
  },
  {
    label: "Gordura corporal",
    value: "-",
    detail: "Comparação semanal",
  },
  {
    label: "Massa muscular",
    value: "-",
    detail: "Comparação semanal",
  },
]

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        body: JSON.stringify({ password }),
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setPassword("")
        return
      }

      if (response.status === 401) {
        setErrorMessage("Senha inválida. Tente novamente.")
        return
      }

      setErrorMessage("Não foi possível entrar. Tente novamente.")
    } catch {
      setErrorMessage("Não foi possível entrar. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="app-shell login-shell">
        <section className="login-panel" aria-labelledby="login-title">
          <p className="eyebrow">BodyLog</p>
          <h1 id="login-title">Entrar</h1>
          <p className="intro">
            Use a senha configurada para acessar suas medidas.
          </p>

          <form className="login-form" onSubmit={handleLoginSubmit}>
            <label htmlFor="password">Senha</label>
            <input
              autoComplete="current-password"
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

            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">BodyLog</p>
        <h1 id="page-title">Registro diário de medidas corporais</h1>
        <p className="intro">
          Uma base simples para acompanhar medidas e revisar a semana no
          celular.
        </p>
      </section>

      <section className="summary-grid" aria-label="Resumo inicial">
        {metricPlaceholders.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.detail}</span>
          </article>
        ))}
      </section>
    </main>
  )
}
