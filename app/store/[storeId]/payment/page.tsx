"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Shield, Lock, AlertCircle } from "lucide-react"
import { cartStore } from "@/lib/cart-store"
import { OrderConfirmationDocument } from "@/components/order-confirmation-document"

export default function PaymentPage({ params }: { params: { storeId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [verifiedOrder, setVerifiedOrder] = useState<any>(null)
  const [vendorData, setVendorData] = useState<any>(null)

  useEffect(() => {
    // Get order data from sessionStorage
    const pendingOrder = sessionStorage.getItem("pendingOrder")
    if (!pendingOrder) {
      router.push(`/store/${params.storeId}/cart`)
      return
    }

    try {
      const data = JSON.parse(pendingOrder)
      console.log("[v0] Order data loaded:", data)
      setOrderData(data)
    } catch (error) {
      console.error("[v0] Failed to parse order data:", error)
      router.push(`/store/${params.storeId}/cart`)
    }
  }, [router, params.storeId])

  const handlePayment = async () => {
    if (!orderData) return

    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Initializing payment for:", orderData.customer_email)

      // Initialize payment
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: orderData.customer_email,
          amount: orderData.total_amount,
          metadata: orderData,
        }),
      })

      const data = await response.json()
      console.log("[v0] Payment initialization response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed")
      }

      if (!data.authorization_url) {
        throw new Error("No authorization URL received from Paystack")
      }

      console.log("[v0] Opening Paystack in new window:", data.authorization_url)

      const paystackWindow = window.open(data.authorization_url, "_blank", "width=600,height=800")

      if (!paystackWindow) {
        // If popup was blocked, fall back to redirect
        console.log("[v0] Popup blocked, falling back to redirect")
        window.location.href = data.authorization_url
      } else {
        const checkWindow = setInterval(async () => {
          if (paystackWindow.closed) {
            clearInterval(checkWindow)
            console.log("[v0] Payment window closed, verifying payment...")

            // Verify payment
            try {
              const verifyResponse = await fetch(`/api/payment/verify?reference=${data.reference}`)
              const verifyData = await verifyResponse.json()

              console.log("[v0] Payment verification response:", verifyData)

              if (verifyResponse.ok && verifyData.success) {
                setVerifiedOrder(verifyData.order)
                setVendorData(verifyData.vendor)
                setShowConfirmation(true)

                // Clear cart and pending order
                cartStore.clearCart()
                sessionStorage.removeItem("pendingOrder")
              } else {
                setError(verifyData.error || "Payment verification failed. Please contact support.")
              }
            } catch (error: any) {
              console.error("[v0] Verification error:", error)
              setError("Failed to verify payment. Please contact support with your reference: " + data.reference)
            } finally {
              setLoading(false)
            }
          }
        }, 1000)
      }
    } catch (error: any) {
      console.error("[v0] Payment error:", error)
      setError(error.message || "Failed to initialize payment. Please try again.")
      setLoading(false)
    }
  }

  if (showConfirmation && verifiedOrder) {
    return <OrderConfirmationDocument order={verifiedOrder} vendor={vendorData} />
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-lg border p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
            <p className="text-muted-foreground">You're almost done! Complete your payment to place your order.</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Payment Error</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Total</span>
              <span className="font-bold text-lg">NGN {orderData.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium">{orderData.items.length} item(s)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{orderData.customer_email}</span>
            </div>
          </div>

          <Button onClick={handlePayment} disabled={loading} className="w-full h-12 text-base" size="lg">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Pay with Paystack
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Secured by Paystack - Your payment is safe and encrypted</span>
          </div>

          <Button variant="ghost" onClick={() => router.push(`/store/${params.storeId}/checkout`)} disabled={loading}>
            Back to Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}
