import { History } from "lucide-react"

import { MonthlyHistory } from "@/components/monthly-history"

export default function HistoryPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-4 py-8 md:py-12">
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <History className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Stock History Archive</h1>
          <p className="text-sm text-muted-foreground">Every saved day, compiled month by month.</p>
        </div>
      </header>

      <MonthlyHistory />
    </main>
  )
}
