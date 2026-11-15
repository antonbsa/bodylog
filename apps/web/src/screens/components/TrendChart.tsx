import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

import {
  MONTHS,
  formatRowDate,
  parseIsoDate,
  shiftIsoDate,
} from "../../utils/date-format"
import { formatFixed } from "../../utils/number-format"
import {
  diffDays,
  getWeekStart,
  getYAxis,
  type MetricPoint,
  type TrendMetric,
  type WeeklyAverage,
} from "../../utils/trends"

const HEIGHT = 240
const MARGIN = { bottom: 26, left: 40, right: 8, top: 10 }
// Keeps edge dots from being clipped by the plot area.
const PLOT_PAD = 6
const FALLBACK_WIDTH = 326
const LONG_RANGE_DAYS = 200
const MAX_WEEKLY_DOTS = 20
const DENSE_POINTS = 120

type TrendChartProps = {
  end: string
  metric: TrendMetric
  points: MetricPoint[]
  start: string
  weeks: WeeklyAverage[]
}

function formatAxisDate(date: string, long: boolean): string {
  const parsed = parseIsoDate(date)
  const month = MONTHS[parsed.getMonth()]

  return long
    ? `${month} ${String(parsed.getFullYear()).slice(2)}`
    : `${parsed.getDate()} ${month}`
}

/** Hand-drawn SVG line chart: muted daily dots, accent weekly-average line, and a marker that snaps to the nearest day. */
export function TrendChart({
  end,
  metric,
  points,
  start,
  weeks,
}: TrendChartProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(FALLBACK_WIDTH)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const { decimals, unit } = metric

  useLayoutEffect(() => {
    const host = hostRef.current

    if (!host) {
      return
    }

    const measure = () => setWidth(host.clientWidth || FALLBACK_WIDTH)

    measure()

    const observer = new ResizeObserver(measure)

    observer.observe(host)

    return () => observer.disconnect()
  }, [])

  const axis = getYAxis(points.map((point) => point.value))
  const span = Math.max(1, diffDays(end, start))
  const plotLeft = MARGIN.left + PLOT_PAD
  const plotRight = width - MARGIN.right - PLOT_PAD
  const x = (offset: number) =>
    plotLeft + (offset / span) * (plotRight - plotLeft)
  const y = (value: number) =>
    HEIGHT -
    MARGIN.bottom -
    PLOT_PAD -
    ((value - axis.min) / (axis.max - axis.min)) *
      (HEIGHT - MARGIN.bottom - MARGIN.top - 2 * PLOT_PAD)
  const pointX = (point: MetricPoint) => x(diffDays(point.date, start))
  const tickDecimals = axis.step < 1 ? 1 : 0
  const long = span > LONG_RANGE_DAYS
  const average =
    points.reduce((sum, point) => sum + point.value, 0) / points.length
  // Resolved by date so a refetch never leaves a stale point selected.
  const selected = points.find((point) => point.date === selectedDate) ?? null
  const selectedWeek = selected
    ? weeks.find((week) => week.weekStartDate === getWeekStart(selected.date))
    : undefined

  function select(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const pointerX = (event.clientX - rect.left) * (width / rect.width)
    let nearest = points[0]

    for (const point of points) {
      if (
        Math.abs(pointX(point) - pointerX) <
        Math.abs(pointX(nearest) - pointerX)
      ) {
        nearest = point
      }
    }

    setSelectedDate(nearest.date)
  }

  return (
    <>
      <div aria-live="off" className="readout" data-testid="trend-readout">
        {selected && selectedWeek ? (
          <>
            <b>{formatRowDate(selected.date)}</b> ·{" "}
            <span className="num">
              {formatFixed(selected.value, decimals)} {unit}
            </span>{" "}
            · média da semana{" "}
            <span className="num">
              {formatFixed(selectedWeek.average, decimals)}
            </span>
          </>
        ) : (
          "Toque no gráfico para ver os valores."
        )}
      </div>

      <div className="chart-wrap" ref={hostRef}>
        <svg
          aria-label={`Gráfico de ${metric.label}, média ${formatFixed(average, decimals)} ${unit}`}
          data-testid="trend-chart"
          height={HEIGHT}
          onPointerDown={select}
          onPointerMove={select}
          role="img"
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width={width}
        >
          {axis.ticks.map((tick) => (
            <g key={tick}>
              <line
                className="gridline"
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text
                className="ax"
                textAnchor="end"
                x={MARGIN.left - 6}
                y={y(tick) + 4}
              >
                {formatFixed(tick, tickDecimals)}
              </text>
            </g>
          ))}

          {[0, 1 / 3, 2 / 3, 1].map((fraction, index) => {
            const offset = Math.round(span * fraction)

            return (
              <text
                className="ax"
                key={fraction}
                textAnchor={
                  index === 0 ? "start" : index === 3 ? "end" : "middle"
                }
                x={x(offset)}
                y={HEIGHT - 6}
              >
                {formatAxisDate(shiftIsoDate(start, offset), long)}
              </text>
            )
          })}

          {points.map((point) => (
            <circle
              cx={pointX(point)}
              cy={y(point.value)}
              fill="var(--dot)"
              key={point.date}
              opacity={0.75}
              r={points.length > DENSE_POINTS ? 1.6 : 2.6}
            />
          ))}

          <polyline
            fill="none"
            points={weeks
              .map((week) => `${x(week.offset)},${y(week.average)}`)
              .join(" ")}
            stroke="var(--accent)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
          />

          {weeks.length <= MAX_WEEKLY_DOTS
            ? weeks.map((week) => (
                <circle
                  cx={x(week.offset)}
                  cy={y(week.average)}
                  fill="var(--accent)"
                  key={week.weekStartDate}
                  r={3.8}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              ))
            : null}

          {selected ? (
            <>
              <line
                data-testid="trend-marker"
                stroke="var(--fg-3)"
                strokeWidth={1}
                x1={pointX(selected)}
                x2={pointX(selected)}
                y1={MARGIN.top}
                y2={HEIGHT - MARGIN.bottom}
              />
              <circle
                cx={pointX(selected)}
                cy={y(selected.value)}
                fill="var(--surface)"
                r={5}
                stroke="var(--accent)"
                strokeWidth={2.5}
              />
            </>
          ) : null}

          <rect
            fill="transparent"
            height={HEIGHT}
            width={width - MARGIN.left}
            x={MARGIN.left}
            y={0}
          />
        </svg>
      </div>

      <div className="legend">
        <span>
          <i className="lg-dot" />
          Dia
        </span>
        <span>
          <i className="lg-line" />
          Média semanal
        </span>
      </div>
    </>
  )
}
