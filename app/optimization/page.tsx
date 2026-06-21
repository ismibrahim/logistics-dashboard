"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Clock, RotateCcw, Timer, Play, Loader2, Settings2, Users, Truck, Warehouse } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Topbar } from "@/components/topbar"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"


const objectives = [
  { id: "distance", label: "Minimize distance", desc: "Shortest total travel distance" },
  { id: "time", label: "Minimize duration", desc: "Fastest total route time" },
  { id: "cost", label: "Minimize cost", desc: "Lowest operating expense" },
]

export default function OptimizationPage() {
  const router = useRouter()
  const [timeWindows, setTimeWindows] = useState(false)
  const [returnToDepot, setReturnToDepot] = useState(true)
  const [balanceLoad, setBalanceLoad] = useState(false)
  const [maxDuration, setMaxDuration] = useState([99999])
  const [objective, setObjective] = useState("distance")
  const [running, setRunning] = useState(false)
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [depots, setDepots] = useState([])

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
}, [])

async function start() {
  setRunning(true)

  try {
    const response = await fetch("http://127.0.0.1:8000/optimize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  returnToDepot,
  timeWindows,
  balanceLoad,
  maxDuration: maxDuration[0],
  objective,
}),
    })

    const data = await response.json()

    console.log("RESPONSE STATUS:", response.status)
    console.log("SOLVER DATA:", data)

    alert(JSON.stringify(data, null, 2))

    console.log("Solver Result:", data)

    localStorage.setItem("solverResult", JSON.stringify(data))
    router.push("/results")
  } catch (error) {
    console.error(error)
    alert("Backend nicht erreichbar")
  } finally {
    setRunning(false)
  }
}

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

            {/* Objective */}
            <Card className="gap-4 p-6">
              <h2 className="text-sm font-semibold text-foreground">Optimization Objective</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {objectives.map((o) => {
                  const active = objective === o.id
                  return (
                    <button
                      key={o.id}
                      onClick={() => setObjective(o.id)}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40 hover:bg-accent/40"
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{o.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{o.desc}</p>
                    </button>
                  )
                })}
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
                  <span className="font-medium text-foreground">{customers.length}</span>
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
                <p>Objective: <span className="font-medium text-foreground capitalize">{objective}</span></p>
                <p>Time windows: <span className="font-medium text-foreground">{timeWindows ? "On" : "Off"}</span></p>
                <p>Return to depot: <span className="font-medium text-foreground">{returnToDepot ? "On" : "Off"}</span></p>
              </div>
            </Card>

            <Button size="lg" className="w-full gap-2" onClick={start} disabled={running}>
              {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {running ? "Optimizing routes…" : "Start Optimization"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              The solver typically completes in a few seconds.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
