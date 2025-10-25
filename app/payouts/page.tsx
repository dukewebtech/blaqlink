"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react"

type WithdrawalStatus = "pending" | "approved" | "rejected"

interface Withdrawal {
  id: string
  storeName: string
  amount: string
  dateRequested: string
  bankName: string
  accountNumber: string
  accountName: string
  status: WithdrawalStatus
}

const tabs = [
  { id: "all", label: "All Withdrawals", count: 0 },
  { id: "approved", label: "Approved", count: 0 },
  { id: "pending", label: "Pending", count: 0 },
  { id: "rejected", label: "Rejected", count: 0 },
]

export default function PayoutsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    availableBalance: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
  })
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  })

  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const { toast } = useToast()

  const fetchPayoutData = async () => {
    try {
      console.log("[v0] Fetching payout data from API...")
      setLoading(true)
      const response = await fetch("/api/payouts")

      if (response.status === 401) {
        console.error("[v0] User not authenticated, redirecting to login...")
        toast({
          title: "Authentication Required",
          description: "Please log in to view your payout data.",
          variant: "destructive",
        })
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = "/login"
        }, 2000)
        return
      }

      if (!response.ok) {
        console.error("[v0] API response not OK:", response.status)
        throw new Error("Failed to fetch payout data")
      }

      const data = await response.json()
      console.log("[v0] Payout API response:", data)

      if (data.ok) {
        console.log("[v0] Payout data loaded successfully")
        console.log("[v0] Total Revenue:", data.data.totalRevenue)
        console.log("[v0] Available Balance:", data.data.availableBalance)
        console.log("[v0] Total Withdrawals:", data.data.totalWithdrawals)
        console.log("[v0] Pending Withdrawals:", data.data.pendingWithdrawals)
        console.log("[v0] Withdrawal History Count:", data.data.withdrawalHistory.length)

        // Set stats
        setStats({
          totalRevenue: data.data.totalRevenue,
          availableBalance: data.data.availableBalance,
          totalWithdrawals: data.data.totalWithdrawals,
          pendingWithdrawals: data.data.pendingWithdrawals,
        })

        const formattedWithdrawals: Withdrawal[] = data.data.withdrawalHistory.map((w: any) => ({
          id: w.id,
          storeName: w.storeName,
          amount: `₦${w.amount.toLocaleString()}`,
          dateRequested: new Date(w.date).toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
          }),
          bankName: w.bankName,
          accountNumber: w.accountNumber,
          accountName: w.accountName,
          status: w.status,
        }))

        setWithdrawals(formattedWithdrawals)

        setTabCounts({
          all: formattedWithdrawals.length,
          approved: formattedWithdrawals.filter((w) => w.status === "approved").length,
          pending: formattedWithdrawals.filter((w) => w.status === "pending").length,
          rejected: formattedWithdrawals.filter((w) => w.status === "rejected").length,
        })
      } else {
        console.error("[v0] API returned error:", data.error)
      }
    } catch (error) {
      console.error("[v0] Error fetching payout data:", error)
      toast({
        title: "Error",
        description: "Failed to load payout data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayoutData()
  }, [])

  const filteredWithdrawals =
    activeTab === "all" ? withdrawals : withdrawals.filter((withdrawal) => withdrawal.status === activeTab)

  const toggleWithdrawal = (id: string) => {
    setSelectedWithdrawals((prev) => (prev.includes(id) ? prev.filter((wid) => wid !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    setSelectedWithdrawals((prev) =>
      prev.length === filteredWithdrawals.length ? [] : filteredWithdrawals.map((w) => w.id),
    )
  }

  const handleNewWithdrawal = () => {
    setShowWithdrawalDialog(true)
  }

  const handleSubmitWithdrawal = async () => {
    if (!withdrawalAmount || !bankName || !accountNumber || !accountName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(withdrawalAmount)
    if (amount <= 0 || amount > stats.availableBalance) {
      toast({
        title: "Error",
        description: `Please enter a valid amount between ₦1 and ₦${stats.availableBalance.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      console.log("[v0] Submitting withdrawal request:", {
        amount: withdrawalAmount,
        accountNumber,
        bankName,
        accountName,
      })

      const response = await fetch("/api/withdrawal-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: withdrawalAmount,
          bankName,
          accountNumber,
          accountName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit withdrawal request")
      }

      console.log("[v0] Withdrawal request submitted successfully:", data)

      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully. Awaiting admin approval.",
      })

      // Reset form and close dialog
      setWithdrawalAmount("")
      setAccountNumber("")
      setBankName("")
      setAccountName("")
      setShowWithdrawalDialog(false)

      // Refresh payout data
      fetchPayoutData()
    } catch (error) {
      console.error("[v0] Error submitting withdrawal request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit withdrawal request",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
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
                <p className="text-3xl font-bold">{loading ? "..." : `₦${stats.totalRevenue.toLocaleString()}`}</p>
                <div className="flex items-center gap-1.5 text-sm">
                  <TrendingUp className="size-4 text-green-300" />
                  <span className="text-green-300 font-medium">From orders</span>
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
                {loading ? "..." : `₦${stats.availableBalance.toLocaleString()}`}
              </p>
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="size-4 text-green-600" />
                <span className="text-muted-foreground">Ready for withdrawal</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Withdrawals</h3>
              <ArrowUpRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-foreground">
                {loading ? "..." : `₦${stats.totalWithdrawals.toLocaleString()}`}
              </p>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Approved withdrawals</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Pending Withdrawals</h3>
              <ArrowUpRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-foreground">
                {loading ? "..." : `₦${stats.pendingWithdrawals.toLocaleString()}`}
              </p>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Awaiting approval</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search for id, store name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 bg-transparent">
              <SlidersHorizontal className="size-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="size-4" />
              Export
            </Button>
            <Button className="gap-2" onClick={handleNewWithdrawal}>
              <Plus className="size-4" />
              New Withdrawal
            </Button>
          </div>
        </div>

        {/* Tabs with sliding indicator */}
        <div className="relative bg-card rounded-xl border border-border p-1">
          <div className="flex items-center gap-1 relative">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                `}
              >
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-primary/10 rounded-lg transition-all duration-200" />
                )}
                <span className="relative z-10">
                  {tab.label} ({tabCounts[tab.id as keyof typeof tabCounts]})
                </span>
              </button>
            ))}
          </div>
          {/* Sliding underline indicator */}
          <div
            className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-out"
            style={{
              left: `${(tabs.findIndex((t) => t.id === activeTab) / tabs.length) * 100}%`,
              width: `${100 / tabs.length}%`,
            }}
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading withdrawal history...</div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No withdrawal requests found. Click "New Withdrawal" to request a withdrawal.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedWithdrawals.length === filteredWithdrawals.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        Withdrawal ID
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        Store Name
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        Amount
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        Date Requested
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        Bank Details
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        Status
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      <div className="flex items-center justify-end gap-1">
                        Action
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((withdrawal, index) => (
                    <TableRow key={`${withdrawal.id}-${index}`} className="group hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Checkbox
                          checked={selectedWithdrawals.includes(withdrawal.id)}
                          onCheckedChange={() => toggleWithdrawal(withdrawal.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-primary">{withdrawal.id}</span>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">{withdrawal.storeName}</TableCell>
                      <TableCell className="text-foreground font-semibold">{withdrawal.amount}</TableCell>
                      <TableCell className="text-foreground">{withdrawal.dateRequested}</TableCell>
                      <TableCell className="text-foreground">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{withdrawal.bankName}</span>
                          <span className="text-xs text-muted-foreground">{withdrawal.accountNumber}</span>
                          <span className="text-xs text-muted-foreground">{withdrawal.accountName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            withdrawal.status === "approved"
                              ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                              : withdrawal.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                          }
                        >
                          {withdrawal.status === "approved"
                            ? "Approved"
                            : withdrawal.status === "pending"
                              ? "Pending"
                              : "Rejected"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="size-8 hover:bg-muted">
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 hover:bg-muted">
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredWithdrawals.length} withdrawal{filteredWithdrawals.length !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">The page on</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-12 gap-1 bg-transparent">
                        1
                        <ChevronDown className="size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>1</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="icon" className="size-8 bg-transparent">
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="size-8 bg-transparent">
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request New Withdrawal</DialogTitle>
            <DialogDescription>
              Enter your bank details to request a withdrawal. Your request will be sent to admin for approval.
              Available balance: ₦{stats.availableBalance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Withdrawal Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                max={stats.availableBalance}
              />
              <p className="text-xs text-muted-foreground">Maximum: ₦{stats.availableBalance.toLocaleString()}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="Enter bank name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="Enter account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                placeholder="Enter account name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawalDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitWithdrawal} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
