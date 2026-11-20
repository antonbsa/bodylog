import { useLayoutEffect, useRef } from "react"
import { ChartLineUp } from "@phosphor-icons/react/dist/csr/ChartLineUp"
import { GearSix } from "@phosphor-icons/react/dist/csr/GearSix"
import { House } from "@phosphor-icons/react/dist/csr/House"
import { List } from "@phosphor-icons/react/dist/csr/List"
import { Plus } from "@phosphor-icons/react/dist/csr/Plus"
import { NavLink, useLocation } from "react-router"

import { useTabNavigate } from "../../hooks/useTabNavigate"
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
  const { replace } = useTabNavigate()

  return (
    <NavLink className="tab" end={end} replace={replace} to={to}>
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
  const { replace } = useTabNavigate()
  const { pathname } = useLocation()
  const barRef = useRef<HTMLDivElement>(null)

  // Publishes the bar height (safe area included) so toasts can sit above it.
  useLayoutEffect(() => {
    const bar = barRef.current
    const root = document.documentElement

    if (!bar) {
      return
    }

    const publish = () =>
      root.style.setProperty("--tabbar-h", `${bar.offsetHeight}px`)
    const observer = new ResizeObserver(publish)

    observer.observe(bar)
    publish()

    return () => {
      observer.disconnect()
      root.style.removeProperty("--tabbar-h")
    }
  }, [])

  return (
    <div className="tabbar" ref={barRef}>
      <nav aria-label="Navegação principal" className="tabbar-grid">
        <Tab end icon={House} label="Início" to="/" />
        <Tab icon={List} label="Histórico" to="/historico" />
        <NavLink
          aria-label="Registrar medida"
          className="tab-add"
          replace={replace}
          state={{ from: pathname }}
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
