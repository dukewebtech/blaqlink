"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "Jan", avgSale: 211411223, avgItem: 339091888 },
  { month: "Feb", avgSale: 180000000, avgItem: 280000000 },
  { month: "Mar", avgSale: 220000000, avgItem: 350000000 },
  { month: "Apr", avgSale: 195000000, avgItem: 310000000 },
  { month: "Jun", avgSale: 240000000, avgItem: 380000000 },
  { month: "Jul", avgSale: 211411223, avgItem: 339091888 },
  { month: "Aug", avgSale: 190000000, avgItem: 300000000 },
  { month: "Sep", avgSale: 230000000, avgItem: 360000000 },
  { month: "Oct", avgSale: 250000000, avgItem: 390000000 },
  { month: "Nov", avgSale: 270000000, avgItem: 420000000 },
  { month: "Des", avgSale: 290000000, avgItem: 450000000 },
]

export function SalesChart() {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Your Sales this year</CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-3" />
                <span className="text-sm text-muted-foreground">Average Sale Value</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-1" />
                <span className="text-sm text-muted-foreground">Average item per sale</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-1">
            Show All
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
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
        <div className="flex items-center justify-center gap-8 mt-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Average item per sale</p>
            <p className="text-2xl font-bold">$211,411,223</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Average year value</p>
            <p className="text-2xl font-bold text-chart-3">$339,091,888</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
