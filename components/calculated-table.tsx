"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  type CalcEntry,
  type Category,
  type DayRecord,
  calcAkhir,
  emptyCalcEntry,
  getAwal,
} from "@/lib/stock-data"

const FIELD_KEYS: (keyof CalcEntry)[] = ["masuk", "free", "jual", "online"]

function sanitizeDigits(value: string): string {
  return value.replace(/[^0-9]/g, "")
}

type Props = {
  category: Category
  records: Record<string, DayRecord>
  activeDate: string
  draft: Record<string, CalcEntry>
  onChange: (productId: string, field: keyof CalcEntry, value: string) => void
  readOnly?: boolean
}

export function CalculatedTable({ category, records, activeDate, draft, onChange, readOnly }: Props) {
  const freeLetter = (category.freeLabel ?? "Free").charAt(0).toUpperCase()
  const letters: Record<keyof CalcEntry, string> = {
    masuk: "+",
    free: freeLetter,
    jual: "J",
    online: "O",
  }

  return (
    <Card className="py-0 sm:py-6">
      <CardHeader className="hidden sm:flex">
        <CardTitle className="text-base">{category.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <p className="border-b bg-muted/40 px-2 py-1.5 text-xs font-semibold sm:hidden">{category.name}</p>
        <div className="overflow-x-auto">
          <Table className="text-[11px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="sticky left-0 z-10 w-24 min-w-24 border-r bg-muted/50 px-1.5 py-1.5 text-[11px] whitespace-normal">
                  Product
                </TableHead>
                {FIELD_KEYS.map((key) => (
                  <TableHead key={key} className="w-10 px-0.5 py-1.5 text-center text-[11px]">
                    {letters[key]}
                  </TableHead>
                ))}
                <TableHead className="w-10 px-0.5 py-1.5 text-center text-[11px]">A</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.products.map((product) => {
                const entry = draft[product.id] ?? emptyCalcEntry()
                const awal = getAwal(records, activeDate, product.id)
                const akhir = calcAkhir(awal, entry)
                const negative = akhir < 0
                return (
                  <TableRow key={product.id}>
                    <TableCell className="sticky left-0 z-10 w-24 min-w-24 border-r bg-background px-1.5 py-1 align-top whitespace-normal">
                      <span className="block font-medium leading-tight">{product.name}</span>
                      <span className="block text-[10px] leading-tight text-muted-foreground">Awal {awal}</span>
                    </TableCell>
                    {FIELD_KEYS.map((key) => (
                      <TableCell key={key} className="w-10 p-0.5 text-center">
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          value={entry[key] === 0 ? "" : entry[key]}
                          placeholder="0"
                          onChange={(e) => onChange(product.id, key, sanitizeDigits(e.target.value))}
                          disabled={readOnly}
                          className="mx-auto h-8 w-10 min-w-0 px-1 text-center font-mono tabular-nums"
                          aria-label={`${product.name} ${key}`}
                        />
                      </TableCell>
                    ))}
                    <TableCell
                      className={`w-10 p-0.5 text-center font-mono text-xs font-semibold tabular-nums ${
                        negative ? "text-destructive" : "text-foreground"
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
      </CardContent>
    </Card>
  )
}
