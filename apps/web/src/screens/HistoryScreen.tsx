import { useNavigate } from "react-router"

import { MeasurementHistory } from "./components/MeasurementHistory"
import { PageTitle } from "./components/PageTitle"
import { useMeasurementHistory } from "../hooks/useMeasurementHistory"
import { useRefreshOnResume } from "../hooks/useRefreshOnResume"

export function HistoryScreen() {
  const { loadMore, reload, remove, state } = useMeasurementHistory()
  const navigate = useNavigate()

  useRefreshOnResume(reload)

  return (
    <>
      <header className="app-header">
        <PageTitle>Histórico</PageTitle>
      </header>

      <MeasurementHistory
        onEditMeasurement={(date) => navigate(`/registro?data=${date}`)}
        onLoadMore={loadMore}
        onRemove={remove}
        state={state}
      />
    </>
  )
}
