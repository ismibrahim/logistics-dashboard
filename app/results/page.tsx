"use client"


import { Download, Route as RouteIcon, Clock, Euro, Gauge, CheckCircle2, Timer, Truck, Users, Warehouse, Loader2, Scale, AlertTriangle, Cpu, Zap, RefreshCw, ChevronRight } from "lucide-react"
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
  "#ea580c", // orange
  "#9333ea", // purple
  "#0891b2", // cyan
  "#ca8a04", // yellow/gold
  "#16a34a", // green
  "#db2777", // pink
]

// Baut das MapPanel-"routes"-Format aus einem Solver-/Compare-Ergebnis
// (gemeinsame Form: {routes: [[vehicleId, nodeIds]], coordinates: {nodeId: [lat,lng]}}).
// Wird fuer den Haupt-/optimize-Lauf UND beide /compare-Seiten genutzt.
function buildMapRoutes(result: any, vehicles: any[]) {
  if (!result?.routes) return []

  return result.routes.map(([vehicleId, route]: [number, number[]], index: number) => ({
    id: vehicleId,
    vehicle: vehicles.find((v) => v.vehicle_id === vehicleId)?.license_plate ?? `Vehicle ${vehicleId}`,
    color: VEHICLE_COLORS[index % VEHICLE_COLORS.length],
    path: route.map((nodeId: number) => {
      const coords = result.coordinates[nodeId.toString()]
      return { lat: coords[0], lng: coords[1] }
    }),
  }))
}

// Baut die geordnete Stop-Liste (Depot -> Kunden -> Depot) pro Fahrzeug.
// vehicle_stats wird positionsgleich zu routes vom Backend befuellt (gleicher
// Solver-Lauf, gleiche Reihenfolge) - die vehicleId in routes[i][0] stammt aus
// einem anderen ID-Raum als vehicle_stats[i].vehicle_id, daher Pairing per Index.
function buildRouteDetails(result: any, vehicles: any[], customers: any[], depots: any[]) {
  if (!result?.routes) return []

  return result.routes.map(([vehicleId, nodeIds]: [number, number[]], index: number) => {
    const stops = nodeIds.map((nodeId: number) =>
      nodeId >= 1000
        ? { type: "depot" as const, label: depots.find((d) => d.depot_id === nodeId - 1000)?.name ?? `Depot ${nodeId}` }
        : {
            type: "customer" as const,
            id: nodeId,
            label: customers.find((c) => c.customer_id === nodeId)?.name ?? `Customer ${nodeId}`,
            demand: customers.find((c) => c.customer_id === nodeId)?.demand ?? 0,
          },
    )

    return {
      vehicleId,
      vehicle: vehicles.find((v) => v.vehicle_id === vehicleId)?.license_plate ?? `Vehicle ${vehicleId}`,
      color: VEHICLE_COLORS[index % VEHICLE_COLORS.length],
      startDepot: stops[0]?.type === "depot" ? stops[0].label : "—",
      stops,
      stats: result.vehicle_stats?.[index],
    }
  })
}

export default function ResultsPage() {
  const [solverResult, setSolverResult] = useState<any>(null)

  useEffect(() => {
    const data = localStorage.getItem("solverResult")

    if (data) {
      setSolverResult(JSON.parse(data))
    }
  }, [])

  const [vehicles, setVehicles] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [depots, setDepots] = useState<any[]>([])

  const [compareData, setCompareData] = useState<any>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)

  // Kunden-IDs fuer den Benchmark aus den Koordinaten des /optimize-Laufs
  // ableiten (Depot-Knoten sind >= 1000, siehe cvrp_solver.DEPOT_NODE_BASE) -
  // so braucht die Optimization-Page keine zusaetzliche customer_ids-Liste
  // an die Results-Page durchreichen.
  const customerIdsForCompare: number[] = solverResult?.coordinates
    ? Object.keys(solverResult.coordinates)
        .map(Number)
        .filter((id) => id < 1000)
    : []

  async function runCompare(customerIds: number[]) {
    if (customerIds.length === 0) return

    setCompareLoading(true)
    setCompareError(null)

    try {
      const query = customerIds.map((id) => `customer_ids=${id}`).join("&")
      const response = await fetch(`http://127.0.0.1:8000/compare?${query}`)
      const data = await response.json()
      setCompareData(data)
    } catch (error) {
      console.error(error)
      setCompareError("Backend nicht erreichbar")
    } finally {
      setCompareLoading(false)
    }
  }

  // Benchmark-Vergleich wird automatisch geladen, sobald der /optimize-Lauf
  // (solverResult) vorliegt - auf denselben Kunden wie oben.
  useEffect(() => {
    if (customerIdsForCompare.length > 0) {
      runCompare(customerIdsForCompare)
    }
  }, [solverResult])

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
useEffect(() => {
  fetch("http://127.0.0.1:8000/depots")
    .then(res => res.json())
    .then(data => setDepots(data))
}, [])

  const solverRoutes = buildMapRoutes(solverResult, vehicles)
  const exactCompareRoutes = buildMapRoutes(compareData?.exact, vehicles)
  const heuristicCompareRoutes = buildMapRoutes(compareData?.heuristic, vehicles)
  const routeDetails = buildRouteDetails(solverResult, vehicles, customers, depots)

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

        {/* Map: realer /optimize-Lauf (Multi-Depot, alle Constraints) */}
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Optimization Result</h2>
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
          <MapPanel
            className="h-[440px] rounded-none border-0"
            routes={solverRoutes}
            customers={mapCustomers}
            depots={mapDepots}
          />
          <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground">
            Routes are generated using real road network data from OpenRouteService and optimized using a Multi-Depot
            CVRP/VRPTW model.
          </p>
        </Card>

        {/* Solver vs. Heuristic Benchmark - vereinfachter Einzeldepot-Vergleich */}
        <Card className="gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Solver vs. Heuristic Benchmark</h2>
              <p className="text-xs text-muted-foreground">
                Vereinfachter Vergleich auf Einzeldepot-Basis ohne Zeitfenster — Routen können daher von der
                Multi-Depot-Optimierung oben abweichen. Aussagekräftig ist der direkte Distanz-/Kosten-Vergleich.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => runCompare(customerIdsForCompare)}
              disabled={compareLoading || customerIdsForCompare.length === 0}
            >
              {compareLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {compareLoading ? "Vergleiche…" : "Erneut vergleichen"}
            </Button>
          </div>

          {compareError && (
            <p className="text-sm text-destructive">{compareError}</p>
          )}

          {!compareError && compareNotSolved && (
            <p className="text-sm text-destructive">
              Vergleich nicht möglich (Status: {compareData.solver_status}).
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Cpu className="size-3.5" /> Exact Solver (MILP)
                </span>
              </div>
              <MapPanel
                className="h-[360px] rounded-none border-0"
                routes={exactCompareRoutes}
                customers={mapCustomers}
                depots={mapDepots}
              />
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Zap className="size-3.5" /> Nearest Neighbor (Heuristik)
                </span>
              </div>
              <MapPanel
                className="h-[360px] rounded-none border-0"
                routes={heuristicCompareRoutes}
                customers={mapCustomers}
                depots={mapDepots}
              />
            </Card>
          </div>

          {!compareError && !compareNotSolved && compareData && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Metric</th>
                    <th className="px-5 py-3 font-medium">Exact Solver (MILP)</th>
                    <th className="px-5 py-3 font-medium">Nearest Neighbor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium text-foreground">Total Distance</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.exact?.distance_km?.toFixed(2)} km</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.heuristic?.distance_km?.toFixed(2)} km</td>
                  </tr>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium text-foreground">Total Cost</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.exact?.cost?.toFixed(2)} €</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.heuristic?.cost?.toFixed(2)} €</td>
                  </tr>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium text-foreground">Runtime</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.exact?.runtime_s?.toFixed(3)} s</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.heuristic?.runtime_s?.toFixed(3)} s</td>
                  </tr>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium text-foreground">Gap</td>
                    <td className="px-5 py-3.5 text-muted-foreground">—</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {compareData.heuristic?.gap_percent != null ? `+${compareData.heuristic.gap_percent.toFixed(1)}%` : "–"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
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
        <div>
          <h2 className="text-sm font-semibold text-foreground">Route Details</h2>
          <p className="text-xs text-muted-foreground">
            Reihenfolge der Stops pro Fahrzeug — Depot zu Depot.
          </p>
        </div>

        <div className="space-y-4">
          {routeDetails.map((route: any) => (
            <div key={route.vehicleId} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: route.color }} />
                {route.vehicle} ({route.startDepot})
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                {route.stops.map((stop: any, i: number) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="size-3.5 shrink-0" />}
                    {stop.type === "depot" ? (
                      <span className="text-foreground">{stop.label}</span>
                    ) : (
                      <span>
                        {stop.label}{" "}
                        <span className="text-xs">
                          (#{stop.id}, {stop.demand} units)
                        </span>
                      </span>
                    )}
                  </span>
                ))}
              </div>
              {route.stats && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Distance: {route.stats.distance} km · Load: {route.stats.demand}/{route.stats.capacity} ·
                  Utilization: {route.stats.utilization}% · Cost: {route.stats.cost} €
                </p>
              )}
            </div>
          ))}
          {routeDetails.length === 0 && (
            <p className="text-sm text-muted-foreground">Keine Routen vorhanden.</p>
          )}
        </div>
      </Card>

      </div>
    </AppShell>
  )
}
