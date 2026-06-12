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

type AuthenticatedDashboardProps = {
  onLogout: () => void
  onOpenMeasurementForm: () => void
  savedMessage: string | null
}

export function AuthenticatedDashboard({
  onLogout,
  onOpenMeasurementForm,
  savedMessage,
}: AuthenticatedDashboardProps) {
  return (
    <>
      <header className="app-header">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">BodyLog</p>
          <h1 id="page-title">Registro diário de medidas corporais</h1>
          <p className="intro">
            Uma base simples para acompanhar medidas e revisar a semana no
            celular.
          </p>
        </section>

        <div className="header-actions">
          <button
            className="primary-action"
            onClick={onOpenMeasurementForm}
            type="button"
          >
            Registrar medida
          </button>
          <button className="secondary-action" onClick={onLogout} type="button">
            Sair
          </button>
        </div>
      </header>

      {savedMessage ? (
        <p className="form-success" role="status">
          {savedMessage}
        </p>
      ) : null}

      <section className="summary-grid" aria-label="Resumo inicial">
        {metricPlaceholders.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.detail}</span>
          </article>
        ))}
      </section>
    </>
  )
}
