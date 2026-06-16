"use client"

import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import type { Customer, Depot, OptimizedRoute } from "@/lib/data"

const LogisticsMap = dynamic(() => import("@/components/logistics-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-accent/40">
      <span className="text-sm text-muted-foreground">Loading map…</span>
    </div>
  ),
})

export function MapPanel({
  className,
  ...props
}: {
  className?: string
  customers?: Customer[]
  depots?: Depot[]
  routes?: OptimizedRoute[]
  center?: [number, number]
  zoom?: number
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border", className)}>
      <LogisticsMap {...props} />
    </div>
  )
}
