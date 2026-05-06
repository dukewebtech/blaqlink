"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Shield, Lock, AlertCircle, CheckCircle } from "lucide-react"

type Gateway = "paystack" | "korapay"

export default function PaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [verifiedOrder, setVerifiedOrder] = useState<any>(null)
  const [gateway, setGateway] = useState<Gateway>("paystack")

  useEffect(() => {
    const pendingOrder = sessionStorage.getItem("pendingOrder")
    if (!pendingOrder) { router.push("/store/cart"); return }
    try {
      setOrderData(JSON.parse(pendingOrder))
    } catch {
      router.push("/store/cart")
    }
  }, [router])

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
    const response = await fetch("/api/payment/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: orderData.customer_email, amount: orderData.total_amount, metadata: orderData }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Payment initialization failed")
    if (!data.authorization_url) throw new Error("No authorization URL received from Paystack")

    const paystackWindow = window.open(data.authorization_url, "_blank", "width=600,height=800")
    if (!paystackWindow) { window.location.href = data.authorization_url; return }

    const checkWindow = setInterval(async () => {
      if (paystackWindow.closed) {
        clearInterval(checkWindow)
        try {
          const verifyResponse = await fetch(`/api/payment/verify?reference=${data.reference}`)
          const verifyData = await verifyResponse.json()
          if (verifyResponse.ok && verifyData.success) {
            setVerifiedOrder(verifyData.order)
            setShowSuccessModal(true)
            sessionStorage.removeItem("pendingOrder")
          } else {
            setError(verifyData.error || "Payment verification failed. Please contact support.")
          }
        } catch {
          setError("Failed to verify payment. Please contact support with your reference: " + data.reference)
        } finally {
          setLoading(false)
        }
      }
    }, 1000)
  }

  const payWithKoraPay = async () => {
    const response = await fetch("/api/payment/korapay/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: orderData.customer_email, amount: orderData.total_amount, metadata: orderData }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "KoraPay initialization failed")
    if (!data.checkout_url) throw new Error("No checkout URL received from KoraPay")

    const koraWindow = window.open(data.checkout_url, "_blank", "width=600,height=800")
    if (!koraWindow) { window.location.href = data.checkout_url; return }

    const checkWindow = setInterval(async () => {
      if (koraWindow.closed) {
        clearInterval(checkWindow)
        try {
          const verifyResponse = await fetch(`/api/payment/korapay/verify?reference=${data.reference}`)
          const verifyData = await verifyResponse.json()
          if (verifyResponse.ok && verifyData.success) {
            setVerifiedOrder(verifyData.order)
            setShowSuccessModal(true)
            sessionStorage.removeItem("pendingOrder")
          } else {
            setError(verifyData.error || "Payment verification failed. Please contact support.")
          }
        } catch {
          setError("Failed to verify payment. Please contact support with your reference: " + data.reference)
        } finally {
          setLoading(false)
        }
      }
    }, 1000)
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
              <span className="font-bold text-lg">NGN {orderData.total_amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium">{orderData.items?.length} item(s)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate max-w-[200px]">{orderData.customer_email}</span>
            </div>
          </div>

          {/* Gateway selector */}
          <div className="text-left space-y-2">
            <p className="text-sm font-medium text-muted-foreground mb-3">Select payment method</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGateway("paystack")}
                className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none ${
                  gateway === "paystack"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    gateway === "paystack" ? "border-primary" : "border-muted-foreground/40"
                  }`}>
                    {gateway === "paystack" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">Paystack</span>
                </div>
                <p className="text-xs text-muted-foreground pl-5">Cards, bank transfer, USSD</p>
              </button>

              <button
                type="button"
                onClick={() => setGateway("korapay")}
                className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none ${
                  gateway === "korapay"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    gateway === "korapay" ? "border-primary" : "border-muted-foreground/40"
                  }`}>
                    {gateway === "korapay" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold">KoraPay</span>
                </div>
                <p className="text-xs text-muted-foreground pl-5">Cards, bank transfer</p>
              </button>
            </div>
          </div>

          <Button onClick={handlePayment} disabled={loading} className="w-full h-12 text-base" size="lg">
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing…</>
            ) : (
              <><Lock className="w-5 h-5 mr-2" />Pay with {gateway === "paystack" ? "Paystack" : "KoraPay"}</>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Payments are secure and encrypted</span>
          </div>

          <Button variant="ghost" onClick={() => router.push("/store/checkout")} disabled={loading}>
            Back to Checkout
          </Button>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg border max-w-md w-full p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground">Your order has been placed successfully.</p>
            </div>
            {verifiedOrder && (
              <div className="bg-muted/50 rounded-lg p-5 space-y-3 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono font-medium">#{verifiedOrder.id?.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-bold text-green-600">NGN {verifiedOrder.total_amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-green-600">Paid</span>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <Button onClick={() => { setShowSuccessModal(false); router.push("/store") }} className="w-full" size="lg">
                Continue Shopping
              </Button>
              <Button variant="outline" onClick={() => { setShowSuccessModal(false); router.push("/store") }} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
