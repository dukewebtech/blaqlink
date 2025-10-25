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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform-wide overview and statistics</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Platform Revenue"
            value={loading ? "Loading..." : formatCurrency(stats?.totalRevenue || 0)}
            change="+12.5%"
            changeLabel="From last month"
            trend="up"
            icon={TrendingUp}
            className="bg-gradient-to-br from-primary to-primary/80 text-white border-0 hover:shadow-2xl transition-all duration-500 hover:scale-105"
            delay={0}
          />
          <StatsCard
            title="Total Users"
            value={loading ? "Loading..." : stats?.totalUsers.toLocaleString() || "0"}
            change="+8.2%"
            changeLabel="From last month"
            trend="up"
            icon={Users}
            delay={100}
          />
          <StatsCard
            title="Total Orders"
            value={loading ? "Loading..." : stats?.totalOrders.toLocaleString() || "0"}
            change="+15.3%"
            changeLabel="From last month"
            trend="up"
            icon={ShoppingCart}
            delay={200}
          />
          <StatsCard
            title="Total Products"
            value={loading ? "Loading..." : stats?.totalProducts.toLocaleString() || "0"}
            change="+5.7%"
            changeLabel="From last month"
            trend="up"
            icon={Package}
            delay={300}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-destructive">Pending Withdrawals</CardTitle>
                  <CardDescription>Requests awaiting approval</CardDescription>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-destructive">
                  {loading ? "Loading..." : stats?.pendingWithdrawalsCount || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total amount: {loading ? "..." : formatCurrency(stats?.totalPendingWithdrawals || 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-green-600">Approved Payouts</CardTitle>
                  <CardDescription>Total payouts processed</CardDescription>
                </div>
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">
                  {loading ? "Loading..." : formatCurrency(stats?.totalApprovedWithdrawals || 0)}
                </div>
                <p className="text-sm text-muted-foreground">Successfully paid out to stores</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
