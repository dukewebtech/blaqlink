"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import Image from "next/image"
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
  payment_status: string
  status: string
  created_at: string
  order_items: OrderItem[]
}

interface StatusCounts {
  all: number
  shipping: number
  completed: number
  cancelled: number
}

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    shipping: 0,
    completed: 0,
    cancelled: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [activeTab])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/transactions?status=${activeTab}`)
      const data = await response.json()
      setOrders(data.orders || [])
      setStatusCounts(data.statusCounts || { all: 0, shipping: 0, completed: 0, cancelled: 0 })
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: "all", label: "All Orders", count: statusCounts.all },
    { id: "shipping", label: "Shipping", count: statusCounts.shipping },
    { id: "completed", label: "Completed", count: statusCounts.completed },
    { id: "cancelled", label: "Cancel", count: statusCounts.cancelled },
  ]

  const toggleOrder = (id: string) => {
    setSelectedOrders((prev) => (prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    setSelectedOrders((prev) => (prev.length === orders.length ? [] : orders.map((o) => o.id)))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Dashboard</span>
            <span>›</span>
            <span>Orders</span>
            <span>›</span>
            <span className="text-primary font-medium">All Orders</span>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search for id, name product"
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
              New Order
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">No orders found</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="w-12">
                    <Checkbox checked={selectedOrders.length === orders.length} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      Orders
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      Customer
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      Price
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      Date
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      Payment
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
                {orders.map((order) => (
                  <TableRow key={order.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => toggleOrder(order.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src="/placeholder.svg?height=40&width=40"
                            alt={order.order_items[0]?.product_title || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-primary font-medium">{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className="text-sm font-medium text-foreground">
                            {order.order_items[0]?.product_title || "Multiple Items"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{order.customer_name}</TableCell>
                    <TableCell className="text-foreground">NGN {Number(order.total_amount).toLocaleString()}</TableCell>
                    <TableCell className="text-foreground">{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.payment_status === "success" || order.payment_status === "paid"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          order.payment_status === "success" || order.payment_status === "paid"
                            ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }
                      >
                        {order.payment_status === "success" || order.payment_status === "paid" ? "Paid" : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          order.status === "shipping"
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
                            : order.status === "completed"
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                        }
                      >
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
          )}

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
