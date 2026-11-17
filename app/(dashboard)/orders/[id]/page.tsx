"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, ArrowLeft, Package, User, MapPin, CreditCard, Calendar, Truck, RotateCw, Store, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { formatNaira } from "@/lib/money"
import { addDays, lagosDate, lagosWeekday } from "@/lib/dates"

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
  time_slots?: string[]
  available_days?: string[]
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
  shipping_status: "pending_booking" | "booking" | "booked" | "failed" | null
  needs_attention: boolean
  attention_reason: string | null
  refunded_at: string | null
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
  const [refundOpen, setRefundOpen] = useState(false)
  const [refunding, setRefunding] = useState(false)
  const [refundError, setRefundError] = useState<string | null>(null)
  const [moveItem, setMoveItem] = useState<OrderItem | null>(null)
  const [moveDate, setMoveDate] = useState("")
  const [moveTime, setMoveTime] = useState("")
  const [moving, setMoving] = useState(false)
  const [moveError, setMoveError] = useState<string | null>(null)

  async function refund() {
    if (!order) return
    setRefunding(true)
    setRefundError(null)
    try {
      const res = await fetch(`/api/orders/${order.id}/refund`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRefundError(data.error ?? "The refund didn't go through. Please try again.")
        return
      }
      setRefundOpen(false)
      toast.success("Refund sent", { description: "The buyer has been emailed. It usually arrives in 5 to 10 working days." })
      fetchOrder()
    } catch {
      setRefundError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setRefunding(false)
    }
  }

  async function reschedule() {
    if (!order || !moveItem) return
    if (!moveDate || !moveTime) {
      setMoveError("Pick a new date and time.")
      return
    }
    setMoving(true)
    setMoveError(null)
    try {
      const res = await fetch(`/api/orders/${order.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: moveItem.id, date: moveDate, time: moveTime }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMoveError(data.error ?? "We couldn't move this booking.")
        return
      }
      setMoveItem(null)
      toast.success("Booking moved", { description: "The buyer has been emailed the new time." })
      fetchOrder()
    } catch {
      setMoveError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setMoving(false)
    }
  }

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/orders")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Order Details</h1>
              <p className="text-muted-foreground font-mono text-sm">#{order.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-3">
              <Select value={order.status} onValueChange={updateOrderStatus} disabled={updating || order.payment_status !== "success"}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {order.status === "cancelled" && <SelectItem value="cancelled" disabled>Cancelled (refunded)</SelectItem>}
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Checkbox checked={notifyCustomer} onCheckedChange={(v) => setNotifyCustomer(v === true)} />
              Notify customer by email
            </label>
            {notified && <p className="text-xs text-green-600">Customer notified ✓</p>}
            {order.payment_status === "success" && (
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => setRefundOpen(true)}>
                Refund order
              </Button>
            )}
          </div>
        </div>

        {order.needs_attention && order.attention_reason && (
          <div role="alert" className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <p className="font-medium">This order needs your attention</p>
              <p className="text-sm text-muted-foreground">{order.attention_reason}</p>
            </div>
          </div>
        )}
        {order.payment_status === "refunded" && (
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <p className="font-medium">Refunded</p>
            <p className="text-muted-foreground">
              The buyer was refunded{order.refunded_at ? ` on ${new Date(order.refunded_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}` : ""}. Any tickets from this order no longer work.
            </p>
          </div>
        )}

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
                          <div className="text-sm text-muted-foreground">
                            Booked for {new Date(`${item.appointment_date}T12:00:00+01:00`).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}
                            {item.appointment_time ? ` at ${item.appointment_time}` : ""}
                            {order.payment_status === "success" && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto px-2"
                                onClick={() => {
                                  setMoveItem(item)
                                  setMoveDate("")
                                  setMoveTime("")
                                  setMoveError(null)
                                }}
                              >
                                Reschedule
                              </Button>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        <p className="text-sm font-medium mt-1">{formatNaira(item.price)} each</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold shrink-0">{formatNaira(item.subtotal)}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold">{formatNaira(order.total_amount)}</span>
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
                  <p className="font-bold text-lg mt-1">{formatNaira(order.total_amount)}</p>
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
          <Dialog open={refundOpen} onOpenChange={(v) => { setRefundOpen(v); if (!v) setRefundError(null) }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Refund this order?</DialogTitle>
            <DialogDescription>
              {formatNaira(order.total_amount)} goes back to {order.customer_name} through Paystack. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>The sale comes off your balance. The per-sale fee isn't returned.</li>
            <li>Tickets from this order stop working, and bookings free up their time.</li>
            <li>The buyer is emailed straight away.</li>
          </ul>
          {refundError && <p role="alert" className="text-sm text-destructive">{refundError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>Keep order</Button>
            <Button variant="destructive" onClick={refund} disabled={refunding}>
              {refunding && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Refund {formatNaira(order.total_amount)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!moveItem} onOpenChange={(v) => !v && setMoveItem(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule booking</DialogTitle>
            <DialogDescription>Pick a new time for {moveItem?.product_title}. The buyer is emailed the change.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="move-date">Date</Label>
              <Input id="move-date" type="date" min={addDays(lagosDate(), 0)} max={addDays(lagosDate(), 60)} value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />
              {moveDate && moveItem?.available_days && !moveItem.available_days.includes(lagosWeekday(moveDate)) && (
                <p className="text-xs text-amber-700">You're not normally available on {lagosWeekday(moveDate)}s.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="move-time">Time</Label>
              <Select value={moveTime} onValueChange={setMoveTime}>
                <SelectTrigger id="move-time">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {(moveItem?.time_slots ?? []).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {moveError && <p role="alert" className="text-sm text-destructive">{moveError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveItem(null)}>Cancel</Button>
            <Button onClick={reschedule} disabled={moving}>
              {moving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Move booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
