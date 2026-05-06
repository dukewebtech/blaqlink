"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"

interface ChartData {
  month: string
  avgSale: number
  avgItem: number
}

interface SalesData {
  chartData: ChartData[]
  totalRevenue: number
  totalItems: number
  avgOrderValue: number
}

export function SalesChart() {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSalesData() {
      try {
        const response = await fetch("/api/dashboard/sales-chart")
        const data = await response.json()
        setSalesData(data)
      } catch (error) {
        console.error("[v0] Failed to fetch sales data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Your Sales this year</CardTitle>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-3 shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground">Avg Sale Value</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-1 shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground">Avg items per sale</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 self-start sm:self-auto">
            Show All
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading sales data...</div>
        ) : (
          <>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData?.chartData || []}>
                  <defs>
                    <linearGradient id="avgSale" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="avgItem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgSale"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    fill="url(#avgSale)"
                  />
                  <Area
                    type="monotone"
                    dataKey="avgItem"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#avgItem)"
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Avg order value</p>
                <p className="text-lg sm:text-2xl font-bold">{formatCurrency(salesData?.avgOrderValue || 0)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Revenue this year</p>
                <p className="text-lg sm:text-2xl font-bold text-chart-3">{formatCurrency(salesData?.totalRevenue || 0)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
