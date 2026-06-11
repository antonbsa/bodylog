const metricPlaceholders = [
  {
    detail: "Semana atual",
    label: "Peso médio",
    value: "-",
  },
  {
    detail: "Comparação semanal",
    label: "Gordura corporal",
    value: "-",
  },
  {
    detail: "Comparação semanal",
    label: "Massa muscular",
    value: "-",
  },
]

type AuthenticatedAppProps = {
  onLogout: () => void
}

export function AuthenticatedApp({ onLogout }: AuthenticatedAppProps) {
  return (
    <main className="app-shell">
      <header className="app-header">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">BodyLog</p>
          <h1 id="page-title">Registro diário de medidas corporais</h1>
          <p className="intro">
            Uma base simples para acompanhar medidas e revisar a semana no
            celular.
          </p>
        </section>

        <button className="secondary-action" onClick={onLogout} type="button">
          Sair
        </button>
      </header>

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
