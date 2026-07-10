export type Product = {
  id: string
  name: string
}

export type Category = {
  id: string
  name: string
  type: "calculated" | "simple"
  products: Product[]
  freeLabel?: string // label for the "free" deduction column (calculated categories)
}

// Calculated categories fill four movement columns each day.
export type CalcEntry = {
  masuk: number // stock in (+)
  free: number // given for free (-)
  jual: number // sold on the spot (-)
  online: number // sold online (-)
  akhir: number // staff's physical count of closing stock (verified against the formula, never shown)
}

// A record for a single day.
export type DayRecord = {
  date: string // ISO date, e.g. "2026-06-30"
  staff?: string // name of the staff who filled the sheet
  calc: Record<string, CalcEntry> // by product id (calculated categories)
  simple: Record<string, number> // by product id -> stock for the day
}

export const CATEGORIES: Category[] = [
  {
    id: "cake-slices",
    name: "Cake Slices",
    type: "calculated",
    freeLabel: "Sample",
    products: [
      { id: "classic-tiramisu", name: "Classic Tiramisu" },
      { id: "tiramisu-zero", name: "Tiramisu Zero" },
      { id: "chocolate-xoxo", name: "Chocolate XOXO" },
      { id: "taro-black-rice", name: "Taro Black Rice" },
      { id: "earl-grey", name: "Earl Grey" },
      { id: "black-forest", name: "Black Forest" },
      { id: "matcha-berry", name: "Matcha Berry" },
      { id: "rose-lychee", name: "Lychee Rose" },
      { id: "muscateers", name: "Muscateers" },
      { id: "so-strawberry", name: "So Strawberry" },
      { id: "peach-mango", name: "Peach me Mango" },
    ],
  },
  {
    id: "soft-cookies",
    name: "Soft Cookies",
    type: "calculated",
    products: [
      { id: "classic-chocochip", name: "Classic Co." },
      { id: "oreo-milk-choco", name: "Oreo" },
      { id: "triple-choc-marshmallow", name: "Mellow's" },
      { id: "banana-toffee", name: "Banofee" },
      { id: "oat-honey-raisins", name: "Raisin Oat" },
      { id: "red-velvet-macadamia", name: "Nutty Red" },
    ],
  },
  {
    id: "other-products",
    name: "Other Products",
    type: "simple",
    products: [
      { id: "butter-cookies", name: "Butter Cookies" },
      { id: "birthday-pack", name: "Birthday Pack" },
      { id: "air-mineral", name: "Air Mineral" },
    ],
  },
]

// Convenience: every calculated product across all categories.
export const CALC_PRODUCTS: Product[] = CATEGORIES.filter((c) => c.type === "calculated").flatMap((c) => c.products)

export const SIMPLE_PRODUCTS: Product[] = CATEGORIES.filter((c) => c.type === "simple").flatMap((c) => c.products)

// Closing stock formula: akhir = awal + masuk - free - jual - online
// The "correct" closing stock, computed from the movement columns.
// This is intentionally never shown to staff — it's only used to check
// their physically-counted "akhir" input against reality.
export function calcAkhir(awal: number, entry: CalcEntry): number {
  return awal + entry.masuk - entry.free - entry.jual - entry.online
}

export function emptyCalcEntry(): CalcEntry {
  return { masuk: 0, free: 0, jual: 0, online: 0, akhir: 0 }
}

// ISO date helpers (local time, no timezone surprises).
export function toISODate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Compute the opening stock (awal) for a calculated product on a given date
 * by replaying every saved day from the earliest known record up to (but not
 * including) this date. A day with no saved record is treated as "no
 * movement" — stock carries over unchanged — rather than resetting to 0.
 * This means a single forgotten day never wipes out real stock history.
 */
export function getAwal(records: Record<string, DayRecord>, date: string, productId: string): number {
  const dates = Object.keys(records)
  if (dates.length === 0) return 0
  const earliest = dates.reduce((min, d) => (d < min ? d : min))

  let awal = 0
  let cursor = earliest
  while (cursor < date) {
    const entry = records[cursor]?.calc[productId] ?? emptyCalcEntry()
    awal = calcAkhir(awal, entry)
    cursor = addDays(cursor, 1)
  }
  return awal
}

