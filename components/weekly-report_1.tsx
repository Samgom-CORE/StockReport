"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarRange } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { loadRecords } from "@/lib/storage"
import {
  CATEGORIES,
  type Category,
  type DayRecord,
  addDays,
  calcAkhir,
  emptyCalcEntry,
  getAwal,
  toISODate,
} from "@/lib/stock-data"

function getMonday(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return toISODate(date)
}

function shortDay(iso: string): { weekday: string; num: string } {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return {
    weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
    num: String(date.getDate()),
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message
  }
  return "Could not load report."
}

function CalcCategoryGrid({
  category,
  records,
  weekDates,
}: {
  category: Category
  records: Record<string, DayRecord>
  weekDates: string[]
}) {
  const freeLetter = (category.freeLabel ?? "Free").charAt(0).toUpperCase()
  const letters = ["+", freeLetter, "J", "O", "A"]

  const totals = weekDates.map((date) => {
    let masuk = 0
    let free = 0
    let jual = 0
    let online = 0
    let akhir = 0
    for (const product of category.products) {
      const rec = records[date]
      const entry = rec?.calc[product.id] ?? emptyCalcEntry()
      const awal = getAwal(records, date, product.id)
      masuk += entry.masuk
      free += entry.free
      jual += entry.jual
      online += entry.online
      akhir += calcAkhir(awal, entry)
    }
    return { masuk, free, jual, online, akhir }
  })

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-muted/60">
            <th className="sticky left-0 z-10 min-w-28 border-b border-r bg-muted/60 px-2 py-1 text-left font-semibold">
              {category.name}
            </th>
            {weekDates.map((date) => {
              const { weekday, num } = shortDay(date)
              const staff = records[date]?.staff
              return (
                <th
                  key={date}
                  colSpan={5}
                  className="border-b border-r px-1 py-1 text-center font-semibold last:border-r-0"
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>
                      {weekday} {num}
                    </span>
                    <span className="max-w-20 truncate text-[9px] font-normal text-muted-foreground">
                      {staff || "—"}
                    </span>
                  </div>
                </th>
              )
            })}
          </tr>
          <tr className="bg-muted/30 text-muted-foreground">
            <th className="sticky left-0 z-10 border-b border-r bg-muted/30 px-2 py-0.5 text-left font-normal"></th>
            {weekDates.flatMap((date) =>
              letters.map((l, i) => (
                <th
                  key={date + l + i}
                  className={`w-6 border-b px-0.5 py-0.5 text-center font-normal ${
                    i === letters.length - 1 ? "border-r" : ""
                  }`}
                >
                  {l}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {category.products.map((product) => (
            <tr key={product.id} className="odd:bg-background even:bg-muted/10">
              <td className="sticky left-0 z-10 whitespace-nowrap border-r bg-inherit px-2 py-0.5 font-medium">
                {product.name}
              </td>
              {weekDates.flatMap((date) => {
                const rec = records[date]
                const entry = rec?.calc[product.id] ?? emptyCalcEntry()
                const awal = getAwal(records, date, product.id)
                const akhir = calcAkhir(awal, entry)
                const cells = [entry.masuk, entry.free, entry.jual, entry.online, akhir]
                return cells.map((v, i) => (
                  <td
                    key={date + i}
                    className={`w-6 border-r px-0.5 py-0.5 text-center font-mono tabular-nums last:border-r-0 ${
                      i === 4 && v < 0 ? "text-destructive font-semibold" : ""
                    }`}
                  >
                    {v === 0 ? "" : v}
                  </td>
                ))
              })}
            </tr>
          ))}
          <tr className="border-t-2 bg-muted/40 font-semibold">
            <td className="sticky left-0 z-10 border-r bg-muted/40 px-2 py-1">Total</td>
            {weekDates.flatMap((date, di) => {
              const t = totals[di]
              const cells = [t.masuk, t.free, t.jual, t.online, t.akhir]
              return cells.map((v, i) => (
                <td key={date + "t" + i} className="w-6 border-r px-0.5 py-1 text-center font-mono tabular-nums last:border-r-0">
                  {v === 0 ? "" : v}
                </td>
              ))
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function SimpleCategoryGrid({
  category,
  records,
  weekDates,
}: {
  category: Category
  records: Record<string, DayRecord>
  weekDates: string[]
}) {
  const totals = weekDates.map((date) => {
    const rec = records[date]
    return category.products.reduce((sum, p) => sum + (rec?.simple[p.id] ?? 0), 0)
  })

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-muted/60">
            <th className="sticky left-0 z-10 min-w-28 border-b border-r bg-muted/60 px-2 py-1 text-left font-semibold">
              {category.name}
            </th>
            {weekDates.map((date) => {
              const { weekday, num } = shortDay(date)
              const staff = records[date]?.staff
              return (
                <th key={date} className="w-14 border-b border-r px-1 py-1 text-center font-semibold last:border-r-0">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>
                      {weekday} {num}
                    </span>
                    <span className="max-w-14 truncate text-[9px] font-normal text-muted-foreground">
                      {staff || "—"}
                    </span>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {category.products.map((product) => (
            <tr key={product.id} className="odd:bg-background even:bg-muted/10">
              <td className="sticky left-0 z-10 whitespace-nowrap border-r bg-inherit px-2 py-0.5 font-medium">
                {product.name}
              </td>
              {weekDates.map((date) => {
                const rec = records[date]
                const v = rec?.simple[product.id] ?? 0
                return (
                  <td key={date} className="w-14 border-r px-0.5 py-0.5 text-center font-mono tabular-nums last:border-r-0">
                    {v === 0 ? "" : v}
                  </td>
                )
              })}
            </tr>
          ))}
          <tr className="border-t-2 bg-muted/40 font-semibold">
            <td className="sticky left-0 z-10 border-r bg-muted/40 px-2 py-1">Total</td>
            {weekDates.map((date, di) => (
              <td key={date} className="w-14 border-r px-0.5 py-1 text-center font-mono tabular-nums last:border-r-0">
                {totals[di] === 0 ? "" : totals[di]}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function WeeklyReport() {
  const [weekStart, setWeekStart] = useState(() => getMonday(toISODate(new Date())))
  const [records, setRecords] = useState<Record<string, DayRecord>>({})
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await loadRecords()
        if (cancelled) return
        setRecords(data)
      } catch (err) {
        if (cancelled) return
        console.error("[stock-book] loadRecords failed:", err)
        setError(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const weekEnd = weekDates[6]

  const weekLabel = useMemo(() => {
    const fmt = (iso: string) => {
      const [, m, d] = iso.split("-").map(Number)
      return `${d} ${new Date(2000, m - 1, 1).toLocaleDateString("en-GB", { month: "short" })}`
    }
    return `${fmt(weekStart)} – ${fmt(weekEnd)}`
  }, [weekStart, weekEnd])

  const hasAnyData = weekDates.some((d) => records[d])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="Previous week">
              <ChevronLeft />
            </Button>
            <div className="min-w-40 text-center text-sm font-medium">{weekLabel}</div>
            <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="Next week">
              <ChevronRight />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(getMonday(toISODate(new Date())))}>
              This week
            </Button>
          </div>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft data-icon="inline-start" />
            Back to daily sheet
          </Link>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="py-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarRange />
                </EmptyMedia>
                <EmptyTitle>Could not load report</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : null}

      {loaded && !error && !hasAnyData ? (
        <Card>
          <CardContent className="py-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarRange />
                </EmptyMedia>
                <EmptyTitle>No data this week</EmptyTitle>
                <EmptyDescription>Save a closing stock on the daily sheet for this week to see it here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : null}

      {!error &&
        CATEGORIES.map((category) =>
          category.type === "calculated" ? (
            <CalcCategoryGrid key={category.id} category={category} records={records} weekDates={weekDates} />
          ) : (
            <SimpleCategoryGrid key={category.id} category={category} records={records} weekDates={weekDates} />
          ),
        )}
    </div>
  )
}
