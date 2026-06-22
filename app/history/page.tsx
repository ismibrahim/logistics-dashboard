"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Topbar } from "@/components/topbar"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Run = {
  run_id: number
  timestamp: string
  num_customers: number | null
  method: string
  solver_status: string
  total_distance_km: number | null
  total_cost: number | null
  runtime_s: number | null
  gap_percent: number | null
  routes_json: string | null
}

type SortKey =
  | "timestamp"
  | "method"
  | "num_customers"
  | "solver_status"
  | "total_distance_km"
  | "total_cost"
  | "runtime_s"
  | "gap_percent"

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "timestamp", label: "Timestamp" },
  { key: "method", label: "Method" },
  { key: "num_customers", label: "# Customers" },
  { key: "solver_status", label: "Solver Status" },
  { key: "total_distance_km", label: "Distance (km)" },
  { key: "total_cost", label: "Cost (€)" },
  { key: "runtime_s", label: "Runtime (s)" },
  { key: "gap_percent", label: "Gap (%)" },
]

// solver_status ist ein freier Text aus pulp.LpStatus bzw. eigenen Fehlermeldungen
// (siehe src/api.py) - es gibt keinen dedizierten "Timeout"-Wert in der History.
// Heuristik: Infeasible/Error -> rot, Optimal -> gruen, alles andere
// (z.B. Heuristic-Status oder ein per Zeitlimit abgebrochener Lauf) -> gelb.
function statusClassName(status: string): string {
  if (status.includes("Infeasible") || status.includes("Error")) {
    return "bg-destructive/10 text-destructive dark:bg-destructive/20"
  }
  if (status === "Optimal") {
    return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
}

function formatNumber(value: number | null, digits = 2, suffix = ""): string {
  return value != null ? `${value.toFixed(digits)}${suffix}` : "—"
}

function formatTimestamp(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("timestamp")
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/runs")
      .then((res) => res.json())
      .then((data) => setRuns(data))
      .catch((err) => {
        console.error(err)
        setError("Backend nicht erreichbar")
      })
      .finally(() => setLoading(false))
  }, [])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const sortedRuns = useMemo(() => {
    const copy = [...runs]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === "number" && typeof bv === "number") {
        return sortAsc ? av - bv : bv - av
      }
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return copy
  }, [runs, sortKey, sortAsc])

  return (
    <AppShell>
      <Topbar />
      <PageHeader
        title="Run History"
        description={`${runs.length} gespeicherte Optimierungs-/Vergleichsläufe, neueste zuerst.`}
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <Card className="gap-0 overflow-hidden p-0">
          {loading && (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Lade Historie…
            </div>
          )}

          {!loading && error && (
            <p className="p-6 text-sm text-destructive">{error}</p>
          )}

          {!loading && !error && runs.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">
              Noch keine Läufe gespeichert. Starte eine Optimierung auf der Optimization-Page.
            </p>
          )}

          {!loading && !error && runs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    {COLUMNS.map((col) => (
                      <th key={col.key} className="px-5 py-3 font-medium">
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={() => toggleSort(col.key)}
                        >
                          {col.label}
                          {sortKey === col.key ? (
                            sortAsc ? (
                              <ArrowUp className="size-3" />
                            ) : (
                              <ArrowDown className="size-3" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRuns.map((run) => (
                    <tr
                      key={run.run_id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-accent/40"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">
                        {formatTimestamp(run.timestamp)}
                      </td>
                      <td className="px-5 py-3.5 capitalize text-foreground">{run.method}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{run.num_customers ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={statusClassName(run.solver_status)}>
                          {run.solver_status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {formatNumber(run.total_distance_km, 2, " km")}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {formatNumber(run.total_cost, 2, " €")}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {formatNumber(run.runtime_s, 3, " s")}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {run.gap_percent != null ? `+${run.gap_percent.toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
