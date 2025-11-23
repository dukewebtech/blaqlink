"use client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import {
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DashboardStats {
  totalRevenue: number
  totalCustomers: number
  totalTransactions: number
  totalProducts: number
  revenueChange: string
}

interface UserProfile {
  id: string
  kyc_status: "not_submitted" | "pending_review" | "approved" | "rejected"
  admin_kyc_approved: boolean
  full_name?: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userStoreId, setUserStoreId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [storeUrl, setStoreUrl] = useState<string>("")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

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
          const user = result.data?.user || result.user || result
          console.log("[v0] Dashboard - User profile:", user)
          setUserProfile(user)
          setUserStoreId(user.id)
          if (typeof window !== "undefined") {
            setStoreUrl(`${window.location.origin}/store/${user.id}`)
          }
        }
      } catch (error) {
        console.error("[v0] Failed to fetch user profile:", error)
      }
    }

    fetchStats()
    fetchUserProfile()
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("[v0] Failed to copy to clipboard:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getKycStatusDisplay = () => {
    if (!userProfile) return null

    const { kyc_status, admin_kyc_approved } = userProfile

    if (admin_kyc_approved) {
      return {
        icon: CheckCircle,
        title: "Account Verified",
        description: "Your account has been verified. You can now access all features.",
        variant: "default" as const,
        iconColor: "text-green-600",
      }
    }

    switch (kyc_status) {
      case "pending_review":
        return {
          icon: Clock,
          title: "Verification Pending",
          description: "Your documents are being reviewed. This typically takes 24-48 hours.",
          variant: "default" as const,
          iconColor: "text-yellow-600",
        }
      case "rejected":
        return {
          icon: XCircle,
          title: "Verification Failed",
          description: "Your verification was unsuccessful. Please contact support for assistance.",
          variant: "destructive" as const,
          iconColor: "text-destructive",
        }
      case "not_submitted":
      default:
        return {
          icon: AlertCircle,
          title: "Account Not Verified",
          description: "Complete your onboarding to verify your account and access all features.",
          variant: "default" as const,
          iconColor: "text-blue-600",
        }
    }
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

  const kycStatus = getKycStatusDisplay()

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Dashboard</p>
          </div>
          {userStoreId && storeUrl && userProfile?.admin_kyc_approved && (
            <div className="flex items-center gap-2">
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline font-medium"
              >
                {storeUrl}
              </a>
              <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-2 bg-transparent">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          )}
        </div>

        {kycStatus && (
          <Alert variant={kycStatus.variant} className="border-2">
            <kycStatus.icon className={`h-5 w-5 ${kycStatus.iconColor}`} />
            <AlertTitle className="font-semibold">{kycStatus.title}</AlertTitle>
            <AlertDescription>{kycStatus.description}</AlertDescription>
          </Alert>
        )}

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
