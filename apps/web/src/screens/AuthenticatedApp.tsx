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

export function AuthenticatedApp() {
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
