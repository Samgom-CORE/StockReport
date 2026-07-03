"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Save, CalendarDays, History, User } from "lucide-react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalculatedTable } from "@/components/calculated-table"
import { SimpleTable } from "@/components/simple-table"
import { loadRecords, saveRecord } from "@/lib/storage"
import {
  CALC_PRODUCTS,
  CATEGORIES,
  SIMPLE_PRODUCTS,
  type CalcEntry,
  type DayRecord,
  addDays,
  emptyCalcEntry,
  formatDate,
  seedRecords,
  toISODate,
} from "@/lib/stock-data"

function buildCalcDraft(rec: DayRecord | undefined): Record<string, CalcEntry> {
  const base: Record<string, CalcEntry> = {}
  for (const product of CALC_PRODUCTS) base[product.id] = rec?.calc[product.id] ?? emptyCalcEntry()
  return base
}

function buildSimpleDraft(rec: DayRecord | undefined): Record<string, number> {
  const base: Record<string, number> = {}
  for (const product of SIMPLE_PRODUCTS) base[product.id] = rec?.simple[product.id] ?? 0
  return base
}

export function DailyStockSheet() {
  const today = useMemo(() => toISODate(new Date()), [])
  const [records, setRecords] = useState<Record<string, DayRecord>>(() => seedRecords(today))
  const [activeDate, setActiveDate] = useState(today)

  const [calcDraft, setCalcDraft] = useState<Record<string, CalcEntry>>(() => buildCalcDraft(seedRecords(today)[today]))
  const [simpleDraft, setSimpleDraft] = useState<Record<string, number>>(() =>
    buildSimpleDraft(seedRecords(today)[today]),
  )
  const [staffDraft, setStaffDraft] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Load every saved day record from Supabase after mount.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const saved = await loadRecords()
        if (cancelled) return
        const merged = { ...seedRecords(today), ...saved }
        setRecords(merged)
        const rec = merged[today]
        setCalcDraft(buildCalcDraft(rec))
        setSimpleDraft(buildSimpleDraft(rec))
        setStaffDraft(rec?.staff ?? "")
      } catch (err) {
        if (cancelled) return
        toast.error("Could not load stock history", {
          description: err instanceof Error ? err.message : "Check your Supabase connection.",
        })
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [today])

  function loadDate(date: string) {
    const rec = records[date]
    setCalcDraft(buildCalcDraft(rec))
    setSimpleDraft(buildSimpleDraft(rec))
    setStaffDraft(rec?.staff ?? "")
    setActiveDate(date)
  }

  function goToDay(offset: number) {
    loadDate(addDays(activeDate, offset))
  }

  function updateCalc(productId: string, field: keyof CalcEntry, value: string) {
    const num = Math.max(0, Number.parseInt(value, 10) || 0)
    setCalcDraft((prev) => ({ ...prev, [productId]: { ...prev[productId], [field]: num } }))
  }

  function updateSimple(productId: string, value: string) {
    const num = Math.max(0, Number.parseInt(value, 10) || 0)
    setSimpleDraft((prev) => ({ ...prev, [productId]: num }))
  }

  async function handleSave() {
    if (!staffDraft.trim()) {
      toast.error("Nama Staff required", {
        description: "Please fill in the staff name before saving.",
      })
      return
    }
    const record: DayRecord = {
      date: activeDate,
      staff: staffDraft.trim(),
      calc: calcDraft,
      simple: simpleDraft,
    }
    setIsSaving(true)
    try {
      await saveRecord(record)
      setRecords((prev) => ({ ...prev, [activeDate]: record }))
      toast.success("Stock saved", {
        description: `Closing stock for ${formatDate(activeDate)} has been recorded.`,
      })
    } catch (err) {
      toast.error("Could not save", {
        description: err instanceof Error ? err.message : "Check your Supabase connection.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isToday = activeDate === today
  const isFuture = activeDate > today

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
              <div className="flex flex-col">
                <CardTitle className="text-lg">{formatDate(activeDate)}</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {isToday ? "Today" : isFuture ? "Upcoming day" : "Past day"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => goToDay(-1)} aria-label="Previous day">
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadDate(today)} disabled={isToday}>
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToDay(1)}
                disabled={isToday}
                aria-label="Next day"
              >
                <ChevronRight />
              </Button>
              <Link href="/history" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <History data-icon="inline-start" />
                History
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="staff-name" className="flex items-center gap-1.5">
              <User className="size-4 text-muted-foreground" aria-hidden="true" />
              Nama Staff
            </Label>
            <Input
              id="staff-name"
              value={staffDraft}
              onChange={(e) => setStaffDraft(e.target.value)}
              placeholder="Enter your name"
              disabled={isFuture}
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground text-pretty">
              {
                "Akhir = Awal + Masuk − Sample − Jual − Online. Staff fill the movement columns; Akhir is calculated to match against the physical count. Other Products just need today's count."
              }
            </p>
            <Button onClick={handleSave} disabled={isFuture || isSaving} className="shrink-0">
              <Save data-icon="inline-start" />
              {isSaving ? "Saving…" : "Save closing stock"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {CATEGORIES.map((category) =>
        category.type === "calculated" ? (
          <CalculatedTable
            key={category.id}
            category={category}
            records={records}
            activeDate={activeDate}
            draft={calcDraft}
            onChange={updateCalc}
          />
        ) : (
          <SimpleTable key={category.id} category={category} draft={simpleDraft} onChange={updateSimple} />
        ),
      )}
    </div>
  )
}
