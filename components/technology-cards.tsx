import {
  Network,
  Map as MapIcon,
  Cpu,
  Warehouse,
  Clock,
  PackageCheck,
  type LucideIcon,
} from "lucide-react"
import { Card } from "@/components/ui/card"

type Tech = {
  title: string
  description: string
  icon: LucideIcon
  tag: string
}

const technologies: Tech[] = [
  {
    title: "Real Road Network",
    description: "Routing computed on actual street geometry, turn restrictions and one-way roads — not straight-line distances.",
    icon: Network,
    tag: "Routing",
  },
  {
    title: "OpenRouteService Integration",
    description: "Live distance and duration matrices from the OpenRouteService API power every optimization run.",
    icon: MapIcon,
    tag: "Data",
  },
  {
    title: "CBC Optimization Solver",
    description: "Open-source COIN-OR CBC mixed-integer solver finds provably near-optimal vehicle routes.",
    icon: Cpu,
    tag: "Solver",
  },
  {
    title: "Multi-Depot Routing",
    description: "Assigns customers to the best depot and balances workload across all distribution hubs.",
    icon: Warehouse,
    tag: "MDVRP",
  },
  {
    title: "Time Window Constraints",
    description: "Respects each customer's delivery window so vehicles arrive exactly when expected.",
    icon: Clock,
    tag: "VRPTW",
  },
  {
    title: "Capacity Optimization",
    description: "Honors per-vehicle capacity limits while maximizing load utilization on every route.",
    icon: PackageCheck,
    tag: "CVRP",
  },
]

export function TechnologyCards() {
  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Optimization Technology</h2>
          <p className="text-xs text-muted-foreground">
            Real-world route optimization powered by open routing data and a CVRP/VRPTW solver.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {technologies.map((t) => (
          <div
            key={t.title}
            className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <t.icon className="size-5" />
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {t.tag}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
