"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Percent } from "lucide-react"

interface ReportData {
  totalRevenue: number
  totalCommission: number
  netRevenue: number
  commissionPercentage: number
  totalOrders: number
  totalVendors: number
  totalProducts: number
  revenueGrowth: number
  ordersGrowth: number
  topVendors: Array<{
    name: string
    grossRevenue: number
    netRevenue: number
    commission: number
  }>
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReports() {
      try {
        console.log("[v0] Fetching reports...")
        const response = await fetch("/api/admin/reports")
        if (!response.ok) throw new Error("Failed to fetch reports")
        const reportData = await response.json()
        console.log("[v0] Reports data loaded:", reportData)
        setData(reportData)
      } catch (error) {
        console.error("[v0] Failed to fetch reports:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading reports...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">Platform performance and analytics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {data && data.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={data && data.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                  {data?.revenueGrowth || 0}%
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data?.totalCommission || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">{data?.commissionPercentage || 0}% platform fee</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {data && data.ordersGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={data && data.ordersGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                  {data?.ordersGrowth || 0}%
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalVendors || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active vendors</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vendors</CardTitle>
            <CardDescription>Vendors with highest revenue this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topVendors && data.topVendors.length > 0 ? (
                data.topVendors.map((vendor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <p className="font-medium">{vendor.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(vendor.grossRevenue)}</p>
                        <p className="text-xs text-muted-foreground">Gross Revenue</p>
                      </div>
                    </div>
                    <div className="ml-11 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Commission ({data.commissionPercentage}%): {formatCurrency(vendor.commission)}
                      </span>
                      <span className="font-semibold text-green-600">Net: {formatCurrency(vendor.netRevenue)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No vendor data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
