import { Outlet } from "react-router"

import { TabBar } from "./components/TabBar"

export function TabLayout() {
  return (
    <div className="tab-layout">
      <main className="tab-main">
        <div className="screen-content">
          <Outlet />
        </div>
      </main>
      <TabBar />
    </div>
  )
}
