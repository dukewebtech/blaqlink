"use client"

import type React from "react"
import { ArrowLeft, Package, MapPin, CreditCard } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cartStore, type CartItem } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NigerianLocationSelect } from "@/components/checkout/nigerian-location-select"
import Image from "next/image"

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  // Customer Information
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Shipping Address
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")

  // Additional Notes
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const cart = cartStore.getCart()
    if (cart.items.length === 0) {
      router.push("/store/cart")
      return
    }
    setItems(cart.items)
    setTotal(cart.total)
  }, [router])

  const hasPhysicalProducts = items.some((item) => item.product_type === "physical")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate form
    if (!customerName || !customerEmail || !customerPhone) {
      alert("Please fill in all required fields")
      setLoading(false)
      return
    }

    if (hasPhysicalProducts && (!address || !city || !state)) {
      alert("Please provide shipping address for physical products")
      setLoading(false)
      return
    }

    // Prepare order data
    const orderData = {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_address: hasPhysicalProducts
        ? {
            address,
            city,
            state,
            zip_code: zipCode,
          }
        : null,
      items: items.map((item) => ({
        product_id: item.product_id,
        product_title: item.title,
        product_type: item.product_type,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      })),
      total_amount: total,
      notes,
    }

    // Store order data in sessionStorage for payment page
    sessionStorage.setItem("pendingOrder", JSON.stringify(orderData))

    // Redirect to payment page
    router.push("/store/payment")
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => router.push("/store/cart")} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Button>

        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Customer Information */}
              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Customer Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address (only for physical products) */}
              {hasPhysicalProducts && (
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Shipping Address</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="address">
                          Street Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="123 Main Street"
                          required={hasPhysicalProducts}
                        />
                      </div>
                    </div>

                    <NigerianLocationSelect
                      state={state}
                      city={city}
                      onStateChange={setState}
                      onCityChange={setCity}
                      required={hasPhysicalProducts}
                    />

                    <div>
                      <Label htmlFor="zipCode">Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="100001"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-2xl font-bold mb-4">Additional Notes</h2>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or notes for your order..."
                  rows={4}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border p-6 sticky top-4">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

                {/* Order Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{item.product_type}</p>
                        <p className="text-sm font-medium mt-1">
                          {item.quantity} × NGN {item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="space-y-3 border-t pt-4 mb-6">
                  <div className="flex justify-between text-base">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">NGN {total.toLocaleString()}</span>
                  </div>
                  {hasPhysicalProducts && (
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">Calculated at payment</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>NGN {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <Button type="submit" className="w-full h-12 text-base gap-2" disabled={loading}>
                  <CreditCard className="w-5 h-5" />
                  {loading ? "Processing..." : "Proceed to Payment"}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Your payment information is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
