"use client"


import { Download, Route as RouteIcon, Clock, Euro, Gauge, CheckCircle2, Timer, Truck, Users, Warehouse, Loader2, Scale, AlertTriangle, Cpu, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Topbar } from "@/components/topbar"
import { PageHeader } from "@/components/page-header"
import { MapPanel } from "@/components/map-panel"
import { KpiCard } from "@/components/kpi-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"




const VEHICLE_COLORS = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#ea580c", // orange
  "#9333ea", // purple
  "#0891b2", // cyan
  "#ca8a04", // yellow/gold
  "#db2777", // pink
]

export default function ResultsPage() {
  const [solverResult, setSolverResult] = useState<any>(null)

  console.log("VEHICLE STATS:")
  console.log(solverResult?.vehicle_stats)

  useEffect(() => {
    const data = localStorage.getItem("solverResult")

    if (data) {
      console.log("Loaded Solver Result:", JSON.parse(data))
      setSolverResult(JSON.parse(data))
    }
  }, [])

  const [vehicles, setVehicles] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])

  const [compareData, setCompareData] = useState<any>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)

  async function runCompare() {
    setCompareLoading(true)
    setCompareError(null)

    try {
      const response = await fetch("http://127.0.0.1:8000/compare")
      const data = await response.json()
      setCompareData(data)
    } catch (error) {
      console.error(error)
      setCompareError("Backend nicht erreichbar")
    } finally {
      setCompareLoading(false)
    }
  }

  const compareNotSolved = compareData?.solved === false


useEffect(() => {
  fetch("http://127.0.0.1:8000/vehicles")
    .then(res => res.json())
    .then(data => setVehicles(data)) 
}, [])
useEffect(() => {
  fetch("http://127.0.0.1:8000/customers")
    .then(res => res.json())
    .then(data => setCustomers(data))
}, [])

  const solverRoutes =

  solverResult?.routes?.map(

    ([vehicleId, route]: [number, number[]], index: number) => ({

      id: vehicleId,

      vehicle: vehicles.find(
        v => v.vehicle_id === vehicleId
      )?.license_plate ?? `Vehicle ${vehicleId}`,

      color: VEHICLE_COLORS[index % VEHICLE_COLORS.length],

      path: route.map((nodeId: number) => {

        const coords =

          solverResult.coordinates[nodeId.toString()]

        return {

          lat: coords[0],

          lng: coords[1],

        }

      }),

    })

  ) || []
 
  const optimizationDetails = [
    { label: "Solver Status",value: solverResult?.status ?? "Loading",icon: CheckCircle2},
    { label: "Solver Runtime", value: "3.1s", icon: Timer },
    { label: "Vehicles Used", value: `${solverResult?.route_count ?? 0}`, icon: Truck },
    { label: "Customers Served",value: `${solverResult?.routes?.reduce((sum: number, [, route]: [number, number[]]) => sum + route.length - 2,0) ?? 0}`,icon: Users},
    { label: "Multi Depot Support", value: "Enabled", icon: Warehouse },
    { label: "Time Window Support", value: "Enabled", icon: Clock },
  ]

const totalCustomers =
  solverResult?.routes?.reduce(
    (sum: number, [, route]: [number, number[]]) =>
      sum + (route.length - 2),
    0
  ) ?? 0

const totalDemand = customers.reduce(
  (sum: number, customer: any) => sum + customer.demand,
  0
)

const totalCapacity = vehicles.reduce(
  (sum: number, vehicle: any) => sum + vehicle.capacity,
  0
)

const avgLoad =
  solverResult?.vehicle_stats?.length
    ? Math.round(
        solverResult.vehicle_stats.reduce(
          (sum: number, v: any) => sum + v.utilization,
          0
        ) / solverResult.vehicle_stats.length
      )
    : 0

const estimatedTime = Math.round(
  (solverResult?.distance ?? 0) / 60
)

const usedVehicles = solverResult?.route_count ?? 0



const avgCostPerKm =
  vehicles.length > 0
    ? vehicles.reduce(
        (sum: number, vehicle: any) => sum + vehicle.cost_per_km,
        0
      ) / vehicles.length
    : 0

const totalCost =
  solverResult?.vehicle_stats?.reduce(
    (sum: number, v: any) => sum + v.cost,
    0
  ) ?? 0
  
  return (
    <AppShell>
      <Topbar />
      <PageHeader
        title={solverResult?.distance? `Distance: ${solverResult.distance.toFixed(1)} km`: "Loading..."}
        description={
          solverResult
            ? `${solverResult.route_count} routes generated`
            : "Loading..."
        }
        actions={
          <div className="flex items-center gap-2">
            {solverResult?.method_used && (
              <Badge
                variant={solverResult.method_used === "exact" ? "default" : "secondary"}
                className="gap-1"
              >
                {solverResult.method_used === "exact" ? (
                  <Cpu className="size-3" />
                ) : (
                  <Zap className="size-3" />
                )}
                {solverResult.method_used === "exact" ? "Exakt" : "Heuristik"}
              </Badge>
            )}
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="size-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {solverResult?.solved === false && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Solver konnte keine gültige Lösung finden (Status: {solverResult.solver_status}).
            </p>
          </div>
        )}

        {solverResult?.auto_switched && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{solverResult.warning}</p>
          </div>
        )}

        {solverResult?.time_limit_reached && (
          <div className="flex items-start gap-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
            <Timer className="mt-0.5 size-4 shrink-0" />
            <p>
              Zeitlimit erreicht — beste gefundene Lösung, Gap:{" "}
              {solverResult.optimality_gap_percent?.toFixed(1) ?? "?"} %
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Total Distance" value={solverResult?.distance?.toFixed(1) ?? "0"} unit="km" icon={RouteIcon}/>
          <KpiCard label="Total Cost" value={totalCost} unit="€" icon={Euro} />
          <KpiCard label="Total Time" value={estimatedTime} unit="h" icon={Clock} />
          <KpiCard label="Avg. Load" value={avgLoad} unit="%" icon={Gauge} />
        </div>

        {/* Map */}
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Optimized Routes</h2>
              <p className="text-xs text-muted-foreground">Color-coded route paths across the network</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {solverRoutes.map((r:any) => (
                <span key={r.id} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1 w-4 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.vehicle}
                </span>
              ))}
            </div>
          </div>
          <MapPanel className="h-[440px] rounded-none border-0" routes={solverRoutes} />
          <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground">
            Routes are generated using real road network data from OpenRouteService and optimized using a Multi-Depot
            CVRP/VRPTW model.
          </p>
        </Card>

        {/* Optimization details */}
        <Card className="gap-4 p-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Optimization Details</h2>
            <p className="text-xs text-muted-foreground">Solver configuration and outcome for this run.</p>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
            {optimizationDetails.map((d) => (
              <div key={d.label} className="flex flex-col gap-1.5 bg-card p-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <d.icon className="size-3.5" />
                  {d.label}
                </span>
                <span className="text-sm font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      
        <Card className="gap-4 p-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Vehicle Statistics
            </h2>
            <p className="text-xs text-muted-foreground">
              Cost and utilization per vehicle.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Vehicle</th>
                  <th className="p-2 text-left">Distance</th>
                  <th className="p-2 text-left">Load</th>
                  <th className="p-2 text-left">Capacity</th>
                  <th className="p-2 text-left">Utilization</th>
                  <th className="p-2 text-left">Cost</th>
                </tr>
              </thead>

              <tbody>
                {solverResult?.vehicle_stats?.map((v: any) => (
                  <tr key={v.vehicle_id} className="border-b">
                    <td className="p-2">{v.license_plate}</td>
                    <td className="p-2">{v.distance} km</td>
                    <td className="p-2">{v.demand}</td>
                    <td className="p-2">{v.capacity}</td>
                    <td className="p-2">{v.utilization}%</td>
                    <td className="p-2">{v.cost} €</td>
                  </tr>
               ))}
            </tbody>
          </table>
        </div>
      </Card>

        <Card className="gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Solver Comparison
              </h2>
              <p className="text-xs text-muted-foreground">
                Exact Solver (MILP) vs. Nearest Neighbor heuristic.
              </p>
            </div>
            <Button size="sm" className="gap-2" onClick={runCompare} disabled={compareLoading}>
              {compareLoading ? <Loader2 className="size-4 animate-spin" /> : <Scale className="size-4" />}
              {compareLoading ? "Comparing…" : "Compare Solver vs Heuristic"}
            </Button>
          </div>

          {compareError && (
            <p className="text-sm text-destructive">
              {compareError}
            </p>
          )}

          {!compareError && compareNotSolved && (
            <p className="text-sm text-destructive">
              Solver konnte in der vorgegebenen Zeit keine Lösung finden (Status: {compareData.solver_status}).
            </p>
          )}

          {!compareError && !compareNotSolved && compareData && (
            <>
              <p className="text-xs text-muted-foreground">
                {compareData.num_customers} customers · Status: {compareData.solver_status}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Method</th>
                      <th className="px-5 py-3 font-medium">Distance (km)</th>
                      <th className="px-5 py-3 font-medium">Runtime (s)</th>
                      <th className="px-5 py-3 font-medium">Gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareData.results?.map((r: any) => (
                      <tr key={r.method} className="border-b border-border last:border-0 transition-colors hover:bg-accent/40">
                        <td className="px-5 py-3.5 font-medium text-foreground">{r.method}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{r.distance_km != null ? r.distance_km.toFixed(2) : "–"}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{r.runtime_s != null ? `${r.runtime_s.toFixed(2)}s` : "–"}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {r.gap_percent != null ? `+${r.gap_percent.toFixed(1)}%` : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

      </div>
    </AppShell>
  )
}
