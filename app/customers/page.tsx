"use client"

import { Plus, Search } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Topbar } from "@/components/topbar"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"



type Customer = {
  customer_id: number
  name: string
  address: string
  city: string
  demand: number
  tw_start: string
  tw_end: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [depots, setDepots] = useState<any[]>([])
  const [allowedAssignments, setAllowedAssignments] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)

  const [newName, setNewName] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newDemand, setNewDemand] = useState(1)

  const [newTwStart, setNewTwStart] =
    useState("08:00")

  const [newTwEnd, setNewTwEnd] =
    useState("18:00")

  const [newServiceTime, setNewServiceTime] =
    useState(30)

  useEffect(() => {

  fetch("http://127.0.0.1:8000/customers")
    .then((res) => res.json())
    .then((data) => setCustomers(data))

  fetch("http://127.0.0.1:8000/depots")
    .then((res) => res.json())
    .then((data) => setDepots(data))

  fetch("http://127.0.0.1:8000/customer-depot-allowed")
    .then((res) => res.json())
    .then((data) => setAllowedAssignments(data))
}, [])

const totalDemand = customers.reduce(
  (s, c) => s + c.demand,
  0
)



function isAllowed(
  customerId: number,
  depotId: number
) {
  return allowedAssignments.some(
    a =>
      Number(a.customer_id) === customerId &&
      Number(a.depot_id) === depotId &&
      Number(a.allowed) === 1
  )
}

async function toggleAllowed(
  customerId: number,
  depotId: number,
  checked: boolean
) {

  await fetch(
    "http://127.0.0.1:8000/customer-depot-allowed",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id: customerId,
        depot_id: depotId,
        allowed: checked ? 1 : 0,
      }),
    }
  )

  const updated = allowedAssignments.filter(
    a =>
      !(
        Number(a.customer_id) === customerId &&
        Number(a.depot_id) === depotId
      )
  )

  updated.push({
    customer_id: customerId,
    depot_id: depotId,
    allowed: checked ? 1 : 0,
  })

  setAllowedAssignments(updated)
}

async function addCustomer() {

  await fetch(
    "http://127.0.0.1:8000/customers",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      name: newName,
      address: newAddress,
      city: newCity,
      demand: newDemand,
      tw_start: newTwStart,
      tw_end: newTwEnd,
      service_time_min: newServiceTime,
    })
    }
  )

  location.reload()
}

async function deleteCustomer(customerId: number) {

  const confirmed = window.confirm(
    "Are you sure you want to delete this customer?"
  )

  if (!confirmed) {
    return
  }

  await fetch(
    `http://127.0.0.1:8000/customers/${customerId}`,
    {
      method: "DELETE",
    }
  )

  location.reload()
}
  return (
    <AppShell>
      <Topbar />
      <PageHeader
        title="Customers"
        description={`${customers.length} delivery locations · ${totalDemand} total units of demand`}
        actions={
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setShowForm(true)}
          >
            <Plus className="size-4" />
            Add Customer
          </Button>
        }
      />
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <div className="flex items-center gap-3">
          {showForm && (
            <Card className="p-6">

              <h3 className="text-xl font-semibold mb-6">
                Add New Customer
              </h3>

              <div className="grid grid-cols-4 gap-6">

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Customer Name
                  </label>

                  <input
                    placeholder="Enter customer name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address
                  </label>

                  <input
                    placeholder="Street and house number"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    City
                  </label>

                  <input
                    placeholder="City"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Demand (Units)
                  </label>

                  <input
                    type="number"
                    value={newDemand}
                    onChange={(e) =>
                      setNewDemand(Number(e.target.value))
                    }
                    className="w-full border p-2 rounded"
                  />

                  <p className="text-xs text-muted-foreground mt-1">
                    Number of units required.
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-4 gap-6 mt-8">

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Time Window Start
                  </label>

                  <input
                    type="time"
                    value={newTwStart}
                    onChange={(e) =>
                      setNewTwStart(e.target.value)
                    }
                    className="w-full border p-2 rounded"
                  />

                  <p className="text-xs text-muted-foreground mt-1">
                    Earliest delivery time.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Time Window End
                  </label>

                  <input
                    type="time"
                    value={newTwEnd}
                    onChange={(e) =>
                      setNewTwEnd(e.target.value)
                    }
                    className="w-full border p-2 rounded"
                  />

                  <p className="text-xs text-muted-foreground mt-1">
                    Latest delivery time.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Service Time (min)
                  </label>

                  <input
                    type="number"
                    value={newServiceTime}
                    onChange={(e) =>
                      setNewServiceTime(Number(e.target.value))
                    }
                    className="w-full border p-2 rounded"
                  />

                  <p className="text-xs text-muted-foreground mt-1">
                    Time spent at customer.
                  </p>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={addCustomer}
                    className="w-full"
                  >
                    Save Customer
                  </Button>
                </div>

              </div>

            </Card>
          )}
          <div className="relative flex max-w-sm flex-1 items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <input
              placeholder="Filter customers…"
              className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none ring-ring/40 transition focus:ring-2"
            />
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Address</th>
                  <th className="px-5 py-3 font-medium">Demand</th>
                  <th className="px-5 py-3 font-medium">Time Window</th>
                  <th className="px-5 py-3 font-medium">
                    Allowed Depots
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.customer_id} className="border-b border-border last:border-0 transition-colors hover:bg-accent/40">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.customer_id}</div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <div>{c.address}</div>
                      <div className="text-xs">
                        {c.city}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{c.demand} units</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{c.tw_start} - {c.tw_end}</td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">

                        {depots.map((d) => (

                          <label
                            key={d.depot_id}
                            className="flex items-center gap-2"
                          >

                            <input
                              type="checkbox"
                              checked={isAllowed(
                                c.customer_id,
                                d.depot_id
                              )}
                              onChange={(e) =>
                                toggleAllowed(
                                  c.customer_id,
                                  d.depot_id,
                                  e.target.checked
                                )
                              }
                            />

                            <span className="text-sm">
                              {d.name}
                            </span>

                          </label>

                        ))}

                      </div>
                    </td>
                    <td className="px-5 py-3.5">

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          deleteCustomer(c.customer_id)
                        }
                      >
                        Delete
                      </Button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
