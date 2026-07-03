import { Cake } from "lucide-react"

import { DailyStockSheet } from "@/components/daily-stock-sheet"
import { Toaster } from "@/components/ui/sonner"

export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-4 py-8 md:py-12">
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Cake className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Daily Outlet Stock Book</h1>
          <p className="text-sm text-muted-foreground">
            Fill in each day&apos;s movements. Closing stock is calculated automatically.
          </p>
        </div>
      </header>

      <DailyStockSheet />
      <Toaster position="top-center" />
    </main>
  )
}
