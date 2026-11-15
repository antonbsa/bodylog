import { useLocation } from "react-router"

import { useRefreshOnResume } from "../../hooks/useRefreshOnResume"
import { useTabNavigate } from "../../hooks/useTabNavigate"
import { useTodayRecord } from "../../hooks/useTodayRecord"
import { formatDayLabel } from "../../utils/date-format"
import { formatOneDecimal } from "../../utils/number-format"
import type { Measurement } from "../../../../../types/measurements"

const MISSING = "—"

function MiniValue({
  decimals,
  label,
  unit,
  value,
}: {
  decimals: 0 | 1
  label: string
  unit: string
  value: number | null
}) {
  return (
    <div className="mini">
      <span className="mini-label">{label}</span>
      <span className="mini-value num">
        {value === null ? (
          MISSING
        ) : (
          <>
            {decimals === 0
              ? String(Math.round(value))
              : formatOneDecimal(value)}
            <small>{unit}</small>
          </>
        )}
      </span>
    </div>
  )
}

function TodayGrid({ measurement }: { measurement: Measurement | null }) {
  return (
    <>
      <div className="today-value">
        <span className="big num">
          {measurement ? formatOneDecimal(measurement.weightKg) : MISSING}
        </span>
        <span className="unit">kg</span>
      </div>
      <div className="mini-grid">
        <MiniValue
          decimals={1}
          label="Gordura"
          unit="%"
          value={measurement?.bodyFatPercentage ?? null}
        />
        <MiniValue
          decimals={1}
          label="Músculo"
          unit="%"
          value={measurement?.musclePercentage ?? null}
        />
        <MiniValue
          decimals={0}
          label="Metabolismo"
          unit="kcal"
          value={measurement?.restingMetabolismKcal ?? null}
        />
        <MiniValue
          decimals={1}
          label="Cintura"
          unit="cm"
          value={measurement?.waistCm ?? null}
        />
        <MiniValue
          decimals={1}
          label="Sono"
          unit="h"
          value={measurement?.sleepHours ?? null}
        />
        <MiniValue
          decimals={0}
          label="Disposição"
          unit="/5"
          value={measurement?.disposition ?? null}
        />
      </div>
    </>
  )
}

export function TodayCard({ today }: { today: string }) {
  const { error, isLoading, last, measurement, reload } = useTodayRecord(today)
  const { navigate } = useTabNavigate()
  const { pathname } = useLocation()

  useRefreshOnResume(reload)

  function openRegistration() {
    navigate(`/registro?data=${today}`, { from: pathname })
  }

  const title = `Hoje · ${formatDayLabel(today)}`

  if (error !== null || isLoading) {
    // Same grid as a filled day (values as dashes) so the card keeps its height.
    return (
      <section aria-busy={isLoading} aria-label="Hoje" className="card">
        <div className="today-top">
          <span className="today-label">{title}</span>
        </div>
        {error !== null ? (
          <div className="home-error" role="alert">
            <p>{error}</p>
            <button className="btn ghost" onClick={reload} type="button">
              Tentar de novo
            </button>
          </div>
        ) : (
          <TodayGrid measurement={null} />
        )}
      </section>
    )
  }

  if (measurement === null) {
    return (
      <section aria-label="Hoje" className="card">
        <div className="today-top">
          <span className="today-label">{title}</span>
        </div>
        <p className="empty-msg">
          Sem medida hoje.
          {last
            ? ` Última: ${formatDayLabel(last.date)} · ${formatOneDecimal(last.weightKg)} kg.`
            : ""}
        </p>
        <button className="btn block" onClick={openRegistration} type="button">
          Registrar hoje
        </button>
      </section>
    )
  }

  return (
    <section aria-label="Hoje" className="card">
      <div className="today-top">
        <span className="today-label">{title}</span>
        <button className="btn ghost" onClick={openRegistration} type="button">
          Editar
        </button>
      </div>
      <TodayGrid measurement={measurement} />
    </section>
  )
}
