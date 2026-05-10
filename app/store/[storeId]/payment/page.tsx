"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Shield, Lock, AlertCircle, CheckCircle } from "lucide-react"
import { createCartStore } from "@/lib/cart-store"
import { OrderConfirmationDocument } from "@/components/order-confirmation-document"

type Gateway = "paystack" | "korapay"
const ORDER_TTL_MS = 30 * 60 * 1000 // 30 minutes

export default function PaymentPage({ params }: { params: { storeId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = createCartStore(params.storeId)

  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [verifiedOrder, setVerifiedOrder] = useState<any>(null)
  const [vendorData, setVendorData] = useState<any>(null)
  const [gateway, setGateway] = useState<Gateway>("paystack")

  // On mount: either verify a redirect callback or load pending order
  useEffect(() => {
    const inboundRef = searchParams.get("reference") || searchParams.get("trxref")
    const inboundGateway = (searchParams.get("gateway") as Gateway) || "paystack"

    if (inboundRef) {
      // Coming back from payment gateway redirect — auto-verify
      verifyAfterRedirect(inboundRef, inboundGateway)
      return
    }

    const raw = sessionStorage.getItem("pendingOrder")
    if (!raw) { router.push(`/store/${params.storeId}/cart`); return }

    try {
      const parsed = JSON.parse(raw)
      if (parsed._timestamp && Date.now() - parsed._timestamp > ORDER_TTL_MS) {
        sessionStorage.removeItem("pendingOrder")
        router.push(`/store/${params.storeId}/cart`)
        return
      }
      setOrderData(parsed)
    } catch {
      router.push(`/store/${params.storeId}/cart`)
    }
  }, [])

  const verifyAfterRedirect = async (reference: string, gw: Gateway) => {
    setVerifying(true)
    setError(null)
    try {
      const endpoint = gw === "korapay"
        ? `/api/payment/korapay/verify?reference=${reference}`
        : `/api/payment/verify?reference=${reference}`
      const res = await fetch(endpoint)
      const data = await res.json()
      if (res.ok && data.success) {
        setVerifiedOrder(data.order)
        setVendorData(data.vendor)
        setShowConfirmation(true)
        store.clearCart()
        sessionStorage.removeItem("pendingOrder")
      } else {
        setError(data.error || "Payment verification failed. Please contact support.")
      }
    } catch {
      setError(`Failed to verify payment. Please contact support with reference: ${reference}`)
    } finally {
      setVerifying(false)
    }
  }

  const handlePayment = async () => {
    if (!orderData) return
    setLoading(true)
    setError(null)
    try {
      if (gateway === "paystack") {
        await payWithPaystack()
      } else {
        await payWithKoraPay()
      }
    } catch (err: any) {
      setError(err.message || "Failed to initialize payment. Please try again.")
      setLoading(false)
    }
  }

  const payWithPaystack = async () => {
    const callbackBase = `${window.location.origin}/store/${params.storeId}/payment?gateway=paystack`
    const response = await fetch("/api/payment/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: orderData.customer_email,
        amount: orderData.total_amount,
        metadata: orderData,
        storeId: params.storeId,
        callbackUrl: callbackBase,
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Payment initialization failed")
    if (!data.authorization_url) throw new Error("No authorization URL received")
    window.location.href = data.authorization_url
  }

  const payWithKoraPay = async () => {
    const redirectUrl = `${window.location.origin}/store/${params.storeId}/payment?gateway=korapay`
    const response = await fetch("/api/payment/korapay/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: orderData.customer_email,
        amount: orderData.total_amount,
        metadata: orderData,
        storeId: params.storeId,
        redirectUrl,
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "KoraPay initialization failed")
    if (!data.checkout_url) throw new Error("No checkout URL received")
    window.location.href = data.checkout_url
  }

  if (showConfirmation && verifiedOrder) {
    return <OrderConfirmationDocument order={verifiedOrder} vendor={vendorData} />
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium">Verifying your payment…</p>
          <p className="text-sm text-muted-foreground">Please wait, do not close this page.</p>
        </div>
      </div>
    )
  }

  if (!orderData && !verifying) {
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
            <p className="text-muted-foreground">Choose a payment method and complete your order.</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Payment Error</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-5 space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Total</span>
              <span className="font-bold text-lg">NGN {orderData?.total_amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium">{orderData?.items?.length} item(s)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate max-w-[200px]">{orderData?.customer_email}</span>
            </div>
          </div>

          {/* Gateway selector */}
          <div className="text-left">
            <p className="text-sm font-medium text-muted-foreground mb-3">Select payment method</p>
            <div className="grid grid-cols-2 gap-3">
              {(["paystack", "korapay"] as Gateway[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGateway(g)}
                  className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none ${
                    gateway === g ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        gateway === g ? "border-primary" : "border-muted-foreground/40"
                      }`}
                    >
                      {gateway === g && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm font-semibold capitalize">
                      {g === "korapay" ? "KoraPay" : "Paystack"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">
                    {g === "paystack" ? "Cards, bank transfer, USSD" : "Cards, bank transfer"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2 text-left">
            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              You'll be redirected to {gateway === "paystack" ? "Paystack" : "KoraPay"} to complete payment securely,
              then automatically returned here.
            </p>
          </div>

          <Button onClick={handlePayment} disabled={loading} className="w-full h-12 text-base" size="lg">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting to gateway…
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Pay with {gateway === "paystack" ? "Paystack" : "KoraPay"}
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Payments are secure and encrypted</span>
          </div>

          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${params.storeId}/checkout`)}
            disabled={loading}
          >
            Back to Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}
