import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  trendUp,
}: {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
}) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4.5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
        {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
      </div>
      {trend ? (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "flex items-center gap-0.5 font-medium",
              trendUp ? "text-primary" : "text-destructive",
            )}
          >
            {trendUp ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {trend}
          </span>
          <span className="text-muted-foreground">vs. last week</span>
        </div>
      ) : null}
    </Card>
  )
}
