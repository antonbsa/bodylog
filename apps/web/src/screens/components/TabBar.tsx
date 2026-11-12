import { ChartLineUp, GearSix, House, List, Plus } from "@phosphor-icons/react"
import { NavLink } from "react-router"

import { getTodayIsoDate } from "../../utils/date-format"

const TAB_ICON_SIZE = 24

function Tab({
  end,
  icon: Icon,
  label,
  to,
}: {
  end?: boolean
  icon: typeof House
  label: string
  to: string
}) {
  return (
    <NavLink className="tab" end={end} to={to}>
      {({ isActive }) => (
        <>
          <Icon
            aria-hidden="true"
            size={TAB_ICON_SIZE}
            weight={isActive ? "bold" : "regular"}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function TabBar() {
  return (
    <div className="tabbar">
      <nav aria-label="Navegação principal" className="tabbar-grid">
        <Tab end icon={House} label="Início" to="/" />
        <Tab icon={List} label="Histórico" to="/historico" />
        <NavLink
          aria-label="Registrar medida"
          className="tab-add"
          to={`/registro?data=${getTodayIsoDate()}`}
        >
          <Plus aria-hidden="true" size={26} weight="bold" />
        </NavLink>
        <Tab icon={ChartLineUp} label="Tendências" to="/tendencias" />
        <Tab icon={GearSix} label="Ajustes" to="/ajustes" />
      </nav>
    </div>
  )
}
