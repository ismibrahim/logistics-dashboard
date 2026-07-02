"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Clock, RotateCcw, Timer, Play, Loader2, Settings2, Users, Truck, Warehouse, AlertTriangle, Zap } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Topbar } from "@/components/topbar"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"


export default function OptimizationPage() {
  const router = useRouter()
  const [timeWindows, setTimeWindows] = useState(false)
  const [returnToDepot, setReturnToDepot] = useState(true)
  const [balanceLoad, setBalanceLoad] = useState(false)
  const [useHeuristicWarmstart, setUseHeuristicWarmstart] = useState(true)
  const [twOverrides, setTwOverrides] = useState<Array<{ cid: number | ""; start: string; end: string }>>([])
  const [maxDuration, setMaxDuration] = useState([99999])
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(60)
  const [running, setRunning] = useState(false)
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [depots, setDepots] = useState([])
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<number>>(new Set())
  const [selectedDepotIds, setSelectedDepotIds] = useState<Set<number>>(new Set())
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<number>>(new Set())
  const [optimizeError, setOptimizeError] = useState<string | null>(null)

useEffect(() => {
  fetch("http://127.0.0.1:8000/customers")
    .then(res => res.json())
    .then(data => {
      setCustomers(data)
      setSelectedCustomerIds(new Set(data.map((c: any) => c.customer_id)))
    })

  fetch("http://127.0.0.1:8000/vehicles")
    .then(res => res.json())
    .then(data => {
      setVehicles(data)
      setSelectedVehicleIds(new Set(data.map((v: any) => v.vehicle_id)))
    })

  fetch("http://127.0.0.1:8000/depots")
    .then(res => res.json())
    .then(data => {
      setDepots(data)
      setSelectedDepotIds(new Set(data.map((d: any) => d.depot_id)))
    })
}, [])

function toggleCustomer(id: number, checked: boolean) {
  setSelectedCustomerIds((prev) => {
    const next = new Set(prev)
    if (checked) next.add(id)
    else next.delete(id)
    return next
  })
}

function toggleAllCustomers() {
  setSelectedCustomerIds((prev) =>
    prev.size === customers.length
      ? new Set()
      : new Set(customers.map((c: any) => c.customer_id)),
  )
}

function toggleDepot(id: number, checked: boolean) {
  setSelectedDepotIds((prev) => {
    const next = new Set(prev)
    if (checked) next.add(id)
    else next.delete(id)
    return next
  })
}

function toggleAllDepots() {
  setSelectedDepotIds((prev) =>
    prev.size === depots.length
      ? new Set()
      : new Set(depots.map((d: any) => d.depot_id)),
  )
}

function toggleVehicle(id: number, checked: boolean) {
  setSelectedVehicleIds((prev) => {
    const next = new Set(prev)
    if (checked) next.add(id)
    else next.delete(id)
    return next
  })
}

function toggleAllVehicles() {
  setSelectedVehicleIds((prev) =>
    prev.size === vehicles.length
      ? new Set()
      : new Set(vehicles.map((v: any) => v.vehicle_id)),
  )
}

// Heuristik laeuft immer als erster, garantierter Schritt (Nearest Neighbor,
// unabhaengig von der Kundenzahl - kein automatischer Threshold mehr). Der
// exakte MILP-Solver ist ein separater, bewusster Schritt und wird erst auf
// der Results-Seite per "Run Exact Solver" gestartet (dort bleibt das
// Heuristik-Ergebnis waehrend des exakten Laufs sichtbar). Die hier
// verwendeten Request-Parameter werden mitgespeichert, damit die
// Results-Seite denselben Request mit method="exact" wiederholen kann.
async function runHeuristic() {
  setRunning(true)
  setOptimizeError(null)

  try {
    const allSelected = selectedCustomerIds.size === customers.length
    // Zeitfenster-Overrides: nur gueltige Zeilen, nur wenn timeWindows an.
    const validOverrides = twOverrides.filter(
      (o) =>
        o.cid !== "" &&
        /^\d{2}:\d{2}$/.test(o.start) &&
        /^\d{2}:\d{2}$/.test(o.end) &&
        o.start < o.end,
    )
    const timeWindowOverrides =
      timeWindows && validOverrides.length > 0
        ? Object.fromEntries(
            validOverrides.map((o) => [o.cid, { tw_start: o.start, tw_end: o.end }]),
          )
        : undefined
    const requestBody = {
      returnToDepot,
      timeWindows,
      timeWindowOverrides,
      balanceLoad,
      useHeuristicWarmstart,
      maxDuration: maxDuration[0],
      timeLimitSeconds,
      objective: "distance",
      customer_ids: allSelected ? undefined : Array.from(selectedCustomerIds),
      depot_ids: selectedDepotIds.size === depots.length ? undefined : Array.from(selectedDepotIds),
      vehicle_ids: selectedVehicleIds.size === vehicles.length ? undefined : Array.from(selectedVehicleIds),
    }

    const response = await fetch("http://127.0.0.1:8000/optimize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...requestBody, method: "heuristic" }),
    })

    const data = await response.json()

    console.log("RESPONSE STATUS:", response.status)
    console.log("SOLVER DATA:", data)

    if (!response.ok) {
      // Request konnte nicht einmal an den Solver uebergeben werden (z.B.
      // Konfigurationsfehler wie ein Fahrzeug ohne Depot-Zuordnung) - kein
      // Navigieren zu /results mit einem kaputten Objekt, Fehler bleibt hier
      // sichtbar.
      setOptimizeError(data?.detail ?? `Optimierung fehlgeschlagen (HTTP ${response.status})`)
      return
    }

    localStorage.setItem("solverResult", JSON.stringify(data))
    // requestBody (ohne method) wird separat gespeichert, damit die
    // Results-Seite denselben Request spaeter mit method="exact" erneut
    // schicken kann, ohne die Auswahl auf der Optimization-Seite zu kennen.
    localStorage.setItem("lastOptimizeRequest", JSON.stringify(requestBody))
    router.push("/results")
  } catch (error) {
    console.error(error)
    alert("Backend nicht erreichbar")
  } finally {
    setRunning(false)
  }
}

const noCustomersSelected = selectedCustomerIds.size === 0
const allCustomersSelected = customers.length > 0 && selectedCustomerIds.size === customers.length
const noDepotsSelected = selectedDepotIds.size === 0
const allDepotsSelected = depots.length > 0 && selectedDepotIds.size === depots.length
const noVehiclesSelected = selectedVehicleIds.size === 0
const allVehiclesSelected = vehicles.length > 0 && selectedVehicleIds.size === vehicles.length
const selectedDemand = customers
  .filter((c: any) => selectedCustomerIds.has(c.customer_id))
  .reduce((sum: number, c: any) => sum + c.demand, 0)

  const hours = Math.floor(maxDuration[0] / 60)
  const mins = maxDuration[0] % 60

  return (
    <AppShell>
      <Topbar />
      <PageHeader
        title="Route Optimization"
        description="Configure constraints and run the solver to generate optimal routes."
      />

      <div className="flex-1 overflow-y-auto p-6">
        {optimizeError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>Optimierung konnte nicht gestartet werden: {optimizeError}</p>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Customer selection */}
            <Card className="gap-4 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Customers</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleAllCustomers}>
                  {allCustomersSelected ? "Deselect all" : "Select all"}
                </Button>
              </div>
              <Separator />
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {customers.map((c: any) => (
                  <label
                    key={c.customer_id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomerIds.has(c.customer_id)}
                      onChange={(e) => toggleCustomer(c.customer_id, e.target.checked)}
                    />
                    <span className="text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">#{c.customer_id}</span>
                  </label>
                ))}
              </div>
              {noCustomersSelected && (
                <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  Mindestens einen Kunden auswählen.
                </p>
              )}
            </Card>

            {/* Depot selection */}
            <Card className="gap-4 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Warehouse className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Depots</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleAllDepots}>
                  {allDepotsSelected ? "Deselect all" : "Select all"}
                </Button>
              </div>
              <Separator />
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {depots.map((d: any) => (
                  <label
                    key={d.depot_id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepotIds.has(d.depot_id)}
                      onChange={(e) => toggleDepot(d.depot_id, e.target.checked)}
                    />
                    <span className="text-foreground">{d.name}</span>
                    <span className="text-xs text-muted-foreground">#{d.depot_id}</span>
                  </label>
                ))}
              </div>
              {noDepotsSelected && (
                <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  Mindestens ein Depot auswählen.
                </p>
              )}
            </Card>

            {/* Vehicle selection */}
            <Card className="gap-4 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Vehicles</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleAllVehicles}>
                  {allVehiclesSelected ? "Deselect all" : "Select all"}
                </Button>
              </div>
              <Separator />
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {vehicles.map((v: any) => (
                  <label
                    key={v.vehicle_id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVehicleIds.has(v.vehicle_id)}
                      onChange={(e) => toggleVehicle(v.vehicle_id, e.target.checked)}
                    />
                    <span className="text-foreground">{v.license_plate}</span>
                    <span className="text-xs text-muted-foreground">#{v.vehicle_id}</span>
                  </label>
                ))}
              </div>
              {noVehiclesSelected && (
                <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  Mindestens ein Fahrzeug auswählen.
                </p>
              )}
            </Card>

            {/* Constraints */}
            <Card className="gap-5 p-6">
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Constraints</h2>
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Respect time windows</p>
                    <p className="text-xs text-muted-foreground">Deliveries must arrive within each customer&apos;s window</p>
                  </div>
                </div>
                <Switch checked={timeWindows} onCheckedChange={setTimeWindows} />
              </div>

              {timeWindows && (
                <div className="ml-8 space-y-2 rounded-md border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-foreground">Zeitfenster-Overrides (max. 3 Kunden)</p>
                  {twOverrides.map((o, i) => {
                    const invalid =
                      o.cid !== "" &&
                      (!/^\d{2}:\d{2}$/.test(o.start) || !/^\d{2}:\d{2}$/.test(o.end) || o.start >= o.end)
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <select
                          value={o.cid}
                          onChange={(e) =>
                            setTwOverrides((prev) =>
                              prev.map((x, j) =>
                                j === i ? { ...x, cid: e.target.value === "" ? "" : Number(e.target.value) } : x,
                              ),
                            )
                          }
                          className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground"
                        >
                          <option value="">Kunde…</option>
                          {customers.map((c: any) => (
                            <option key={c.customer_id} value={c.customer_id}>
                              {c.customer_id} — {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="HH:MM"
                          value={o.start}
                          onChange={(e) =>
                            setTwOverrides((prev) => prev.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))
                          }
                          className="w-16 rounded-md border border-input bg-background px-2 py-1 text-center text-xs text-foreground"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input
                          type="text"
                          placeholder="HH:MM"
                          value={o.end}
                          onChange={(e) =>
                            setTwOverrides((prev) => prev.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))
                          }
                          className="w-16 rounded-md border border-input bg-background px-2 py-1 text-center text-xs text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => setTwOverrides((prev) => prev.filter((_, j) => j !== i))}
                          className="px-1 text-muted-foreground hover:text-destructive"
                          aria-label="Zeile entfernen"
                        >
                          ×
                        </button>
                        {invalid && <span className="text-[10px] text-destructive">ungültig</span>}
                      </div>
                    )
                  })}
                  {twOverrides.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setTwOverrides((prev) => [...prev, { cid: "", start: "", end: "" }])}
                      className="text-xs text-primary hover:underline"
                    >
                      + Zeile hinzufügen
                    </button>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Servicezeit kommt aus den Stammdaten. Format HH:MM, tw_start &lt; tw_end.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <RotateCcw className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Return to depot</p>
                    <p className="text-xs text-muted-foreground">Vehicles end their route back at the origin depot</p>
                  </div>
                </div>
                <Switch checked={returnToDepot} onCheckedChange={setReturnToDepot} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Balance vehicle load</p>
                    <p className="text-xs text-muted-foreground">Distribute demand evenly across the fleet</p>
                  </div>
                </div>
                <Switch checked={balanceLoad} onCheckedChange={setBalanceLoad} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Heuristik-Warmstart</p>
                    <p className="text-xs text-muted-foreground">Exakter Solver startet mit der Heuristik-Lösung als MIP-Start — i. d. R. schneller bei größeren Instanzen (ohne Zeitfenster)</p>
                  </div>
                </div>
                <Switch checked={useHeuristicWarmstart} onCheckedChange={setUseHeuristicWarmstart} />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="size-5 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Maximum route duration</p>
                  </div>
                  <span className="rounded-md bg-accent px-2.5 py-1 text-sm font-semibold text-accent-foreground">
                    {hours}h {mins.toString().padStart(2, "0")}m
                  </span>
                </div>
                <Slider
                  value={maxDuration}
                  onValueChange={(v) => setMaxDuration(Array.isArray(v) ? [...v] : [v as number])}
                  min={60}
                  max={480}
                  step={15}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1h</span>
                  <span>8h</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Summary + run */}
          <div className="space-y-6">
            <Card className="gap-4 p-6">
              <h2 className="text-sm font-semibold text-foreground">Problem Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" />Customers</span>
                  <span className="font-medium text-foreground">{selectedCustomerIds.size} / {customers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground"><Truck className="size-4" />Vehicles</span>
                  <span className="font-medium text-foreground">{selectedVehicleIds.size} / {vehicles.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground"><Warehouse className="size-4" />Depots</span>
                  <span className="font-medium text-foreground">{selectedDepotIds.size} / {depots.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Selected</span>
                  <span className="font-medium text-foreground">{selectedCustomerIds.size} Kunden</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total demand</span>
                  <span className="font-medium text-foreground">{selectedDemand} units</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Objective: <span className="font-medium text-foreground">Minimize distance</span></p>
                <p>Time windows: <span className="font-medium text-foreground">{timeWindows ? "On" : "Off"}</span></p>
                <p>Return to depot: <span className="font-medium text-foreground">{returnToDepot ? "On" : "Off"}</span></p>
                <p>Warmstart (exakt): <span className="font-medium text-foreground">{useHeuristicWarmstart ? "On" : "Off"}</span></p>
                <div className="flex items-center justify-between pt-1">
                  <label htmlFor="time-limit-seconds" className="flex items-center gap-1.5">
                    <Timer className="size-3.5" />
                    Zeitlimit (Sekunden)
                  </label>
                  <input
                    id="time-limit-seconds"
                    type="number"
                    min={5}
                    max={3600}
                    value={timeLimitSeconds}
                    onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                    className="w-16 rounded-md border border-input bg-background px-2 py-1 text-right text-xs text-foreground"
                  />
                </div>
                <p className="text-[11px] italic text-muted-foreground/80">
                  Gilt für den exakten Solver (Run Exact Solver auf der Ergebnis-Seite) UND
                  für den "Solver vs. Heuristic Benchmark"-Block — beide nutzen jetzt dieses
                  Zeitlimit. Standard: 60s, min. 5s, max. 1h.
                </p>
              </div>
            </Card>

            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => runHeuristic()}
              disabled={running || noCustomersSelected}
            >
              {running ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {running ? "Optimizing routes…" : "Start Optimization"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Berechnet sofort eine schnelle heuristische Lösung (Nearest Neighbor) -
              unabhängig von der Instanzgröße. Den optionalen exakten Solver kannst du
              danach auf der Ergebnis-Seite gezielt dazu starten (kann je nach Größe und
              Zeitlimit deutlich länger dauern).
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
