"use client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { TrendingUp, Users, ShoppingCart, Package } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

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
  const [error, setError] = useState<string | null>(null)
  const [userStoreId, setUserStoreId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/dashboard/stats")
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch stats")
        }
        const data = await response.json()
        setStats(data)
        setError(null)
      } catch (error) {
        console.error("[v0] Failed to fetch dashboard stats:", error)
        setError(error instanceof Error ? error.message : "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    async function fetchUserProfile() {
      try {
        const response = await fetch("/api/users/me")
        if (response.ok) {
          const result = await response.json()
          const userId = result.data?.user?.id || result.user?.id || result.id
          console.log("[v0] Dashboard - User store ID:", userId)
          setUserStoreId(userId)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch user profile:", error)
      }
    }

    fetchStats()
    fetchUserProfile()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-sm text-muted-foreground">Please try refreshing the page or logging in again.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Dashboard</p>
          </div>
          {userStoreId && (
            <Button onClick={() => window.open(`/store/${userStoreId}`, "_blank")} variant="outline" className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
              View Storefront
            </Button>
          )}
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
            value={loading ? "Loading..." : (stats?.totalCustomers ?? 0).toLocaleString()}
            change="+1.5%"
            changeLabel="From last week"
            trend="up"
            icon={Users}
            delay={100}
          />
          <StatsCard
            title="Total Transactions"
            value={loading ? "Loading..." : (stats?.totalTransactions ?? 0).toLocaleString()}
            change="+3.6%"
            changeLabel="From last week"
            trend="up"
            icon={ShoppingCart}
            delay={200}
          />
          <StatsCard
            title="Total Product"
            value={loading ? "Loading..." : (stats?.totalProducts ?? 0).toLocaleString()}
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
