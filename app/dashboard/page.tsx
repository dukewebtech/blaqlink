"use client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { TrendingUp, Users, ShoppingCart, Package } from "lucide-react"
import { useEffect, useState } from "react"

interface DashboardStats {
  totalRevenue: number
  totalCustomers: number
  totalTransactions: number
  totalProducts: number
  revenueChange: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/dashboard/stats")
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("[v0] Failed to fetch dashboard stats:", error)
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
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={loading ? "Loading..." : formatCurrency(stats?.totalRevenue || 0)}
            change={loading ? "..." : `${Number(stats?.revenueChange || 0) >= 0 ? "+" : ""}${stats?.revenueChange}%`}
            changeLabel="From last week"
            trend={Number(stats?.revenueChange || 0) >= 0 ? "up" : "down"}
            icon={TrendingUp}
            className="bg-gradient-to-br from-primary to-primary/80 text-white border-0 hover:shadow-2xl transition-all duration-500 hover:scale-105"
            delay={0}
          />
          <StatsCard
            title="Total Customer"
            value={loading ? "Loading..." : stats?.totalCustomers.toLocaleString() || "0"}
            change="+1.5%"
            changeLabel="From last week"
            trend="up"
            icon={Users}
            delay={100}
          />
          <StatsCard
            title="Total Transactions"
            value={loading ? "Loading..." : stats?.totalTransactions.toLocaleString() || "0"}
            change="+3.6%"
            changeLabel="From last week"
            trend="up"
            icon={ShoppingCart}
            delay={200}
          />
          <StatsCard
            title="Total Product"
            value={loading ? "Loading..." : stats?.totalProducts.toLocaleString() || "0"}
            change="-1.5%"
            changeLabel="From last week"
            trend="down"
            icon={Package}
            delay={300}
          />
        </div>

        {/* Sales Chart */}
        <SalesChart />

        {/* Recent Orders */}
        <RecentOrders />
      </div>
    </DashboardLayout>
  )
}
