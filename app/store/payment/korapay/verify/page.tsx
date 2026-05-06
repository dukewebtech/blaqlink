"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, XCircle } from "lucide-react"
import { cartStore } from "@/lib/cart-store"
import { OrderConfirmationDocument } from "@/components/order-confirmation-document"

export default function KoraPayVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [orderData, setOrderData] = useState<any>(null)
  const [vendorData, setVendorData] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const isPopup = window.opener && !window.opener.closed
    const reference = searchParams.get("reference")

    console.log("[korapay/verify-page] Is popup:", isPopup, "Reference:", reference)

    if (isPopup && reference) {
      // Running inside popup — hand control back to parent and close
      window.opener.location.href = `/store/payment/korapay/verify?reference=${reference}`
      window.close()
      return
    }

    if (!reference) {
      setStatus("error")
      setError("Payment reference not found")
      return
    }

    verifyPayment(reference)
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch(`/api/payment/korapay/verify?reference=${reference}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Payment verification failed")

      setOrderData(data.order)
      setVendorData(data.vendor)
      setStatus("success")
      cartStore.clearCart()
      sessionStorage.removeItem("pendingOrder")
    } catch (err: any) {
      console.error("[korapay/verify-page] Error:", err)
      setStatus("error")
      setError(err.message || "Failed to verify payment")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Verifying Payment…</h2>
          <p className="text-muted-foreground">Please wait while we confirm your payment</p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg border p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => router.push("/store/checkout")} className="w-full" size="lg">Try Again</Button>
            <Button variant="outline" onClick={() => router.push("/store")} className="w-full">Back to Store</Button>
          </div>
        </div>
      </div>
    )
  }

  return <OrderConfirmationDocument order={orderData} vendor={vendorData} />
}
