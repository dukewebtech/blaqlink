"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Order {
  id: string
  product: string
  customer: string
  price: number
  status: string
  image: string | null
  itemCount: number
}

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch("/api/dashboard/recent-orders")
        const data = await response.json()
        setOrders(data)
      } catch (error) {
        console.error("[v0] Failed to fetch recent orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push("/orders")}>
            Show All
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={order.image || "/placeholder.svg?height=48&width=48"}
                            alt={order.product}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{order.id.slice(0, 8)}</p>
                          <p className="text-sm font-medium">
                            {order.product}
                            {order.itemCount > 1 && ` +${order.itemCount - 1} more`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm">{order.customer}</td>
                    <td className="py-4 px-4 text-sm font-medium">{formatCurrency(order.price)}</td>
                    <td className="py-4 px-4">
                      <Badge
                        className={
                          order.status === "success"
                            ? "bg-success/10 text-success hover:bg-success/20 border-0"
                            : "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        size="sm"
                        className="bg-[#1e293b] hover:bg-[#1e293b]/90 text-white"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
