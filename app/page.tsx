"use client"

import { Users, Truck, Warehouse, Route as RouteIcon, Gauge, CheckCircle2, Clock, MapPin } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Topbar } from "@/components/topbar"
import { PageHeader } from "@/components/page-header"
import { KpiCard } from "@/components/kpi-card"
import { MapPanel } from "@/components/map-panel"
import { TechnologyCards } from "@/components/technology-cards"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"




export default function DashboardPage() {
  const [customers, setCustomers] = useState([])
const [vehicles, setVehicles] = useState([])
const [depots, setDepots] = useState([])

const [solverResult, setSolverResult] = useState<any>(null)

useEffect(() => {
  const data = localStorage.getItem("solverResult")

  if (data) {
    setSolverResult(JSON.parse(data))
  }
}, [])

useEffect(() => {
  fetch("http://127.0.0.1:8000/customers")
    .then(res => res.json())
    .then(data => setCustomers(data))

  fetch("http://127.0.0.1:8000/vehicles")
    .then(res => res.json())
    .then(data => setVehicles(data))

  fetch("http://127.0.0.1:8000/depots")
    .then(res => res.json())
    .then(data => setDepots(data))

  const data = localStorage.getItem("solverResult")

  if (data) {
    setSolverResult(JSON.parse(data))
  }
}, [])

const mapCustomers = customers.map((c: any) => ({
  ...c,
  id: c.customer_id,
  lat: c.latitude,
  lng: c.longitude,
}))

const mapDepots = depots.map((d: any) => ({
  ...d,
  id: d.depot_id,
  lat: d.latitude,
  lng: d.longitude,
}))

console.log("CUSTOMERS", mapCustomers)
console.log("DEPOTS", mapDepots)

const avgUtilization =
  vehicles.length > 0 && customers.length > 0 && solverResult?.routes
    ? Math.round(
        (solverResult.routes.reduce(
          (sum: number, [, route]: [number, number[]]) =>
            sum + (route.length - 2),
          0
        ) /
          customers.length) *
          100
      )
    : 0

  return (
    <AppShell>
      <Topbar />
      <PageHeader
        title="Operations Dashboard"
        description="Live overview of your fleet, depots and active delivery routes."
        actions={<Button size="sm">New Optimization</Button>}
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
          <KpiCard label="Customers" value={customers.length} icon={Users} />
          <KpiCard label="Vehicles" value={vehicles.length} icon={Truck} />
          <KpiCard label="Depots" value={depots.length} icon={Warehouse} />
          <KpiCard label="Total Distance" value={solverResult?.distance?.toFixed(1) ?? "-"} unit="km" icon={RouteIcon} />
          <KpiCard label="Avg. Utilization" value={avgUtilization} unit="%" icon={Gauge}/>
        </div>

        {/* Map + side stats */}
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="overflow-hidden p-0 xl:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Live Network Map</h2>
                <p className="text-xs text-muted-foreground">{0} stops across {depots.length} depots</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#1e3a8a]" />Depot</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" />High</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#0891b2]" />Medium</span>
              </div>
            </div>
            <MapPanel
              className="h-[460px] rounded-none border-0"
              customers={mapCustomers}
              depots={mapDepots}
              routes={[]}
            />
          </Card>

          <div className="space-y-6">
            {/* Optimization status */}
            {/* Optimization status */}
            <Card className="gap-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Optimization Status
                </h2>
                <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                  <CheckCircle2 className="size-3.5" />
                  Solved
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last run</span>
                  <span className="font-medium text-foreground">Today, 06:42</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Routes generated</span>
                  <span className="font-medium text-foreground">{solverResult?.route_count ?? 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stops assigned</span>
                  <span className="font-medium text-foreground">{solverResult?.routes?.reduce((sum: number, [, route]: [number, number[]]) => sum + route.length - 2,0) ?? 0}                
                </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Solver gap</span>
                  <span className="font-medium text-foreground">1.4%</span>
                </div>
              </div>
            </Card>

</div>
</div>

<TechnologyCards />

</div>
</AppShell>
)
}