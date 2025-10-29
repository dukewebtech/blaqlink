"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { TrendingUp, Users, ShoppingCart, Package, Wallet, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminStats {
  totalUsers: number
  totalProducts: number
  totalRevenue: number
  totalOrders: number
  pendingWithdrawalsCount: number
  totalPendingWithdrawals: number
  totalApprovedWithdrawals: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats")
        if (!response.ok) {
          throw new Error("Failed to fetch stats")
        }
        const data = await response.json()
        setStats(data)
        console.log("[v0] Admin stats loaded:", data)
      } catch (error) {
        console.error("[v0] Failed to fetch admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform-wide overview and statistics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={loading ? "..." : stats?.totalUsers || 0}
            icon={Users}
            trend={{ value: 0, isPositive: true }}
          />
          <StatsCard
            title="Total Products"
            value={loading ? "..." : stats?.totalProducts || 0}
            icon={Package}
            trend={{ value: 0, isPositive: true }}
          />
          <StatsCard
            title="Total Orders"
            value={loading ? "..." : stats?.totalOrders || 0}
            icon={ShoppingCart}
            trend={{ value: 0, isPositive: true }}
          />
          <StatsCard
            title="Platform Revenue"
            value={loading ? "..." : formatCurrency(stats?.totalRevenue || 0)}
            icon={TrendingUp}
            trend={{ value: 0, isPositive: true }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-900">Pending Withdrawals</CardTitle>
              <CardDescription className="text-xs text-red-700">Requests awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div className="text-2xl font-bold text-red-900">
                  {loading ? "Loading..." : stats?.pendingWithdrawalsCount || 0}
                </div>
              </div>
              <p className="text-xs text-red-700 mt-1">
                Total amount: {loading ? "..." : formatCurrency(stats?.totalPendingWithdrawals || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Approved Payouts</CardTitle>
              <CardDescription className="text-xs text-green-700">Total payouts processed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-green-600" />
                <div className="text-2xl font-bold text-green-900">
                  {loading ? "Loading..." : formatCurrency(stats?.totalApprovedWithdrawals || 0)}
                </div>
              </div>
              <p className="text-xs text-green-700 mt-1">Successfully paid out to stores</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
