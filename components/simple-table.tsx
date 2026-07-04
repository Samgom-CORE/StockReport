"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Category } from "@/lib/stock-data"

function sanitizeDigits(value: string): string {
  return value.replace(/[^0-9]/g, "")
}

type Props = {
  category: Category
  draft: Record<string, number>
  onChange: (productId: string, value: string) => void
  readOnly?: boolean
}

export function SimpleTable({ category, draft, onChange, readOnly }: Props) {
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
                <TableHead className="sticky left-0 z-10 w-28 min-w-28 border-r bg-muted/50 px-1.5 py-1.5 text-[11px] whitespace-normal">
                  Product
                </TableHead>
                <TableHead className="w-14 px-0.5 py-1.5 text-center text-[11px]">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.products.map((product) => {
                const value = draft[product.id] ?? 0
                return (
                  <TableRow key={product.id}>
                    <TableCell className="sticky left-0 z-10 w-28 min-w-28 border-r bg-background px-1.5 py-1 whitespace-normal font-medium leading-tight">
                      {product.name}
                    </TableCell>
                    <TableCell className="w-14 p-0.5 text-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={value === 0 ? "" : value}
                        placeholder="0"
                        onChange={(e) => onChange(product.id, sanitizeDigits(e.target.value))}
                        disabled={readOnly}
                        className="mx-auto h-8 w-12 min-w-0 px-1 text-center font-mono tabular-nums"
                        aria-label={`${product.name} stock`}
                      />
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
