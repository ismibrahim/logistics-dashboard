"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Truck,
  Warehouse,
  Settings2,
  Route,
  Package,
  History,
} from "lucide-react"
import { cn } from "@/lib/utils"

const nav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Vehicles", href: "/vehicles", icon: Truck },
  { label: "Depots", href: "/depots", icon: Warehouse },
  { label: "Optimization", href: "/optimization", icon: Settings2 },
  { label: "Results", href: "/results", icon: Route },
  { label: "History", href: "/history", icon: History },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Package className="size-5" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-base font-semibold tracking-tight text-sidebar-foreground">Lieferr</span>
          <span className="text-[11px] text-muted-foreground">Route Optimization</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <p className="px-3 pb-2 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Operations
        </p>
        {nav.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">
            AK
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-sidebar-foreground">Anna Klein</span>
            <span className="text-xs text-muted-foreground">Fleet Manager</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
