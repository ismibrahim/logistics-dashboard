"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Clock, RotateCcw, Timer, Play, Loader2, Settings2, Users, Truck, Warehouse, Zap, AlertTriangle } from "lucide-react"
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
  const [maxDuration, setMaxDuration] = useState([99999])
  const [runningMode, setRunningMode] = useState<"auto" | "exact" | null>(null)
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [depots, setDepots] = useState([])
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<number>>(new Set())

useEffect(() => {
  fetch("http://127.0.0.1:8000/customers")
    .then(res => res.json())
    .then(data => {
      setCustomers(data)
      setSelectedCustomerIds(new Set(data.map((c: any) => c.customer_id)))
    })

  fetch("http://127.0.0.1:8000/vehicles")
    .then(res => res.json())
    .then(data => setVehicles(data))

  fetch("http://127.0.0.1:8000/depots")
    .then(res => res.json())
    .then(data => setDepots(data))
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

async function runOptimization(forceExact: boolean) {
  setRunningMode(forceExact ? "exact" : "auto")

  try {
    const allSelected = selectedCustomerIds.size === customers.length
    const response = await fetch(
      `http://127.0.0.1:8000/optimize?force_exact=${forceExact}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnToDepot,
          timeWindows,
          balanceLoad,
          maxDuration: maxDuration[0],
          objective: "distance",
          customer_ids: allSelected ? undefined : Array.from(selectedCustomerIds),
        }),
      },
    )

    const data = await response.json()

    console.log("RESPONSE STATUS:", response.status)
    console.log("SOLVER DATA:", data)

    localStorage.setItem("solverResult", JSON.stringify(data))
    router.push("/results")
  } catch (error) {
    console.error(error)
    alert("Backend nicht erreichbar")
  } finally {
    setRunningMode(null)
  }
}

const running = runningMode !== null
const largeInstance = selectedCustomerIds.size > 50
const noCustomersSelected = selectedCustomerIds.size === 0
const allCustomersSelected = customers.length > 0 && selectedCustomerIds.size === customers.length

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
                  <span className="font-medium text-foreground">{vehicles.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground"><Warehouse className="size-4" />Depots</span>
                  <span className="font-medium text-foreground">{depots.length}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Objective: <span className="font-medium text-foreground">Minimize distance</span></p>
                <p>Time windows: <span className="font-medium text-foreground">{timeWindows ? "On" : "Off"}</span></p>
                <p>Return to depot: <span className="font-medium text-foreground">{returnToDepot ? "On" : "Off"}</span></p>
              </div>
            </Card>

            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => runOptimization(false)}
              disabled={running || noCustomersSelected}
            >
              {runningMode === "auto" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {runningMode === "auto" ? "Optimizing routes…" : "Start Optimization"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Uses the exact solver for small instances and automatically switches to a fast
              heuristic above 50 customers.
            </p>

            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2"
              onClick={() => runOptimization(true)}
              disabled={running || noCustomersSelected}
            >
              {runningMode === "exact" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              {runningMode === "exact" ? "Running exact solver…" : "Run Exact Solver"}
            </Button>
            {largeInstance && (
              <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                Achtung: Kann bei dieser Instanzgröße (&gt;50 Kunden) sehr lange dauern oder am
                Zeitlimit (60s) abbrechen.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
