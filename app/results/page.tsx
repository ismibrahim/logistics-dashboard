"use client"


import { Download, Route as RouteIcon, Clock, Euro, Gauge, CheckCircle2, Timer, Truck, Users, Warehouse, Loader2, Scale, AlertTriangle, Cpu, Zap, RefreshCw, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Topbar } from "@/components/topbar"
import { PageHeader } from "@/components/page-header"
import { MapPanel } from "@/components/map-panel"
import { KpiCard } from "@/components/kpi-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"




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

// Wie lange CBC ueber das gewaehlte timeLimitSeconds hinaus noch fuer
// Modellaufbau/Routenextraktion braucht, bevor die Antwort beim Client
// ankommt - der client-seitige fetch-Timeout muss das einrechnen, sonst
// bricht der Browser die Verbindung vor dem Solver ab (siehe runExactSolver).
const EXACT_SOLVER_TIMEOUT_BUFFER_MS = 60_000

export default function ResultsPage() {
  const [solverResult, setSolverResult] = useState<any>(null)
  const [lastOptimizeRequest, setLastOptimizeRequest] = useState<any>(null)
  const [exactRunning, setExactRunning] = useState(false)
  const [exactError, setExactError] = useState<string | null>(null)

  useEffect(() => {
    const data = localStorage.getItem("solverResult")
    if (data) {
      setSolverResult(JSON.parse(data))
    }

    const lastRequest = localStorage.getItem("lastOptimizeRequest")
    if (lastRequest) {
      setLastOptimizeRequest(JSON.parse(lastRequest))
    }
  }, [])

  // Startet den exakten MILP-Solver als separaten, bewussten Schritt mit
  // denselben Auswahl-/Constraint-Parametern wie der vorausgegangene
  // Heuristik-Lauf (lastOptimizeRequest, von der Optimization-Seite
  // gespeichert). Synchroner Request wie /optimize generell - kein
  // Async/Polling -, daher bleibt solverResult (Heuristik) waehrend des
  // Laufs unveraendert sichtbar und wird erst bei Erfolg ersetzt.
  async function runExactSolver() {
    if (!lastOptimizeRequest) return

    setExactRunning(true)
    setExactError(null)

    const timeLimitSeconds = lastOptimizeRequest.timeLimitSeconds ?? 60
    const controller = new AbortController()
    // Client-Timeout muss ueber dem Solver-Zeitlimit liegen (sonst killt der
    // Browser den fetch, bevor CBC selbst abbricht und antwortet) - Zeitlimit
    // + fester Puffer fuer Modellaufbau, Routenextraktion und Netzwerk.
    const timeoutMs = timeLimitSeconds * 1000 + EXACT_SOLVER_TIMEOUT_BUFFER_MS
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch("http://127.0.0.1:8000/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lastOptimizeRequest, method: "exact" }),
        signal: controller.signal,
      })

      const data = await response.json()

      if (!response.ok) {
        setExactError(data?.detail ?? `Exakter Solver fehlgeschlagen (HTTP ${response.status})`)
        return
      }

      setSolverResult(data)
      localStorage.setItem("solverResult", JSON.stringify(data))
    } catch (error: any) {
      console.error(error)
      setExactError(
        error?.name === "AbortError"
          ? `Keine Antwort innerhalb von Zeitlimit + Puffer (${Math.round(timeoutMs / 1000)}s). ` +
            "Der Solver läuft im Backend ggf. noch weiter, die Verbindung wurde clientseitig beendet."
          : "Backend nicht erreichbar",
      )
    } finally {
      clearTimeout(timeoutId)
      setExactRunning(false)
    }
  }

  const [vehicles, setVehicles] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [depots, setDepots] = useState<any[]>([])

  const [compareData, setCompareData] = useState<any>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)
  // Sequenz-Guard: /compare kann bis zu COMPARE_TIME_LIMIT_S (300s) dauern -
  // ueberlappende Aufrufe (z.B. initialer Load + spaeterer "Erneut
  // vergleichen"-Klick) koennen daher in beliebiger Reihenfolge antworten.
  // Nur die Antwort des zuletzt GESTARTETEN Calls darf den State setzen,
  // sonst kann eine aeltere, aber langsamere Antwort eine bereits aktuellere
  // ueberschreiben (siehe Diagnose: gerenderte "Render-Reste" eines frueheren
  // Laufs trotz fehlgeschlagenem neuem Compare-Versuch).
  const compareRequestIdRef = useRef(0)
  const compareAbortRef = useRef<AbortController | null>(null)
  // /compare soll automatisch nur EINMAL pro Results-Besuch laufen (beim
  // ersten eintreffenden solverResult, typischerweise die Heuristik) - nicht
  // erneut bei jedem spaeteren solverResult-Wechsel (z.B. nach
  // runExactSolver()). Sonst wuerde jeder "Run Exact Solver"-Klick
  // unaufgefordert einen weiteren bis zu 300s langen Compare-Call ausloesen.
  // Manuelles Neu-Vergleichen bleibt ueber den "Erneut vergleichen"-Button
  // jederzeit moeglich.
  const hasAutoComparedRef = useRef(false)

  // Kunden-IDs fuer den Benchmark aus den Koordinaten des /optimize-Laufs
  // ableiten (Depot-Knoten sind >= 1000, siehe cvrp_solver.DEPOT_NODE_BASE) -
  // so braucht die Optimization-Page keine zusaetzliche customer_ids-Liste
  // an die Results-Page durchreichen.
  const customerIdsForCompare: number[] = solverResult?.coordinates
    ? Object.keys(solverResult.coordinates)
        .map(Number)
        .filter((id) => id < 1000)
    : []

  // Welche Kunden tatsaechlich Teil des aktuellen /optimize-Laufs sind, steckt
  // ausschliesslich im coordinates-Key (siehe customerIdsForCompare oben) -
  // beide Seiten werden ueber Number() verglichen, da customer_id ueber
  // JSON-Roundtrips theoretisch als String ankommen koennte.
  const routedCustomerIds = new Set(customerIdsForCompare.map(Number))
  const hasRoutingInfo = customerIdsForCompare.length > 0
  const [showUnroutedCustomers, setShowUnroutedCustomers] = useState(true)

  async function runCompare(customerIds: number[]) {
    if (customerIds.length === 0) return

    // Eine evtl. noch laufende aeltere Anfrage abbrechen (bricht clientseitig
    // die Verbindung ab; der Backend-Solver selbst laeuft synchron weiter,
    // aber die veraltete Antwort wird dadurch schneller verworfen) und den
    // Request-Zaehler erhoehen, bevor der neue fetch rausgeht.
    compareAbortRef.current?.abort()
    const controller = new AbortController()
    compareAbortRef.current = controller
    const requestId = ++compareRequestIdRef.current

    // State sofort leeren, BEVOR der neue Call raus geht - waehrend der
    // (bis zu 300s) Wartezeit soll kein alter Stand sichtbar bleiben, sondern
    // ein klarer Lade-/Leerzustand (siehe Per-Karte-Platzhalter unten).
    setCompareData(null)
    setCompareLoading(true)
    setCompareError(null)

    try {
      const params = new URLSearchParams()
      customerIds.forEach((id) => params.append("customer_ids", String(id)))
      ;(lastOptimizeRequest?.depot_ids ?? []).forEach((id: number) =>
        params.append("depot_ids", String(id))
      )
      ;(lastOptimizeRequest?.vehicle_ids ?? []).forEach((id: number) =>
        params.append("vehicle_ids", String(id))
      )
      // Einheitliches Zeitlimit: derselbe Wert wie der exakte Solver (/optimize).
      params.append("time_limit_s", String(lastOptimizeRequest?.timeLimitSeconds ?? 60))
      const response = await fetch(`http://127.0.0.1:8000/compare?${params.toString()}`, {
        signal: controller.signal,
      })
      const data = await response.json()

      if (requestId !== compareRequestIdRef.current) return // laengst ueberholt, verwerfen

      setCompareData(data)
    } catch (error: any) {
      if (requestId !== compareRequestIdRef.current) return
      if (error?.name !== "AbortError") {
        console.error(error)
        setCompareError("Backend nicht erreichbar")
      }
    } finally {
      if (requestId === compareRequestIdRef.current) {
        setCompareLoading(false)
      }
    }
  }

  // Benchmark-Vergleich wird automatisch genau EINMAL pro Results-Besuch
  // geladen, sobald der erste /optimize-Lauf (solverResult) vorliegt - nicht
  // erneut bei jedem spaeteren solverResult-Wechsel (z.B. nach
  // runExactSolver()). Erneuter Vergleich nur noch explizit ueber den
  // "Erneut vergleichen"-Button.
  useEffect(() => {
    if (customerIdsForCompare.length > 0 && !hasAutoComparedRef.current) {
      hasAutoComparedRef.current = true
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
  const cwCompareRoutes = buildMapRoutes(compareData?.clarke_wright, vehicles)
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

  // /compare nutzt seit dem Multi-Depot-Fix dieselben Depots/Fahrzeuge wie
  // /optimize - "coordinates" im Backend-Ergebnis enthaelt aber immer ALLE
  // Depots (solve_cvrp()/nearest_neighbor_mdvrp() laden depots.csv intern
  // ungefiltert, siehe notes/known_issues.md Punkt 3), nicht nur die
  // tatsaechlich genutzten. Die Marker auf den Compare-Karten sollen daher
  // nur die Depots zeigen, die in den jeweiligen "routes" auch wirklich
  // vorkommen (Knoten-ID >= 1000, siehe DEPOT_NODE_BASE) - sonst wirkt ein
  // geografisch nahes, aber ungenutztes Depot wie ein falscher Routenstart
  // (siehe Diagnose Bug 2).
  function depotsUsedInRoutes(result: any): any[] {
    const usedDepotIds = new Set<number>(
      (result?.routes ?? []).flatMap(([, route]: [number, number[]]) =>
        route.filter((nodeId) => nodeId >= 1000).map((nodeId) => nodeId - 1000)
      )
    )
    return mapDepots.filter((d: any) => usedDepotIds.has(Number(d.id)))
  }

  const exactCompareDepot = depotsUsedInRoutes(compareData?.exact)
  const heuristicCompareDepot = depotsUsedInRoutes(compareData?.heuristic)
  const cwCompareDepot = depotsUsedInRoutes(compareData?.clarke_wright)

  // Toggle wirkt nur auf die Kunden-Marker; Depots bleiben immer sichtbar.
  // Ohne eindeutige Routing-Info (hasRoutingInfo === false) immer alle zeigen,
  // statt versehentlich alles auszublenden.
  const visibleMapCustomers =
    showUnroutedCustomers || !hasRoutingInfo
      ? mapCustomers
      : mapCustomers.filter((c: any) => routedCustomerIds.has(Number(c.customer_id)))

  const optimizationDetails = [
    { label: "Solver Status",value: solverResult?.status ?? "Loading",icon: CheckCircle2},
    { label: "Solver Runtime", value: typeof solverResult?.runtime_s === "number" ? `${solverResult.runtime_s.toFixed(2)}s` : "–", icon: Timer },
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

const hasResult =
  solverResult != null &&
  typeof solverResult.distance === "number" &&
  Array.isArray(solverResult.routes)



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
        title={
          solverResult == null
            ? "Loading..."
            : hasResult
              ? `Distance: ${solverResult.distance.toFixed(1)} km`
              : "No result available"
        }
        description={
          solverResult == null
            ? "Loading..."
            : hasResult
              ? `${solverResult.route_count} routes generated`
              : "Optimization did not produce a route plan"
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
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={runExactSolver}
              disabled={exactRunning || !lastOptimizeRequest}
              title={!lastOptimizeRequest ? "Kein gespeicherter Optimierungs-Request gefunden" : undefined}
            >
              {exactRunning ? <Loader2 className="size-4 animate-spin" /> : <Cpu className="size-4" />}
              {exactRunning ? "Exakter Solver läuft…" : "Run Exact Solver"}
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="size-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {exactRunning && (
          <div className="flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
            <p>
              Exakter Solver läuft noch… (Zeitlimit: {lastOptimizeRequest?.timeLimitSeconds ?? 60}s).
              Kann je nach Instanzgröße und Zeitlimit deutlich länger dauern - das Heuristik-Ergebnis
              unten bleibt bis dahin sichtbar und wird erst beim Eintreffen des exakten Ergebnisses ersetzt.
            </p>
          </div>
        )}

        {exactError && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>Exakter Solver fehlgeschlagen: {exactError}</p>
          </div>
        )}

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
          <KpiCard label="Total Distance" value={hasResult ? solverResult.distance.toFixed(1) : "–"} unit="km" icon={RouteIcon}/>
          <KpiCard label="Total Cost" value={hasResult ? totalCost : "–"} unit="€" icon={Euro} />
          <KpiCard label="Total Time" value={hasResult ? estimatedTime : "–"} unit="h" icon={Clock} />
          <KpiCard label="Avg. Load" value={hasResult ? avgLoad : "–"} unit="%" icon={Gauge} />
        </div>

        {/* Plausibilitätsprüfung */}
        {solverResult?.validation && (() => {
          // Kein Solver-Ergebnis (z.B. exakter Solver lief ins Zeitlimit ohne
          // zulässige Lösung, distance===null) -> alle Kunden erscheinen als
          // "fehlend", was technisch korrekt aber als rotes FAIL irrefuehrend
          // waere (sieht nach Bug aus statt nach erwarteter Skalierungsgrenze).
          // Solche Faelle neutral als "nicht anwendbar" statt FAIL anzeigen.
          const notApplicable = solverResult.distance == null
          const passed = solverResult.validation.passed

          return (
            <Card className="gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Plausibilitätsprüfung</h2>
                  <p className="text-xs text-muted-foreground">
                    Kunden, Kapazität, Depot-Start/Ende, Gesamtnachfrage vs. Gesamtkapazität
                  </p>
                </div>
                <Badge
                  variant={notApplicable ? "outline" : passed ? "secondary" : "destructive"}
                  className="gap-1.5"
                >
                  {notApplicable ? (
                    <AlertTriangle className="size-3.5" />
                  ) : passed ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <AlertTriangle className="size-3.5" />
                  )}
                  {notApplicable ? "Nicht anwendbar" : passed ? "PASS" : "FAIL"}
                </Badge>
              </div>
              {notApplicable && (
                <p className="text-xs text-muted-foreground">
                  Solver fand keine zulässige Lösung (Status: {solverResult.status}) – keine Routen zu prüfen.
                </p>
              )}
              {!notApplicable && !passed && (
                <ul className="space-y-1 text-xs text-destructive">
                  {Object.entries(solverResult.validation.checks ?? {})
                    .filter(([, check]: [string, any]) => !check.passed)
                    .map(([name]) => (
                      <li key={name}>• {name}</li>
                    ))}
                </ul>
              )}
            </Card>
          )
        })()}

        {/* Map: realer /optimize-Lauf (Multi-Depot, alle Constraints) */}
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Optimization Result</h2>
              <p className="text-xs text-muted-foreground">Color-coded route paths across the network</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                {solverRoutes.map((r:any) => (
                  <span key={r.id} className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-1 w-4 rounded-full" style={{ backgroundColor: r.color }} />
                    {r.vehicle}
                  </span>
                ))}
              </div>
              <label className="flex items-center gap-2 text-muted-foreground" title="Kunden, die in keiner Route dieses Laufs vorkommen, ein- oder ausblenden">
                <Switch
                  checked={showUnroutedCustomers}
                  onCheckedChange={setShowUnroutedCustomers}
                  disabled={!hasRoutingInfo}
                />
                Nicht beroutete Kunden anzeigen
              </label>
            </div>
          </div>
          <MapPanel
            className="h-[440px] rounded-none border-0"
            routes={solverRoutes}
            customers={visibleMapCustomers}
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
              <p
                className="mt-1 text-xs text-muted-foreground"
                title="Der Vergleich nutzt dasselbe Zeitlimit wie der exakte Solver (Feld auf der Optimization-Seite)."
              >
                Zeitlimit (exakter Solver): <span className="font-medium text-foreground">{lastOptimizeRequest?.timeLimitSeconds ?? 60}s</span>
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Cpu className="size-3.5" /> Exact Solver (MILP)
                </span>
              </div>
              {compareData?.exact ? (
                <MapPanel
                  className="h-[360px] rounded-none border-0"
                  routes={exactCompareRoutes}
                  customers={mapCustomers}
                  depots={exactCompareDepot}
                />
              ) : (
                <div className="flex h-[360px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  {compareLoading ? "Vergleiche…" : "Kein Ergebnis (exakter Solver hat keine Lösung gefunden)."}
                </div>
              )}
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Zap className="size-3.5" /> Nearest Neighbor (Heuristik)
                </span>
              </div>
              {compareData?.heuristic ? (
                <MapPanel
                  className="h-[360px] rounded-none border-0"
                  routes={heuristicCompareRoutes}
                  customers={mapCustomers}
                  depots={heuristicCompareDepot}
                />
              ) : (
                <div className="flex h-[360px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  {compareLoading ? "Vergleiche…" : "Kein Ergebnis."}
                </div>
              )}
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Zap className="size-3.5" /> Clarke-Wright + 2-Opt + Or-Opt (Heuristik)
                </span>
              </div>
              {compareData?.clarke_wright ? (
                <MapPanel
                  className="h-[360px] rounded-none border-0"
                  routes={cwCompareRoutes}
                  customers={mapCustomers}
                  depots={cwCompareDepot}
                />
              ) : (
                <div className="flex h-[360px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  {compareLoading ? "Vergleiche…" : "Kein Ergebnis."}
                </div>
              )}
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
                    <th className="px-5 py-3 font-medium">Clarke-Wright + 2-Opt + Or-Opt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium text-foreground">Total Distance</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.exact?.distance_km?.toFixed(2)} km</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.heuristic?.distance_km?.toFixed(2)} km</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.clarke_wright?.distance_km?.toFixed(2)} km</td>
                  </tr>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium text-foreground">Total Cost</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.exact?.cost?.toFixed(2)} €</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.heuristic?.cost?.toFixed(2)} €</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.clarke_wright?.cost?.toFixed(2)} €</td>
                  </tr>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium text-foreground">Runtime</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.exact?.runtime_s?.toFixed(3)} s</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.heuristic?.runtime_s?.toFixed(3)} s</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{compareData.clarke_wright?.runtime_s?.toFixed(3)} s</td>
                  </tr>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium text-foreground">Gap</td>
                    <td className="px-5 py-3.5 text-muted-foreground">—</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {compareData.heuristic?.gap_percent != null ? `${compareData.heuristic.gap_percent >= 0 ? "+" : ""}${compareData.heuristic.gap_percent.toFixed(1)}%` : "–"}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {compareData.clarke_wright?.gap_percent != null ? `${compareData.clarke_wright.gap_percent >= 0 ? "+" : ""}${compareData.clarke_wright.gap_percent.toFixed(1)}%` : "–"}
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
