"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

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
  total_amount: number
  status: string
  payment_status: string
  payment_reference: string
  created_at: string
  order_items: OrderItem[]
}

interface SalesStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  revenueChange: number
  ordersChange: number
}

interface ProductSales {
  product_title: string
  product_type: string
  total_quantity: number
  total_revenue: number
}

export default function SalesReportPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30") // days
  const [stats, setStats] = useState<SalesStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    revenueChange: 0,
    ordersChange: 0,
  })
  const [productSales, setProductSales] = useState<ProductSales[]>([])

  useEffect(() => {
    fetchSalesData()
  }, [dateRange])

  const fetchSalesData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/orders")
      const data = await response.json()

      if (response.ok) {
        const allOrders = data.orders || []

        // Filter orders by date range
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - Number.parseInt(dateRange))

        const filteredOrders = allOrders.filter((order: Order) => {
          const orderDate = new Date(order.created_at)
          return orderDate >= cutoffDate && order.payment_status === "success"
        })

        setOrders(filteredOrders)
        calculateStats(filteredOrders, allOrders)
        calculateProductSales(filteredOrders)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch sales data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (currentOrders: Order[], allOrders: Order[]) => {
    // Current period stats
    const totalRevenue = currentOrders.reduce((sum, order) => sum + order.total_amount, 0)
    const totalOrders = currentOrders.length
    const uniqueCustomers = new Set(currentOrders.map((order) => order.customer_email)).size
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Previous period for comparison
    const previousCutoffDate = new Date()
    previousCutoffDate.setDate(previousCutoffDate.getDate() - Number.parseInt(dateRange) * 2)
    const currentCutoffDate = new Date()
    currentCutoffDate.setDate(currentCutoffDate.getDate() - Number.parseInt(dateRange))

    const previousOrders = allOrders.filter((order: Order) => {
      const orderDate = new Date(order.created_at)
      return orderDate >= previousCutoffDate && orderDate < currentCutoffDate && order.payment_status === "success"
    })

    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total_amount, 0)
    const previousOrderCount = previousOrders.length

    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const ordersChange = previousOrderCount > 0 ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 : 0

    setStats({
      totalRevenue,
      totalOrders,
      totalCustomers: uniqueCustomers,
      averageOrderValue,
      revenueChange,
      ordersChange,
    })
  }

  const calculateProductSales = (orders: Order[]) => {
    const productMap = new Map<string, ProductSales>()

    orders.forEach((order) => {
      order.order_items.forEach((item) => {
        const key = item.product_title
        if (productMap.has(key)) {
          const existing = productMap.get(key)!
          existing.total_quantity += item.quantity
          existing.total_revenue += item.subtotal
        } else {
          productMap.set(key, {
            product_title: item.product_title,
            product_type: item.product_type,
            total_quantity: item.quantity,
            total_revenue: item.subtotal,
          })
        }
      })
    })

    const sortedProducts = Array.from(productMap.values()).sort((a, b) => b.total_revenue - a.total_revenue)
    setProductSales(sortedProducts)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const exportToCSV = () => {
    const headers = ["Date", "Order ID", "Customer", "Email", "Amount", "Status", "Payment Ref"]
    const rows = orders.map((order) => [
      new Date(order.created_at).toLocaleDateString(),
      order.id,
      order.customer_name,
      order.customer_email,
      order.total_amount,
      order.status,
      order.payment_reference,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-report-${dateRange}-days.csv`
    a.click()
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Report</h1>
            <p className="text-muted-foreground">Comprehensive sales analytics and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              {stats.revenueChange !== 0 && (
                <Badge variant={stats.revenueChange > 0 ? "default" : "destructive"} className="gap-1">
                  {stats.revenueChange > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(stats.revenueChange).toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              {stats.ordersChange !== 0 && (
                <Badge variant={stats.ordersChange > 0 ? "default" : "destructive"} className="gap-1">
                  {stats.ordersChange > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(stats.ordersChange).toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Unique Customers</p>
            <p className="text-2xl font-bold">{stats.totalCustomers}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</p>
          </Card>
        </div>

        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Top Selling Products</h2>
          </div>
          {productSales.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No product sales data available</p>
          ) : (
            <div className="space-y-4">
              {productSales.slice(0, 10).map((product, index) => (
                <div
                  key={product.product_title}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.product_title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {product.product_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{product.total_quantity} sold</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(product.total_revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Transactions</h2>
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions found for this period</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-bold">{formatCurrency(order.total_amount)}</p>
                    <Badge className="bg-green-100 text-green-800">{order.payment_status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
