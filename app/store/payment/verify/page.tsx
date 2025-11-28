"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, XCircle } from "lucide-react"
import { cartStore } from "@/lib/cart-store"
import { OrderConfirmationDocument } from "@/components/order-confirmation-document"

export default function PaymentVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [orderData, setOrderData] = useState<any>(null)
  const [vendorData, setVendorData] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const isPopup = window.opener && !window.opener.closed
    const reference = searchParams.get("reference")

    console.log("[v0] Verify page loaded. Is popup:", isPopup, "Reference:", reference)

    if (isPopup && reference) {
      // We're in a popup, redirect the parent window and close this popup
      console.log("[v0] Redirecting parent window to verify page")
      window.opener.location.href = `/store/payment/verify?reference=${reference}`
      window.close()
      return
    }

    // Normal flow - verify the payment
    if (!reference) {
      setStatus("error")
      setError("Payment reference not found")
      return
    }

    verifyPayment(reference)
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      console.log("[v0] Verifying payment for reference:", reference)
      const response = await fetch(`/api/payment/verify?reference=${reference}`)
      const data = await response.json()

      console.log("[v0] Verification response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Payment verification failed")
      }

      // Payment successful
      setOrderData(data.order)
      setVendorData(data.vendor)
      setStatus("success")

      // Clear cart and session storage
      cartStore.clearCart()
      sessionStorage.removeItem("pendingOrder")

      console.log("[v0] Payment verified successfully. Order ID:", data.order_id)
    } catch (error: any) {
      console.error("[v0] Payment verification error:", error)
      setStatus("error")
      setError(error.message || "Failed to verify payment")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Verifying Payment...</h2>
          <p className="text-muted-foreground">Please wait while we confirm your payment</p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-card rounded-lg border p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
              <p className="text-muted-foreground">{error}</p>
            </div>

            <div className="space-y-3">
              <Button onClick={() => router.push("/store/checkout")} className="w-full" size="lg">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => router.push("/store")} className="w-full">
                Back to Store
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state - show the order confirmation document
  return <OrderConfirmationDocument order={orderData} vendor={vendorData} />
}
