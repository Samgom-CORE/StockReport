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

const FIELDS: { key: keyof CalcEntry; label: string; hint: string; sign: "+" | "-" }[] = [
  { key: "masuk", label: "Masuk", hint: "Stock in", sign: "+" },
  { key: "free", label: "Free", hint: "Given free", sign: "-" },
  { key: "jual", label: "Jual", hint: "Sold on spot", sign: "-" },
  { key: "online", label: "Online", hint: "Sold online", sign: "-" },
]

type Props = {
  category: Category
  records: Record<string, DayRecord>
  activeDate: string
  draft: Record<string, CalcEntry>
  onChange: (productId: string, field: keyof CalcEntry, value: string) => void
}

export function CalculatedTable({ category, records, activeDate, draft, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{category.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-40">Product</TableHead>
                <TableHead className="text-center">
                  Awal
                  <span className="block text-xs font-normal text-muted-foreground">Opening</span>
                </TableHead>
                {FIELDS.map((f) => {
                  const label = f.key === "free" ? (category.freeLabel ?? f.label) : f.label
                  return (
                    <TableHead key={f.key} className="text-center">
                      {label}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {f.sign} {f.hint}
                      </span>
                    </TableHead>
                  )
                })}
                <TableHead className="text-center">
                  Akhir
                  <span className="block text-xs font-normal text-muted-foreground">Closing (auto)</span>
                </TableHead>
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
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-center font-mono tabular-nums text-muted-foreground">
                      {awal}
                    </TableCell>
                    {FIELDS.map((f) => {
                      const label = f.key === "free" ? (category.freeLabel ?? f.label) : f.label
                      return (
                        <TableCell key={f.key} className="p-2 text-center">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={entry[f.key] === 0 ? "" : entry[f.key]}
                            placeholder="0"
                            onChange={(e) => onChange(product.id, f.key, e.target.value)}
                            className="mx-auto h-9 w-16 text-center font-mono tabular-nums"
                            aria-label={`${product.name} ${label}`}
                          />
                        </TableCell>
                      )
                    })}
                    <TableCell
                      className={`text-center font-mono text-base font-semibold tabular-nums ${
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
