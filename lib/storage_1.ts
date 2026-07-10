import { createClient } from "@/lib/supabase/client"
import type { CalcEntry, DayRecord } from "./stock-data"

type DailyRow = {
  date: string
  staff: string | null
  calc: Record<string, CalcEntry> | null
  simple: Record<string, number> | null
}

// Load every saved day record from Supabase, keyed by ISO date.
export async function loadRecords(): Promise<Record<string, DayRecord>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("daily_records")
    .select("date, staff, calc, simple")
    .order("date", { ascending: true })

  if (error) {
    console.log("[v0] loadRecords error:", error.message)
    throw error
  }

  const records: Record<string, DayRecord> = {}
  for (const row of (data ?? []) as DailyRow[]) {
    records[row.date] = {
      date: row.date,
      staff: row.staff ?? "",
      calc: row.calc ?? {},
      simple: row.simple ?? {},
    }
  }
  return records
}

// Insert or update a single day's record in Supabase.
export async function saveRecord(record: DayRecord): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("daily_records").upsert(
    {
      date: record.date,
      staff: record.staff ?? "",
      calc: record.calc,
      simple: record.simple,
    },
    { onConflict: "date" },
  )

  if (error) {
    console.log("[v0] saveRecord error:", error.message)
    throw error
  }
}
