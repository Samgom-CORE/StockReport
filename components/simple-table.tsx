"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Category } from "@/lib/stock-data"

type Props = {
  category: Category
  draft: Record<string, number>
  onChange: (productId: string, value: string) => void
}

export function SimpleTable({ category, draft, onChange }: Props) {
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
                  Stock
                  <span className="block text-xs font-normal text-muted-foreground">Count for the day</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.products.map((product) => {
                const value = draft[product.id] ?? 0
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="p-2 text-center">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={value === 0 ? "" : value}
                        placeholder="0"
                        onChange={(e) => onChange(product.id, e.target.value)}
                        className="mx-auto h-9 w-20 text-center font-mono tabular-nums"
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
