"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react"
import Link from "next/link"

interface OrderItem {
  id: string
  product_title: string
  product_type: string
  quantity: number
  price: number
  subtotal: number
}

interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: number
  status: string
  payment_status: string
  payment_reference: string
  created_at: string
  order_items: OrderItem[]
}

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/orders")
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === "all" || order.status === activeTab
    const matchesSearch =
      searchQuery === "" ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.payment_reference.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  const tabs = [
    { id: "all", label: "All Orders", count: orders.length },
    { id: "confirmed", label: "Confirmed", count: orders.filter((o) => o.status === "confirmed").length },
    { id: "processing", label: "Processing", count: orders.filter((o) => o.status === "processing").length },
    { id: "shipped", label: "Shipped", count: orders.filter((o) => o.status === "shipped").length },
    { id: "delivered", label: "Delivered", count: orders.filter((o) => o.status === "delivered").length },
    { id: "cancelled", label: "Cancelled", count: orders.filter((o) => o.status === "cancelled").length },
  ]

  const toggleOrder = (id: string) => {
    setSelectedOrders((prev) => (prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    setSelectedOrders((prev) => (prev.length === filteredOrders.length ? [] : filteredOrders.map((o) => o.id)))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
      case "processing":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
      case "shipped":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
      case "delivered":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
      case "cancelled":
        return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

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
          <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Dashboard</span>
            <span>›</span>
            <span className="text-foreground font-medium">Transactions</span>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, customer, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" className="gap-2 bg-transparent flex-1 sm:flex-none">
              <SlidersHorizontal className="size-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent flex-1 sm:flex-none">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs with sliding indicator */}
        <div className="relative bg-card rounded-xl border border-border p-1">
          <div className="flex items-center gap-1 relative overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
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
        </div>

        {/* Table / Cards */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || activeTab !== "all" ? "No orders match your filters" : "No transactions yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="divide-y divide-border md:hidden">
                {filteredOrders.map((order) => {
                  const isPaid = order.payment_status === "paid" || order.payment_status === "success"
                  return (
                    <div key={order.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{order.customer_email}</p>
                          <p className="text-xs text-primary font-mono mt-0.5">#{order.id.slice(0, 8)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-sm">NGN {order.total_amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={isPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                            {isPaid ? "Paid" : "Unpaid"}
                          </Badge>
                          <Badge variant="secondary" className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="ghost" size="icon" className="size-8">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead className="font-semibold">Order ID</TableHead>
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Payment</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const isPaid = order.payment_status === "paid" || order.payment_status === "success"
                      return (
                        <TableRow key={order.id} className="group hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <Checkbox checked={selectedOrders.includes(order.id)} onCheckedChange={() => toggleOrder(order.id)} />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs text-primary font-medium">#{order.id.slice(0, 8)}</span>
                              <span className="text-xs text-muted-foreground font-mono">{order.payment_reference}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{order.customer_name}</span>
                              <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">NGN {order.total_amount.toLocaleString()}</TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
                          </TableCell>
                          <TableCell>
                            <Badge className={isPaid ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"}>
                              {isPaid ? "Paid" : "Unpaid"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/orders/${order.id}`}>
                                <Button variant="ghost" size="icon" className="size-8 hover:bg-muted">
                                  <Eye className="size-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" className="size-8 hover:bg-muted">
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredOrders.length} of {orders.length} orders
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
