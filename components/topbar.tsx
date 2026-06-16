"use client"

import { Search, Bell, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Topbar() {
  return (
    <div className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-6">
      <div className="flex items-center gap-2 md:hidden">
        <span className="text-base font-semibold tracking-tight">Lieferr</span>
      </div>
      <div className="relative hidden max-w-sm flex-1 items-center md:flex">
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search customers, vehicles, routes…"
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none ring-ring/40 transition focus:ring-2"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex">
          <Calendar className="size-4" />
          Today
        </Button>
        <Button variant="outline" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
      </div>
    </div>
  )
}
