"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { OrderConfirmationDocument } from "@/components/order-confirmation-document"

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<any>(null)
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/public/orders/${orderId}`)
      .then((res) => {
        if (res.status === 404) { setNotFound(true); return null }
        return res.json()
      })
      .then((data) => {
        if (data) {
          setOrder(data.order)
          setVendor(data.vendor)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-6xl font-bold text-muted-foreground/30">404</div>
          <h1 className="text-2xl font-bold">Order not found</h1>
          <p className="text-muted-foreground text-sm">
            This order doesn't exist or the link may have expired.
          </p>
        </div>
      </div>
    )
  }

  return <OrderConfirmationDocument order={order} vendor={vendor} />
}
