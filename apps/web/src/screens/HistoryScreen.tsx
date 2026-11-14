import { HistoryWeekCard, WeekAverages } from "./components/HistoryWeekCard"
import { PageTitle } from "./components/PageTitle"
import { useHistoryWeeks } from "../hooks/useHistoryWeeks"
import { useRefreshOnResume } from "../hooks/useRefreshOnResume"
import { useTabNavigate } from "../hooks/useTabNavigate"
import { getTodayIsoDate } from "../utils/date-format"

const MISSING = "—"
// Placeholder rows besides "Média"; a typical week card has about this many records.
const PLACEHOLDER_ROWS = 5
const NO_AVERAGES = {
  bodyFatPercentage: null,
  musclePercentage: null,
  weightKg: null,
}

/** Stands in for a week card while loading or after a failed load, so the screen keeps its height. */
function PlaceholderWeek({
  error,
  onRetry,
}: {
  error: string | null
  onRetry: () => void
}) {
  return (
    <section aria-busy={error === null} aria-label="Semana">
      <div className="week-title">
        <span>{MISSING}</span>
        <span className="num">{MISSING}</span>
      </div>
      <div className="card hlist hlist-reserved">
        {error !== null ? (
          <div className="home-error history-error" role="alert">
            <p>{error}</p>
            <button className="btn ghost" onClick={onRetry} type="button">
              Tentar de novo
            </button>
          </div>
        ) : (
          <>
            <WeekAverages averages={NO_AVERAGES} />
            {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
              <div className="hrow hgrid" key={index}>
                <span className="d num">{MISSING}</span>
                <span className="n num">{MISSING}</span>
                <span className="n num">{MISSING}</span>
                <span className="n num">{MISSING}</span>
                <span />
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  )
}

export function HistoryScreen() {
  const { loadMore, reload, state } = useHistoryWeeks()
  const { navigate } = useTabNavigate()

  useRefreshOnResume(reload)

  function openDate(date: string) {
    navigate(`/registro?data=${date}`, { from: "/historico" })
  }

  const isEmpty = state.status === "loaded" && state.weeks.length === 0

  return (
    <>
      <PageTitle>Histórico</PageTitle>

      {isEmpty ? (
        <section aria-label="Histórico vazio" className="card">
          <p className="empty-msg">Nenhuma medida ainda.</p>
          <button
            className="btn block"
            onClick={() => openDate(getTodayIsoDate())}
            type="button"
          >
            Registrar hoje
          </button>
        </section>
      ) : (
        <>
          {state.status === "loaded" ? (
            state.weeks.map((week) => (
              <HistoryWeekCard
                key={week.summary.weekStartDate}
                onOpenDate={openDate}
                week={week}
              />
            ))
          ) : (
            <PlaceholderWeek error={state.message} onRetry={reload} />
          )}
          {state.hasMore ? (
            <div className="load-more">
              {state.loadMoreError !== null ? (
                <p className="load-more-error" role="alert">
                  {state.loadMoreError}
                </p>
              ) : null}
              <button
                className="btn ghost"
                disabled={state.isLoadingMore}
                onClick={loadMore}
                type="button"
              >
                {state.isLoadingMore ? "Carregando…" : "Carregar mais"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </>
  )
}
