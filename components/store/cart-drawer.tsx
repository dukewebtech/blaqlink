"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react"
import { createCartStore, type CartItem } from "@/lib/cart-store"

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: string
  themeButton?: string
}

export function CartDrawer({ open, onOpenChange, storeId, themeButton }: CartDrawerProps) {
  const router = useRouter()
  const store = createCartStore(storeId)
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)

  const refresh = () => {
    const cart = store.getCart()
    setItems(cart.items)
    setTotal(cart.total)
  }

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener("cartUpdated", handler)
    return () => window.removeEventListener("cartUpdated", handler)
  }, [storeId])

  useEffect(() => {
    if (open) refresh()
  }, [open])

  const updateQty = (itemId: string, qty: number) => {
    store.updateQuantity(itemId, qty)
    refresh()
  }

  const removeItem = (itemId: string) => {
    store.removeItem(itemId)
    refresh()
  }

  const handleCheckout = () => {
    onOpenChange(false)
    router.push(`/store/${storeId}/checkout`)
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(price)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Add items to get started</p>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.product_type}</p>
                    <p className="text-sm font-semibold mt-1">{formatPrice(item.price)}</p>
                    {item.appointment_date && item.appointment_time && (
                      <p className="text-xs text-primary mt-0.5">
                        📅{" "}
                        {new Date(item.appointment_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {item.appointment_time}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {item.product_type === "physical" ? (
                      <div className="flex items-center gap-1 border rounded-lg">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 hover:bg-muted disabled:opacity-30 transition-colors rounded-l-lg"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-muted transition-colors rounded-r-lg"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t px-6 py-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-xl font-bold">{formatPrice(total)}</span>
              </div>
              <Button
                className={`w-full h-12 gap-2 ${themeButton ?? ""}`}
                onClick={handleCheckout}
              >
                Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
