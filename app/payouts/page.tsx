"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  TrendingDown,
  ArrowUpRight,
} from "lucide-react"

type WithdrawalStatus = "pending" | "completed" | "cancelled"

interface Withdrawal {
  id: string
  storeName: string
  amount: string
  dateRequested: string
  paymentMethod: string
  status: WithdrawalStatus
  accountNumber: string
}

const allWithdrawals: Withdrawal[] = [
  {
    id: "WD12451",
    storeName: "Kanky Store",
    amount: "$1,250.00",
    dateRequested: "04/17/23",
    paymentMethod: "Bank Transfer",
    status: "completed",
    accountNumber: "****5486",
  },
  {
    id: "WD12452",
    storeName: "Fashion Hub",
    amount: "$850.50",
    dateRequested: "04/17/23",
    paymentMethod: "PayPal",
    status: "pending",
    accountNumber: "****3995",
  },
  {
    id: "WD12453",
    storeName: "Tech Store",
    amount: "$2,100.00",
    dateRequested: "04/17/23",
    paymentMethod: "Bank Transfer",
    status: "completed",
    accountNumber: "****5624",
  },
  {
    id: "WD12454",
    storeName: "Kanky Store",
    amount: "$500.00",
    dateRequested: "04/16/23",
    paymentMethod: "Bank Transfer",
    status: "cancelled",
    accountNumber: "****5486",
  },
  {
    id: "WD12455",
    storeName: "Fashion Hub",
    amount: "$1,750.00",
    dateRequested: "04/16/23",
    paymentMethod: "Stripe",
    status: "completed",
    accountNumber: "****3995",
  },
  {
    id: "WD12456",
    storeName: "Tech Store",
    amount: "$950.00",
    dateRequested: "04/15/23",
    paymentMethod: "Bank Transfer",
    status: "pending",
    accountNumber: "****5624",
  },
  {
    id: "WD12457",
    storeName: "Kanky Store",
    amount: "$3,200.00",
    dateRequested: "04/15/23",
    paymentMethod: "Bank Transfer",
    status: "completed",
    accountNumber: "****5486",
  },
  {
    id: "WD12458",
    storeName: "Fashion Hub",
    amount: "$650.00",
    dateRequested: "04/14/23",
    paymentMethod: "PayPal",
    status: "cancelled",
    accountNumber: "****3995",
  },
]

const tabs = [
  { id: "all", label: "All Withdrawals", count: 441 },
  { id: "completed", label: "Completed", count: 300 },
  { id: "cancelled", label: "Cancelled", count: 41 },
]

export default function PayoutsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const filteredWithdrawals =
    activeTab === "all" ? allWithdrawals : allWithdrawals.filter((withdrawal) => withdrawal.status === activeTab)

  const toggleWithdrawal = (id: string) => {
    setSelectedWithdrawals((prev) => (prev.includes(id) ? prev.filter((wid) => wid !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    setSelectedWithdrawals((prev) =>
      prev.length === filteredWithdrawals.length ? [] : filteredWithdrawals.map((w) => w.id),
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
                <p className="text-3xl font-bold">$81,000</p>
                <div className="flex items-center gap-1.5 text-sm">
                  <TrendingUp className="size-4 text-green-300" />
                  <span className="text-green-300 font-medium">16.6%</span>
                  <span className="text-white/70">From last week</span>
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
              <p className="text-3xl font-bold text-foreground">5,000</p>
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="size-4 text-green-600" />
                <span className="text-green-600 font-medium">1.5%</span>
                <span className="text-muted-foreground">From last week</span>
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
              <p className="text-3xl font-bold text-foreground">12,000</p>
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="size-4 text-green-600" />
                <span className="text-green-600 font-medium">3.6%</span>
                <span className="text-muted-foreground">From last week</span>
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
              <p className="text-3xl font-bold text-foreground">5,000</p>
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingDown className="size-4 text-red-600" />
                <span className="text-red-600 font-medium">1.5%</span>
                <span className="text-muted-foreground">From last week</span>
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
            <Button className="gap-2">
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
                  {tab.label} ({tab.count})
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
                    Payment Method
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
                      <span className="text-sm">{withdrawal.paymentMethod}</span>
                      <span className="text-xs text-muted-foreground">{withdrawal.accountNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        withdrawal.status === "completed"
                          ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                          : withdrawal.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                      }
                    >
                      {withdrawal.status === "completed"
                        ? "Completed"
                        : withdrawal.status === "pending"
                          ? "Pending"
                          : "Cancelled"}
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
            <div className="text-sm text-muted-foreground">1 - 10 of 13 Pages</div>
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
                  <DropdownMenuItem>2</DropdownMenuItem>
                  <DropdownMenuItem>3</DropdownMenuItem>
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
        </div>
      </div>
    </DashboardLayout>
  )
}
