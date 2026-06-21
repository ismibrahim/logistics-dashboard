"use client"

import { Plus, MapPin, Truck, Trash2 } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Topbar } from "@/components/topbar"
import { PageHeader } from "@/components/page-header"
import { MapPanel } from "@/components/map-panel"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function DepotsPage() {
  const [depots, setDepots] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])

  const [customerAssignments, setCustomerAssignments] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [latitude, setLatitude] = useState(52.0)
  const [longitude, setLongitude] = useState(8.5)

  useEffect(() => {

  fetch("http://127.0.0.1:8000/customer-depot-allowed")
  .then((res) => res.json())
  .then((data) => setCustomerAssignments(data))

  fetch("http://127.0.0.1:8000/depots")
    .then((res) => res.json())
    .then((data) => {
      setDepots(data)
    })

  fetch("http://127.0.0.1:8000/vehicle-depot-assignment")
    .then((res) => res.json())
    .then((data) => {
      setAssignments(data)
    })
}, [])
  
  async function addDepot() {

    const response = await fetch(
      "http://127.0.0.1:8000/depots",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          city,
          latitude,
          longitude,
        }),
      }
    )
  
  const result = await response.json()

  console.log(result)

  window.location.reload()
}


async function deleteDepot(depotId: number) {

  const response = await fetch(
    `http://127.0.0.1:8000/depots/${depotId}`,
    {
      method: "DELETE",
    }
  )

  if (response.ok) {

    setDepots(
      depots.filter(
        d => d.depot_id !== depotId
      )
    )
  }
}
  const totalVehicles = assignments.length

  const mapDepots = depots.map((d) => ({
    id: d.depot_id,
    name: d.name,
    city: d.city,
    lat: d.latitude,
    lng: d.longitude,
  }))

  function getVehicleCount(depotId: number) {
    return assignments.filter(
      a => a.depot_id === depotId
    ).length
  }

  function getCustomerCount(depotId: number) {

  return customerAssignments.filter(
    a =>
      Number(a.depot_id) === depotId &&
      Number(a.allowed) === 1
  ).length
  } 

  return (
    <AppShell>
      <Topbar />
      <PageHeader
        title="Depots"
        description={`${depots.length} distribution centers · ${totalVehicles} vehicles stationed`}
        actions={
          <Button
            size="sm" 
            className="gap-2"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="size-4" /> Add Depot
          </Button>
        }
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {showForm && (
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">
              Add Depot
            </h2>

            <div className="grid gap-4 md:grid-cols-2">

              <input
                type="text"
                placeholder="Depot Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded border p-2"
              />

              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded border p-2"
              />

              <input
                type="number"
                step="0.000001"
                placeholder="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="rounded border p-2"
              />

              <input
                type="number"
                step="0.000001"
                placeholder="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="rounded border p-2"
              />

            </div>

            <Button
              className="mt-4"
              onClick={addDepot}
            >
              Save Depot
            </Button>
          </Card>
        )}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            {depots.map((d) => (
              <Card key={d.depot_id} className="gap-3 p-5">
                <Button
                  variant="destructive"
                  className="w-full mt-3"
                  onClick={() => deleteDepot(d.depot_id)}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Depot
                </Button>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.depot_id}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="text-muted-foreground">
                     {d.city}
                  </p>
                  <p className="flex items-center gap-1.5 text-foreground">
                    <Truck className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">
                      {getVehicleCount(d.depot_id)}
                    </span>{" "}
                    vehicles
                  </p>
                  <p className="flex items-center gap-1.5 text-foreground">
                    <span className="font-medium">
                      {getCustomerCount(d.depot_id)}
                    </span>
                    customers
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden p-0 lg:col-span-2">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Depot Locations</h2>
              <p className="text-xs text-muted-foreground">Geographic distribution of fulfillment centers</p>
            </div>
            <MapPanel className="h-[520px] rounded-none border-0" depots={mapDepots} zoom={11} />
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
