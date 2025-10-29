"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, TrendingUp, ArrowUpRight, Wallet, CheckCircle2, Clock, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface PayoutStats {
  totalRevenue: number
  availableToWithdraw: number
  totalWithdrawals: number
  pendingWithdrawals: number
}

interface Withdrawal {
  id: string
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  status: string
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export default function PayoutsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestAmount, setRequestAmount] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch orders for revenue calculation
      const ordersResponse = await fetch("/api/orders")
      const ordersData = await ordersResponse.json()

      // Fetch withdrawals
      const withdrawalsResponse = await fetch("/api/withdrawals")
      const withdrawalsData = await withdrawalsResponse.json()

      if (ordersResponse.ok && withdrawalsResponse.ok) {
        // Calculate stats from orders
        const paidOrders = ordersData.orders?.filter(
          (order: any) => order.payment_status === "paid" || order.payment_status === "success",
        )
        const totalRevenue =
          paidOrders?.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0) || 0

        // Calculate withdrawal stats
        const allWithdrawals = withdrawalsData.withdrawals || []
        const completedWithdrawals = allWithdrawals.filter(
          (w: Withdrawal) => w.status === "completed" || w.status === "approved",
        )
        const pendingWithdrawals = allWithdrawals.filter((w: Withdrawal) => w.status === "pending")

        const totalWithdrawn = completedWithdrawals.reduce((sum: number, w: Withdrawal) => sum + Number(w.amount), 0)
        const totalPending = pendingWithdrawals.reduce((sum: number, w: Withdrawal) => sum + Number(w.amount), 0)

        setStats({
          totalRevenue,
          availableToWithdraw: totalRevenue - totalWithdrawn - totalPending,
          totalWithdrawals: totalWithdrawn,
          pendingWithdrawals: totalPending,
        })

        setWithdrawals(allWithdrawals)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch payout data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestWithdrawal = async () => {
    if (!requestAmount || Number(requestAmount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (Number(requestAmount) > (stats?.availableToWithdraw || 0)) {
      alert("Insufficient balance")
      return
    }

    if (!bankName || !accountNumber || !accountName) {
      alert("Please fill in all bank details")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(requestAmount),
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowRequestModal(false)
        setRequestAmount("")
        setBankName("")
        setAccountNumber("")
        setAccountName("")
        fetchData() // Refresh data
        alert("Withdrawal request submitted successfully!")
      } else {
        alert(data.error || "Failed to submit withdrawal request")
      }
    } catch (error) {
      console.error("[v0] Failed to request withdrawal:", error)
      alert("Failed to submit withdrawal request")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20">
            <CheckCircle2 className="size-3 mr-1" />
            {status === "approved" ? "Approved" : "Completed"}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-500/20">
            <Clock className="size-3 mr-1" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-500/20">
            <XCircle className="size-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredWithdrawals = withdrawals.filter(
    (w) =>
      w.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.status.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Payouts</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Dashboard</span>
            <span>›</span>
            <span className="text-foreground font-medium">Payouts</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-white border-0 group hover:shadow-lg transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-medium text-white/90">Total Revenue</h3>
                <ArrowUpRight className="size-5 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold">NGN {stats?.totalRevenue.toLocaleString() || 0}</p>
                <div className="flex items-center gap-1.5 text-sm">
                  <TrendingUp className="size-4 text-green-300" />
                  <span className="text-white/70">From all completed orders</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 size-32 bg-white/10 rounded-full blur-2xl" />
          </Card>

          {/* Available to Withdraw */}
          <Card className="p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Available to Withdraw</h3>
              <ArrowUpRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-foreground">
                NGN {stats?.availableToWithdraw.toLocaleString() || 0}
              </p>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Ready for withdrawal</span>
              </div>
            </div>
          </Card>

          {/* Total Withdrawals */}
          <Card className="p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Withdrawals</h3>
              <ArrowUpRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-foreground">NGN {stats?.totalWithdrawals.toLocaleString() || 0}</p>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">All time withdrawals</span>
              </div>
            </div>
          </Card>

          {/* Pending Withdrawals */}
          <Card className="p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Pending Withdrawals</h3>
              <ArrowUpRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-foreground">
                NGN {stats?.pendingWithdrawals.toLocaleString() || 0}
              </p>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Awaiting processing</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search withdrawals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => router.push("/settings/payout")}>
              <Wallet className="size-4" />
              Bank Settings
            </Button>
            <Button className="gap-2" onClick={() => setShowRequestModal(true)}>
              Request Withdrawal
            </Button>
          </div>
        </div>

        {/* Withdrawal History */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Withdrawal History</h3>
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No withdrawal requests yet</p>
                <Button className="mt-4" onClick={() => setShowRequestModal(true)}>
                  Request Your First Withdrawal
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWithdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{withdrawal.bank_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {withdrawal.account_name} • {withdrawal.account_number}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(withdrawal.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">NGN {Number(withdrawal.amount).toLocaleString()}</p>
                        {withdrawal.admin_notes && (
                          <p className="text-xs text-muted-foreground mt-1">{withdrawal.admin_notes}</p>
                        )}
                      </div>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Request Withdrawal Modal */}
        <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Enter the amount and your bank details. Funds will be processed within 1-3 business days.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (NGN)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  min="0"
                  max={stats?.availableToWithdraw || 0}
                />
                <p className="text-sm text-muted-foreground">
                  Available balance: NGN {stats?.availableToWithdraw.toLocaleString() || 0}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  type="text"
                  placeholder="e.g., GTBank, Access Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  type="text"
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  type="text"
                  placeholder="Account holder name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>

              <div className="p-4 bg-accent rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Your withdrawal will be reviewed and processed by our team. You'll receive a notification once it's
                  completed.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRequestModal(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleRequestWithdrawal} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
