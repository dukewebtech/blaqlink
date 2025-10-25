"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, TrendingUp, Store } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ReportData {
  totalRevenue: number
  totalOrders: number
  revenueByStore: Array<{
    storeName: string
    revenue: number
    orders: number
  }>
  revenueByMonth: Record<string, number>
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/admin/reports")
      if (!response.ok) throw new Error("Failed to fetch reports")

      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error("[v0] Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading reports...</div>
        </div>
      </AdminLayout>
    )
  }

  if (!reportData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load report data</p>
        </div>
      </AdminLayout>
    )
  }

  const topStores = [...reportData.revenueByStore].sort((a, b) => b.revenue - a.revenue).slice(0, 10)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">Detailed revenue analytics and platform performance</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{reportData.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All-time platform revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Completed orders across all stores</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦
                {reportData.totalOrders > 0
                  ? Math.round(reportData.totalRevenue / reportData.totalOrders).toLocaleString()
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">Per order across platform</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.revenueByStore.length}</div>
              <p className="text-xs text-muted-foreground">Stores with completed orders</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Stores</CardTitle>
          </CardHeader>
          <CardContent>
            {topStores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No store data available</div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Store Name</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Avg Order Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topStores.map((store, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell>{store.storeName}</TableCell>
                        <TableCell>{store.orders}</TableCell>
                        <TableCell>₦{store.revenue.toLocaleString()}</TableCell>
                        <TableCell>₦{Math.round(store.revenue / store.orders).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(reportData.revenueByMonth).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No monthly data available</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(reportData.revenueByMonth)
                  .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                  .map(([month, revenue]) => (
                    <div key={month} className="flex items-center justify-between">
                      <div className="font-medium">{month}</div>
                      <div className="text-lg font-bold">₦{revenue.toLocaleString()}</div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
