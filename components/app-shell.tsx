import type { ReactNode } from "react"
import { Sidebar } from "@/components/sidebar"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}
