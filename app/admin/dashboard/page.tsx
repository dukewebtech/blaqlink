"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  LogOut,
  LayoutDashboard,
  Receipt,
  Package,
  Wallet,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface AdminStats {
  totalVendors: number
  totalOrders: number
  totalRevenue: number
  pendingWithdrawals: number
  pendingWithdrawalAmount: number
}

interface WithdrawalRequest {
  id: string
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  status: string
  created_at: string
  user?: {
    full_name: string
    email: string
    business_name: string
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeSection, setActiveSection] = useState("dashboard")

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const profileResponse = await fetch("/api/users/me")
      const profileData = await profileResponse.json()

      if (!profileResponse.ok || !profileData.data?.user) {
        window.location.href = "/admin/login"
        return
      }

      const userData = profileData.data.user

      if (!userData.is_admin && userData.role !== "admin") {
        window.location.href = "/admin/login"
        return
      }

      setUser(userData)

      const statsResponse = await fetch("/api/admin/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      const withdrawalsResponse = await fetch("/api/admin/withdrawals")
      if (withdrawalsResponse.ok) {
        const withdrawalsData = await withdrawalsResponse.json()
        setWithdrawals(withdrawalsData.data || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/admin/login"
  }

  const handleApproveWithdrawal = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      })

      if (response.ok) {
        fetchAdminData()
      }
    } catch (error) {
      console.error("[v0] Failed to approve withdrawal:", error)
    }
  }

  const handleRejectWithdrawal = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (response.ok) {
        fetchAdminData()
      }
    } catch (error) {
      console.error("[v0] Failed to reject withdrawal:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-red-900 dark:text-red-100 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
      {/* Sidebar */}
      <aside className="w-64 bg-red-900 text-white p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-10 w-10 text-red-200" />
          <div>
            <h1 className="text-xl font-bold">Admin Portal</h1>
            <p className="text-xs text-red-200">Platform Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveSection("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "dashboard" ? "bg-red-800 text-white" : "text-red-100 hover:bg-red-800/50"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </button>

          <Link
            href="/transactions"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-100 hover:bg-red-800/50 transition-colors"
          >
            <Receipt className="h-5 w-5" />
            <span className="font-medium">Transactions</span>
          </Link>

          <Link
            href="/orders"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-100 hover:bg-red-800/50 transition-colors"
          >
            <Package className="h-5 w-5" />
            <span className="font-medium">Orders</span>
          </Link>

          <button
            onClick={() => setActiveSection("withdrawals")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "withdrawals" ? "bg-red-800 text-white" : "text-red-100 hover:bg-red-800/50"
            }`}
          >
            <Wallet className="h-5 w-5" />
            <span className="font-medium">Withdrawals</span>
            {stats && stats.pendingWithdrawals > 0 && (
              <Badge className="ml-auto bg-red-600 text-white">{stats.pendingWithdrawals}</Badge>
            )}
          </button>

          <button
            onClick={() => setActiveSection("vendors")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "vendors" ? "bg-red-800 text-white" : "text-red-100 hover:bg-red-800/50"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="font-medium">Vendors</span>
          </button>
        </nav>

        <div className="border-t border-red-800 pt-4 mt-4">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs text-red-200">Logged in as</p>
            <p className="text-sm font-medium truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-100 hover:bg-red-800/50 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {activeSection === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-red-900 dark:text-red-100">Dashboard Overview</h2>
              <p className="text-red-700 dark:text-red-200">Platform statistics and insights</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6 bg-white dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-300 font-medium">Total Vendors</p>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">{stats?.totalVendors || 0}</p>
                  </div>
                  <Users className="h-12 w-12 text-red-500" />
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-300 font-medium">Total Orders</p>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">{stats?.totalOrders || 0}</p>
                  </div>
                  <ShoppingBag className="h-12 w-12 text-red-500" />
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-300 font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">
                      ₦{stats?.totalRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-red-500" />
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-300 font-medium">Pending Withdrawals</p>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">
                      {stats?.pendingWithdrawals || 0}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                      ₦{stats?.pendingWithdrawalAmount?.toLocaleString() || 0}
                    </p>
                  </div>
                  <DollarSign className="h-12 w-12 text-red-500" />
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6 bg-white dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">Quick Actions</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/transactions">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    <Receipt className="mr-2 h-4 w-4" />
                    View All Transactions
                  </Button>
                </Link>
                <Link href="/orders">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    <Package className="mr-2 h-4 w-4" />
                    View All Orders
                  </Button>
                </Link>
                <Button
                  onClick={() => setActiveSection("withdrawals")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Manage Withdrawals
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeSection === "withdrawals" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-red-900 dark:text-red-100">Withdrawal Requests</h2>
              <p className="text-red-700 dark:text-red-200">Review and manage vendor withdrawal requests</p>
            </div>

            <Card className="p-6 bg-white dark:bg-red-900/20 border-red-200 dark:border-red-800">
              {withdrawals.length === 0 ? (
                <p className="text-center text-red-600 dark:text-red-300 py-8">No pending withdrawals</p>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-800 p-4 bg-red-50 dark:bg-red-900/10"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-red-900 dark:text-red-100">
                            {withdrawal.user?.business_name || withdrawal.user?.full_name}
                          </p>
                          <Badge
                            variant={withdrawal.status === "pending" ? "secondary" : "default"}
                            className="bg-red-600 text-white"
                          >
                            {withdrawal.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-300">{withdrawal.user?.email}</p>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                          <p>
                            <span className="font-medium">Bank:</span> {withdrawal.bank_name}
                          </p>
                          <p>
                            <span className="font-medium">Account:</span> {withdrawal.account_number} -{" "}
                            {withdrawal.account_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                          ₦{withdrawal.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-300 mb-3">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </p>
                        {withdrawal.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveWithdrawal(withdrawal.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRejectWithdrawal(withdrawal.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeSection === "vendors" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-red-900 dark:text-red-100">Vendor Management</h2>
              <p className="text-red-700 dark:text-red-200">View and manage all platform vendors</p>
            </div>

            <Card className="p-6 bg-white dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <p className="text-center text-red-600 dark:text-red-300 py-8">Vendor management features coming soon</p>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
