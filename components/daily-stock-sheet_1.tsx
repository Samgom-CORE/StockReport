"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Save,
  CalendarDays,
  History,
  LayoutGrid,
  LogOut,
  Lock,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalculatedTable } from "@/components/calculated-table"
import { SimpleTable } from "@/components/simple-table"
import { loadRecords, saveRecord } from "@/lib/storage"
import { useCurrentUser } from "@/lib/use-current-user"
import {
  CALC_PRODUCTS,
  CATEGORIES,
  SIMPLE_PRODUCTS,
  type CalcEntry,
  type DayRecord,
  addDays,
  calcAkhir,
  emptyCalcEntry,
  formatDate,
  getAwal,
  toISODate,
} from "@/lib/stock-data"

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message
  }
  return "Check your Supabase connection."
}

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

// A product only shows green/red once its Akhir has actually been typed this
// session (or was already saved with the new verification system). Records
// saved before this feature existed won't have a stored akhir, so they start
// untouched again — staff simply re-count once.
function buildTouchedMap(rec: DayRecord | undefined): Record<string, boolean> {
  const base: Record<string, boolean> = {}
  for (const product of CALC_PRODUCTS) {
    base[product.id] = typeof rec?.calc[product.id]?.akhir === "number"
  }
  return base
}

export function DailyStockSheet() {
  const { displayName, isAdmin, loading: userLoading, signOut } = useCurrentUser()
  const today = useMemo(() => toISODate(new Date()), [])
  const [records, setRecords] = useState<Record<string, DayRecord>>({})
  const [activeDate, setActiveDate] = useState(today)

  const [calcDraft, setCalcDraft] = useState<Record<string, CalcEntry>>(() => buildCalcDraft(undefined))
  const [simpleDraft, setSimpleDraft] = useState<Record<string, number>>(() => buildSimpleDraft(undefined))
  const [touchedAkhir, setTouchedAkhir] = useState<Record<string, boolean>>(() => buildTouchedMap(undefined))
  const [isSaving, setIsSaving] = useState(false)

  // Load every saved day record from Supabase after mount.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const saved = await loadRecords()
        if (cancelled) return
        setRecords(saved)
        const rec = saved[today]
        setCalcDraft(buildCalcDraft(rec))
        setSimpleDraft(buildSimpleDraft(rec))
        setTouchedAkhir(buildTouchedMap(rec))
      } catch (err) {
        if (cancelled) return
        console.error("[stock-book] loadRecords failed:", err)
        toast.error("Could not load stock history", {
          description: getErrorMessage(err),
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
    setTouchedAkhir(buildTouchedMap(rec))
    setActiveDate(date)
  }

  function goToDay(offset: number) {
    loadDate(addDays(activeDate, offset))
  }

  function updateCalc(productId: string, field: keyof CalcEntry, value: string) {
    const num = Math.max(0, Number.parseInt(value, 10) || 0)
    setCalcDraft((prev) => ({ ...prev, [productId]: { ...prev[productId], [field]: num } }))
    if (field === "akhir") {
      setTouchedAkhir((prev) => ({ ...prev, [productId]: true }))
    }
  }

  function updateSimple(productId: string, value: string) {
    const num = Math.max(0, Number.parseInt(value, 10) || 0)
    setSimpleDraft((prev) => ({ ...prev, [productId]: num }))
  }

  async function handleSave() {
    const record: DayRecord = {
      date: activeDate,
      staff: displayName || "Unknown",
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
      console.error("[stock-book] saveRecord failed:", err)
      toast.error("Could not save", {
        description: getErrorMessage(err),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isToday = activeDate === today
  const isFuture = activeDate > today
  const isPast = !isToday && !isFuture
  // Staff can only fill in today. Admins can also correct past days.
  // Future days are never editable, for anyone.
  const canEdit = !isFuture && (isToday || isAdmin)

  // Every calculated product's physical count (Akhir) must match the hidden
  // formula before saving is allowed.
  const allAkhirCorrect = CALC_PRODUCTS.every((product) => {
    const entry = calcDraft[product.id] ?? emptyCalcEntry()
    const awal = getAwal(records, activeDate, product.id)
    const expected = calcAkhir(awal, entry)
    return touchedAkhir[product.id] === true && entry.akhir === expected
  })

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
              <div className="flex flex-col">
                <CardTitle className="text-base sm:text-lg">{formatDate(activeDate)}</CardTitle>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  {isToday ? "Today" : isFuture ? "Upcoming day" : "Past day"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
              <Link
                href="/history"
                className={buttonVariants({ variant: "outline", size: "icon" })}
                aria-label="History"
              >
                <History />
              </Link>
              <Link
                href="/report"
                className={buttonVariants({ variant: "outline", size: "icon" })}
                aria-label="Weekly Report"
              >
                <LayoutGrid />
              </Link>
              {isAdmin ? (
                <Link
                  href="/logins"
                  className={buttonVariants({ variant: "outline", size: "icon" })}
                  aria-label="Sign-in History"
                >
                  <ShieldCheck />
                </Link>
              ) : null}
              <Button variant="outline" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <span>
              Signed in as <span className="font-medium">{userLoading ? "…" : displayName}</span>
              {isAdmin ? <span className="ml-1.5 text-xs text-muted-foreground">(admin)</span> : null}
            </span>
          </div>

          {isPast && !isAdmin ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              <Lock className="size-4 shrink-0" aria-hidden="true" />
              This day is locked. Only the owner can change past days — contact them if a correction is needed.
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground text-pretty sm:text-sm">
            {
              "Count each product and type it under Akhir — it turns green when it matches, red when it doesn't. Save unlocks once every Akhir is green. Other Products just need today's count."
            }
          </p>
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
            touchedAkhir={touchedAkhir}
            onChange={updateCalc}
            readOnly={!canEdit}
          />
        ) : (
          <SimpleTable
            key={category.id}
            category={category}
            draft={simpleDraft}
            onChange={updateSimple}
            readOnly={!canEdit}
          />
        ),
      )}

      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:mx-0 sm:rounded-lg sm:border sm:shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground sm:text-sm">
            {!canEdit
              ? "This day is locked."
              : allAkhirCorrect
                ? "All counts verified — ready to save."
                : "Every Akhir must be green before you can save."}
          </p>
          <Button
            onClick={handleSave}
            disabled={!canEdit || isSaving || !allAkhirCorrect}
            size="lg"
            className="w-full sm:w-auto"
          >
            <Save data-icon="inline-start" />
            {isSaving ? "Saving…" : "Save closing stock"}
          </Button>
        </div>
      </div>
    </div>
  )
}
