"use client"

import { useEffect } from "react"
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { Customer, Depot, OptimizedRoute } from "@/lib/data"

type LogisticsMapProps = {
  customers?: Customer[]
  depots?: Depot[]
  routes?: OptimizedRoute[]
  center?: [number, number]
  zoom?: number
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points as [number, number][], { padding: [40, 40] })
    }
  }, [map, points])
  return null
}

export default function LogisticsMap({
  customers = [],
  depots = [],
  routes = [],
  center = [48.15, 11.58],
  zoom = 12,
}: LogisticsMapProps) {
  const allPoints: [number, number][] = [
    ...depots.map((d) => [d.lat, d.lng] as [number, number]),
    ...customers.map((c) => [c.lat, c.lng] as [number, number]),
    ...routes.flatMap((r) => r.path.map((p) => [p.lat, p.lng] as [number, number])),
  ]

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {allPoints.length > 1 ? <FitBounds points={allPoints} /> : null}

      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.path.map((p) => [p.lat, p.lng]) as [number, number][]}
          pathOptions={{ color: route.color, weight: 4, opacity: 0.85 }}
        />
      ))}

      {customers.filter((c) => c.lat && c.lng).map((c) => (
        <CircleMarker
          key={c.id}
          center={[c.lat, c.lng]}
          radius={6}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: "#6b7280",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <span className="font-medium">{c.name}</span>
            <br />
            {c.demand} units{c.window ? ` · ${c.window}` : ""}
          </Popup>
        </CircleMarker>
      ))}

      {depots.filter((d) => d.lat && d.lng).map((d) => (
        <CircleMarker
          key={d.id}
          center={[d.lat, d.lng]}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#1e3a8a",
            fillOpacity: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} permanent>
            <span className="font-semibold">{d.name}</span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
