"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { OptimizedRoute } from "@/lib/data"

const axis = "oklch(0.55 0.03 256)"
const grid = "oklch(0.92 0.012 247)"

export function UtilizationChart({ routes }: { routes: OptimizedRoute[] }) {
  const data = routes.map((r) => ({ name: r.vehicle, load: r.load, color: r.color }))
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
        <Tooltip
          cursor={{ fill: "oklch(0.94 0.03 247)" }}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid oklch(0.92 0.012 247)",
            fontSize: 12,
          }}
          formatter={(v) => [`${v}%`, "Load"]}
        />
        <Bar dataKey="load" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TrendChart({ data }: { data: { day: string; distance: number; cost: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: "1px solid oklch(0.92 0.012 247)",
            fontSize: 12,
          }}
        />
        <Line type="monotone" dataKey="distance" stroke="oklch(0.55 0.2 256)" strokeWidth={2.5} dot={false} name="Distance (km)" />
        <Line type="monotone" dataKey="cost" stroke="oklch(0.68 0.15 215)" strokeWidth={2.5} dot={false} name="Cost (€)" />
      </LineChart>
    </ResponsiveContainer>
  )
}
