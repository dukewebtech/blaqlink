"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Package, User, MapPin, CreditCard, Calendar, Truck, RotateCw, Store } from "lucide-react"

interface OrderItem {
  id: string
  product_title: string
  product_type: string
  quantity: number
  price: number
  subtotal: number
  product_image: string | null
  variant_label: string | null
  ticket_tier_name: string | null
  appointment_date: string | null
  appointment_time: string | null
}

interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: any
  delivery_method: "delivery" | "pickup" | null
  delivery_area: string | null
  delivery_address: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_postal_code: string | null
  customer_note: string | null
  total_amount: number
  status: string
  payment_status: string
  payment_reference: string
  created_at: string
  updated_at: string
  order_items: OrderItem[]
  shipping_provider: "terminal_africa" | "shipbubble" | null
  shipping_status: "pending_booking" | "booked" | "failed" | null
  shipping_tracking_number: string | null
  shipping_tracking_url: string | null
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [notified, setNotified] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setOrder(data.order || null)
      } else {
        setOrder(null)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch order:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return

    setUpdating(true)
    setNotified(false)
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: order.id,
          status: newStatus,
          notifyCustomer,
        }),
      })

      if (response.ok) {
        setOrder({ ...order, status: newStatus })
        if (notifyCustomer) {
          setNotified(true)
          setTimeout(() => setNotified(false), 4000)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to update order:", error)
    } finally {
      setUpdating(false)
    }
  }

  const retryShipmentBooking = async () => {
    if (!order) return
    setRetrying(true)
    try {
      const response = await fetch("/api/shipping/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await response.json()
      if (response.ok && data.order) {
        setOrder({ ...order, ...data.order })
      }
    } catch (error) {
      console.error("[v0] Failed to retry shipment booking:", error)
    } finally {
      setRetrying(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Order not found</h3>
          <Button onClick={() => router.push("/orders")}>Back to Orders</Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/orders")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Order Details</h1>
              <p className="text-muted-foreground font-mono text-sm">#{order.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <Select value={order.status} onValueChange={updateOrderStatus} disabled={updating}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Checkbox checked={notifyCustomer} onCheckedChange={(v) => setNotifyCustomer(v === true)} />
              Notify customer by email
            </label>
            {notified && <p className="text-xs text-green-600">Customer notified ✓</p>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </h2>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4 pb-4 border-b last:border-0">
                    <div className="flex gap-3 min-w-0">
                      <img
                        src={item.product_image || "/placeholder.svg"}
                        alt=""
                        className="h-14 w-14 rounded-md border object-cover shrink-0 bg-muted"
                      />
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{item.product_title}</h3>
                        <p className="text-sm text-muted-foreground capitalize">Type: {item.product_type}</p>
                        {item.variant_label && (
                          <p className="text-sm text-muted-foreground">Option: {item.variant_label}</p>
                        )}
                        {item.ticket_tier_name && (
                          <p className="text-sm text-muted-foreground">Tier: {item.ticket_tier_name}</p>
                        )}
                        {item.appointment_date && (
                          <p className="text-sm text-muted-foreground">
                            Appointment: {item.appointment_date}
                            {item.appointment_time ? ` at ${item.appointment_time}` : ""}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        <p className="text-sm font-medium mt-1">NGN {item.price.toLocaleString()} each</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold shrink-0">NGN {item.subtotal.toLocaleString()}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold">NGN {order.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Delivery / Pickup */}
            {order.delivery_method && (
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  {order.delivery_method === "pickup" ? (
                    <Store className="h-5 w-5" />
                  ) : (
                    <MapPin className="h-5 w-5" />
                  )}
                  {order.delivery_method === "pickup" ? "Pickup" : "Delivery Address"}
                </h2>
                {order.delivery_method === "pickup" ? (
                  <p className="text-sm text-muted-foreground">Customer will pick this order up in person.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {order.delivery_area && <p className="font-medium">{order.delivery_area}</p>}
                    {order.delivery_address && <p>{order.delivery_address}</p>}
                    {(order.delivery_city || order.delivery_state) && (
                      <p>{[order.delivery_city, order.delivery_state].filter(Boolean).join(", ")}</p>
                    )}
                    {order.delivery_postal_code && <p>{order.delivery_postal_code}</p>}
                    {!order.delivery_address && !order.delivery_area && (
                      <p className="text-muted-foreground">No address on file for this order.</p>
                    )}
                  </div>
                )}
                {order.customer_note && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Customer note</p>
                    <p className="text-sm">{order.customer_note}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{order.customer_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.customer_phone}</p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className="mt-1 bg-green-100 text-green-800">{order.payment_status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-mono text-xs mt-1">{order.payment_reference}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg mt-1">NGN {order.total_amount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Shipment */}
            {order.shipping_provider && (
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipment
                </h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Courier</p>
                    <p className="font-medium capitalize">{order.shipping_provider.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge
                      className={`mt-1 ${
                        order.shipping_status === "booked"
                          ? "bg-green-100 text-green-800"
                          : order.shipping_status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.shipping_status === "booked"
                        ? "Booked"
                        : order.shipping_status === "failed"
                          ? "Booking failed"
                          : "Pending booking"}
                    </Badge>
                  </div>
                  {order.shipping_tracking_number && (
                    <div>
                      <p className="text-muted-foreground">Tracking number</p>
                      <p className="font-mono text-xs mt-1">{order.shipping_tracking_number}</p>
                    </div>
                  )}
                  {order.shipping_tracking_url && (
                    <a
                      href={order.shipping_tracking_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary underline"
                    >
                      Track shipment
                    </a>
                  )}
                  {order.shipping_status === "failed" && (
                    <Button size="sm" variant="outline" onClick={retryShipmentBooking} disabled={retrying}>
                      <RotateCw className={`h-4 w-4 mr-2 ${retrying ? "animate-spin" : ""}`} />
                      Retry booking
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {new Date(order.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
