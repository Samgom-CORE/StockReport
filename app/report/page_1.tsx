import { LayoutGrid } from "lucide-react"

import { WeeklyReport } from "@/components/weekly-report"

export default function ReportPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[1400px] flex-col gap-6 px-4 py-8 md:py-12">
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <LayoutGrid className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Weekly Report</h1>
          <p className="text-sm text-muted-foreground">A compact, book-style grid — one week at a time.</p>
        </div>
      </header>

      <WeeklyReport />
    </main>
  )
}
