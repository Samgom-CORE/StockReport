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
      { id: "rose-lychee", name: "Rose Lychee" },
      { id: "muscateers", name: "Muscateers" },
      { id: "so-strawberry", name: "So Strawberry" },
      { id: "peach-mango", name: "Peach Mango" },
    ],
  },
  {
    id: "soft-cookies",
    name: "Soft Cookies",
    type: "calculated",
    products: [
      { id: "classic-chocochip", name: "Classic Chocochip" },
      { id: "oreo-milk-choco", name: "Oreo and Milk Choco" },
      { id: "triple-choc-marshmallow", name: "Triple Choc Marshmallow" },
      { id: "banana-toffee", name: "Banana Toffee" },
      { id: "oat-honey-raisins", name: "Oat Honey Raisins" },
      { id: "red-velvet-macadamia", name: "Red Velvet Macadamia" },
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
export function calcAkhir(awal: number, entry: CalcEntry): number {
  return awal + entry.masuk - entry.free - entry.jual - entry.online
}

export function emptyCalcEntry(): CalcEntry {
  return { masuk: 0, free: 0, jual: 0, online: 0 }
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
 * Compute the opening stock (awal) for a calculated product on a given date by
 * walking back to the most recent saved day and applying its closing formula.
 * If there is no prior day, opening stock is 0.
 */
export function getAwal(records: Record<string, DayRecord>, date: string, productId: string): number {
  const prevDate = addDays(date, -1)
  const prev = records[prevDate]
  if (!prev) return 0
  const prevAwal = getAwal(records, prevDate, productId)
  const prevEntry = prev.calc[productId] ?? emptyCalcEntry()
  return calcAkhir(prevAwal, prevEntry)
}

/**
 * Seed data: gives the day before "today" a saved record so that today's
 * opening stock (awal) is pre-filled. Temporary in-memory data until a
 * database is connected.
 */
export function seedRecords(today: string): Record<string, DayRecord> {
  const yesterday = addDays(today, -1)
  const calc: Record<string, CalcEntry> = {}
  for (const product of CALC_PRODUCTS) {
    // Seed a starting stock-in so its closing becomes today's opening.
    calc[product.id] = { ...emptyCalcEntry(), masuk: 20 }
  }
  const simple: Record<string, number> = {}
  for (const product of SIMPLE_PRODUCTS) {
    simple[product.id] = 0
  }
  return {
    [yesterday]: { date: yesterday, calc, simple },
  }
}
