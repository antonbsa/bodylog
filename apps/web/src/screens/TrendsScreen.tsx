import { CaretDown } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { getTrends } from "../api/trends"
import { queryKeys } from "../api/queryKeys"
import { useRefreshOnResume } from "../hooks/useRefreshOnResume"
import {
  formatDayMonth,
  formatWeekRange,
  getTodayIsoDate,
} from "../utils/date-format"
import { formatFixed } from "../utils/number-format"
import {
  MIN_TREND_POINTS,
  TREND_METRICS,
  TREND_PERIODS,
  getMetricPoints,
  getPeriodAverage,
  getTrendWindow,
  getWeeklyAverages,
  getWindowChip,
  type TrendMetricKey,
  type TrendPeriod,
} from "../utils/trends"
import { PageTitle } from "./components/PageTitle"
import { ChipIcon } from "./components/WeekCard"
import { TrendChart } from "./components/TrendChart"

const MISSING = "—"

export function TrendsScreen() {
  const [metricKey, setMetricKey] = useState<TrendMetricKey>("weightKg")
  const [period, setPeriod] = useState<TrendPeriod>("30")
  const query = useQuery({ queryFn: getTrends, queryKey: queryKeys.trends })

  useRefreshOnResume(() => {
    query.refetch()
  })

  const metric =
    TREND_METRICS.find((item) => item.key === metricKey) ?? TREND_METRICS[0]
  const points = query.data?.points
  const metricPoints = points ? getMetricPoints(points, metric.key) : []
  const window = getTrendWindow(metricPoints, period, getTodayIsoDate())
  const hasEnough = window.points.length >= MIN_TREND_POINTS
  const weeks = hasEnough ? getWeeklyAverages(window.points, window.start) : []
  const chip = getWindowChip(weeks, metric)

  return (
    <>
      <PageTitle>Tendências</PageTitle>

      <div className="selwrap">
        <label className="sr-only" htmlFor="trend-metric">
          Métrica
        </label>
        <select
          id="trend-metric"
          onChange={(event) =>
            setMetricKey(event.target.value as TrendMetricKey)
          }
          value={metricKey}
        >
          {TREND_METRICS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label} ({item.unit})
            </option>
          ))}
        </select>
        <CaretDown aria-hidden className="ic" size={22} />
      </div>

      <div aria-label="Período" className="seg period" role="radiogroup">
        {TREND_PERIODS.map((item) => (
          <button
            aria-checked={item.value === period}
            key={item.value}
            onClick={() => setPeriod(item.value)}
            role="radio"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {points === undefined ? (
        <section
          aria-busy={!query.isError}
          aria-label="Tendência"
          className="card trend-reserved"
        >
          {query.isError ? (
            <div className="home-error trend-error" role="alert">
              <p>{formatApiErrorMessage(query.error)}</p>
              <button
                className="btn ghost"
                onClick={() => query.refetch()}
                type="button"
              >
                Tentar de novo
              </button>
            </div>
          ) : (
            <span className="num">{MISSING}</span>
          )}
        </section>
      ) : !hasEnough ? (
        <section aria-label="Sem dados suficientes" className="card">
          <div className="empty-chart">
            <div>
              Ainda não há dados suficientes para este período.
              {window.firstDate ? (
                <>
                  <br />
                  <span className="small">
                    {metric.label} tem registros desde{" "}
                    {formatDayMonth(window.firstDate)}.
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section aria-label="Resumo do período" className="card">
            <div className="sum">
              <div>
                <span className="k">Média no período</span>
                <span className="v">
                  <span className="num">
                    {formatFixed(
                      getPeriodAverage(window.points),
                      metric.decimals,
                    )}
                  </span>
                  <span className="unit">{metric.unit}</span>
                </span>
              </div>
              <div className="r">
                <span className="k">1ª vs última semana</span>
                <span className="chip">
                  <ChipIcon direction={chip.direction} />
                  {chip.text}
                </span>
              </div>
            </div>
          </section>

          <section aria-label="Gráfico" className="card">
            <TrendChart
              end={window.end}
              key={`${metric.key}-${period}`}
              metric={metric}
              points={window.points}
              start={window.start}
              weeks={weeks}
            />
            {window.clipped && window.firstDate ? (
              <p className="note-line">
                {metric.label} só tem registros desde{" "}
                {formatDayMonth(window.firstDate)}; períodos maiores mostram o
                mesmo trecho.
              </p>
            ) : null}
          </section>

          <details className="tbl card">
            <summary>Ver médias semanais como tabela</summary>
            <table>
              <thead>
                <tr>
                  <th scope="col">Semana</th>
                  <th scope="col">Média</th>
                  <th scope="col">Dias</th>
                </tr>
              </thead>
              <tbody>
                {[...weeks].reverse().map((week) => (
                  <tr key={week.weekStartDate}>
                    <th scope="row">
                      {formatWeekRange(week.weekStartDate, week.weekEndDate)}
                    </th>
                    <td className="num">
                      {formatFixed(week.average, metric.decimals)} {metric.unit}
                    </td>
                    <td className="num">{week.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </>
  )
}
