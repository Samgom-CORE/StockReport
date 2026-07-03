"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CalendarRange, User } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { loadRecords } from "@/lib/storage"
import {
  CATEGORIES,
  type CalcEntry,
  type Category,
  type DayRecord,
  calcAkhir,
  emptyCalcEntry,
  formatDate,
  getAwal,
} from "@/lib/stock-data"

const CALC_FIELDS: { key: keyof CalcEntry; label: string }[] = [
  { key: "masuk", label: "Masuk" },
  { key: "free", label: "Free" },
  { key: "jual", label: "Jual" },
  { key: "online", label: "Online" },
]

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}

function CalcHistoryTable({
  category,
  records,
  date,
}: {
  category: Category
  records: Record<string, DayRecord>
  date: string
}) {
  const rec = records[date]
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="min-w-40">{category.name}</TableHead>
            <TableHead className="text-center">Awal</TableHead>
            {CALC_FIELDS.map((f) => (
              <TableHead key={f.key} className="text-center">
                {f.key === "free" ? (category.freeLabel ?? f.label) : f.label}
              </TableHead>
            ))}
            <TableHead className="text-center">Akhir</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {category.products.map((product) => {
            const entry = rec?.calc[product.id] ?? emptyCalcEntry()
            const awal = getAwal(records, date, product.id)
            const akhir = calcAkhir(awal, entry)
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-center font-mono tabular-nums text-muted-foreground">{awal}</TableCell>
                {CALC_FIELDS.map((f) => (
                  <TableCell key={f.key} className="text-center font-mono tabular-nums">
                    {entry[f.key]}
                  </TableCell>
                ))}
                <TableCell
                  className={`text-center font-mono font-semibold tabular-nums ${
                    akhir < 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {akhir}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function SimpleHistoryTable({ category, rec }: { category: Category; rec: DayRecord | undefined }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="min-w-40">{category.name}</TableHead>
            <TableHead className="text-center">Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {category.products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="text-center font-mono tabular-nums">{rec?.simple[product.id] ?? 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function MonthlyHistory() {
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
        setError(err instanceof Error ? err.message : "Could not load history.")
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // Group saved dates by month (YYYY-MM), each sorted newest first.
  const months = useMemo(() => {
    const dates = Object.keys(records).sort((a, b) => b.localeCompare(a))
    const map = new Map<string, string[]>()
    for (const date of dates) {
      const key = date.slice(0, 7)
      const list = map.get(key) ?? []
      list.push(date)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [records])

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="size-5 text-muted-foreground" aria-hidden="true" />
              <div className="flex flex-col">
                <CardTitle className="text-lg">Monthly Stock History</CardTitle>
                <span className="text-sm text-muted-foreground">
                  Read-only archive compiled from every saved day.
                </span>
              </div>
            </div>
            <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ArrowLeft data-icon="inline-start" />
              Back to daily sheet
            </Link>
          </div>
        </CardHeader>
      </Card>

      {error ? (
        <Card>
          <CardContent className="py-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarRange />
                </EmptyMedia>
                <EmptyTitle>Could not load history</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : null}

      {loaded && !error && months.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarRange />
                </EmptyMedia>
                <EmptyTitle>No history yet</EmptyTitle>
                <EmptyDescription>
                  Saved days will appear here, grouped by month. Save a closing stock on the daily sheet to get
                  started.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : null}

      {months.map(([monthKey, dates]) => (
        <section key={monthKey} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{monthLabel(monthKey)}</h2>
            <Badge variant="secondary">
              {dates.length} {dates.length === 1 ? "day" : "days"}
            </Badge>
          </div>

          {dates.map((date) => {
            const rec = records[date]
            return (
              <Card key={date}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{formatDate(date)}</CardTitle>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="size-4" aria-hidden="true" />
                      {rec?.staff?.trim() ? rec.staff : "—"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {CATEGORIES.map((category) =>
                    category.type === "calculated" ? (
                      <CalcHistoryTable key={category.id} category={category} records={records} date={date} />
                    ) : (
                      <SimpleHistoryTable key={category.id} category={category} rec={rec} />
                    ),
                  )}
                </CardContent>
              </Card>
            )
          })}
        </section>
      ))}
    </div>
  )
}
