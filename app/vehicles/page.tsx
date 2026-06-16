"use client"

import { Plus, Truck, User } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Topbar } from "@/components/topbar"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { toast } from "sonner"


const statusStyles: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  idle: "bg-amber-100 text-amber-700",
  maintenance: "bg-destructive/10 text-destructive",
}
type Vehicle = {
  vehicle_id: number
  license_plate: string
  status: string
  type: string
  capacity: number
  fixed_costs: number
  cost_per_km: number
  average_speed: number
}




export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [licensePlate, setLicensePlate] = useState("")
  const [depots, setDepots] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [vehicleTypeId, setVehicleTypeId] = useState(1)
  const [status, setStatus] = useState("active")
  const [showForm, setShowForm] = useState(false)
  const [fixedCosts, setFixedCosts] = useState(250)
  const [costPerKm, setCostPerKm] = useState(1.2)
  const [averageSpeed, setAverageSpeed] = useState(65)
  

  useEffect(() => {

    fetch("http://127.0.0.1:8000/vehicles")
      .then((res) => res.json())
      .then((data) => setVehicles(data))

    fetch("http://127.0.0.1:8000/depots")
      .then((res) => res.json())
      .then((data) => setDepots(data))

    fetch("http://127.0.0.1:8000/vehicle-depot-assignment")
      .then((res) => res.json())
      .then((data) => setAssignments(data))

  }, [])
  
  const totalCapacity = vehicles.reduce((s, v) => s + v.capacity, 0)
  const active = vehicles.filter((v) => v.status === "active").length

async function addVehicle() {
  const response = await fetch("http://127.0.0.1:8000/vehicles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      license_plate: licensePlate,
      vehicle_type_id: vehicleTypeId,
      fixed_costs: fixedCosts,
      cost_per_km: costPerKm,
      average_speed: averageSpeed,
      status: status,
    }),
  })

  const result = await response.json()

  console.log(result)

  window.location.reload()
}

async function deleteVehicle(vehicleId: number) {

  const response = await fetch(
    `http://127.0.0.1:8000/vehicles/${vehicleId}`,
    {
      method: "DELETE",
    }
  )
  if (response.ok) {
    toast.success("Vehicle deleted successfully")

    setVehicles(
      vehicles.filter(v => v.vehicle_id !== vehicleId)
    )
  }
}

async function assignDepot(
  vehicleId: number,
  depotId: number
) {

  const response = await fetch(
    "http://127.0.0.1:8000/vehicle-depot-assignment",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vehicle_id: vehicleId,
        depot_id: depotId,
      }),
    }
  )

if (!response.ok) {
  toast.error("Assignment failed")
  return
}

  const updated = assignments.filter(
    a => a.vehicle_id !== vehicleId
  )

  updated.push({
    vehicle_id: vehicleId,
    depot_id: depotId
  })

  setAssignments(updated)
}

function getDepotId(vehicleId: number) {

  const assignment = assignments.find(
    a => a.vehicle_id === vehicleId
  )

  return assignment?.depot_id ?? ""
}

  return (
    <AppShell>
      <Topbar />
      <PageHeader
        title="Vehicles"
        description={`${vehicles.length} vehicles · ${active} active · ${totalCapacity} units total capacity`}
        actions={
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="size-4" /> Add Vehicle
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {showForm && (
          <Card className="mb-6 p-5">
            <h2 className="mb-4 text-lg font-semibold">
              Add Vehicle
            </h2>

             <div className="grid gap-4 md:grid-cols-3">

               <input
                type="text"
                placeholder="License Plate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="rounded border p-2"
              />

              <select
                value={vehicleTypeId}
                onChange={(e) =>
                  setVehicleTypeId(Number(e.target.value))
              }
              className="rounded border p-2"
          >
            <option value={1}>LKW (33 Europaletten)</option>
            <option value={2}>LKW (33 Europaletten)</option>
            <option value={3}>Transporter (33 Europaletten)</option>
            <option value={4}>PKW (33 Europaletten)</option>
            <option value={5}>Sattelzug (66 Europaletten)</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border p-2"
          >
            <option value="active">active</option>
            <option value="maintenance">maintenance</option>
          </select>
          
          
          <input
            type="number"
            placeholder="Fixed Costs"
            value={fixedCosts}
            onChange={(e) => setFixedCosts(Number(e.target.value))}
            className="rounded border p-2"
          />

          <input
            type="number"
            step="0.01"
            placeholder="Cost per km"
            value={costPerKm}
            onChange={(e) => setCostPerKm(Number(e.target.value))}
            className="rounded border p-2"
          />

          <input
            type="number"
            step="0.01"
            placeholder="Average Speed"
            value={averageSpeed}
            onChange={(e) => setAverageSpeed(Number(e.target.value))}
            className="rounded border p-2"
          />
            

      </div>

      <Button
        className="mt-4"
        onClick={addVehicle}
      >
        Save Vehicle
      </Button>
    </Card>
  )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehicles.map((v) => (
            <Card key={v.vehicle_id} className="gap-4 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Truck className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{v.license_plate}</p>
                    <p className="text-xs text-muted-foreground">{v.type}</p>
                  </div>
                </div>
                <Badge variant="secondary" className={`capitalize ${statusStyles[v.status]}`}>
                  {v.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium text-foreground">{v.capacity} Europaletten </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plate</span>
                  <span className="font-medium text-foreground">{v.license_plate}</span>
                </div>
                <div className="flex items-center justify-between">
  <span className="text-muted-foreground">Fixed Costs</span>
  <span className="font-medium text-foreground">
    {Number(v.fixed_costs ?? 0).toFixed(2)} €
  </span>
</div>

<div className="flex items-center justify-between">
  <span className="text-muted-foreground">Cost / km</span>
  <span className="font-medium text-foreground">
    {Number(v.cost_per_km ?? 0).toFixed(2)} €/km
  </span>
</div>

<div className="flex items-center justify-between">
  <span className="text-muted-foreground">Speed</span>
  <span className="font-medium text-foreground">
    {Number(v.average_speed ?? 0).toFixed(2)} km/h
  </span>
</div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-3.5" />
                  {"Driver not assigned"}
                </div>
                <div className="mt-2">
                  <select
                    value={getDepotId(v.vehicle_id)}
                    onChange={(e) =>
                      assignDepot(
                        v.vehicle_id,
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded border p-2 text-sm"
                  >
                    <option value="">
                      Select Depot
                    </option>

                    {depots.map((d) => (
                      <option
                        key={d.depot_id}
                        value={d.depot_id}
                      >
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Utilization</span>
                  <span className="font-medium text-foreground">{0}%</span>
                </div>
                <Progress value={0} className="h-1.5" />
              </div>
              <Button
                variant="destructive"
                className="w-full mt-3"
                onClick={() => deleteVehicle(v.vehicle_id)}
              >
                Delete Vehicle
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
