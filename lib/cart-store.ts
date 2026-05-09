// Cart store using localStorage for persistence — keyed per store to prevent cross-store contamination
export interface CartItem {
  id: string
  product_id: string
  title: string
  price: number
  quantity: number
  product_type: string
  image: string
  appointment_date?: string
  appointment_time?: string
  ticket_type?: string
}

export interface Cart {
  items: CartItem[]
  total: number
}

function makeCartStore(getKey: () => string) {
  return {
    getCart(): Cart {
      if (typeof window === "undefined") return { items: [], total: 0 }
      const stored = localStorage.getItem(getKey())
      if (!stored) return { items: [], total: 0 }
      try {
        return JSON.parse(stored) as Cart
      } catch {
        return { items: [], total: 0 }
      }
    },

    saveCart(cart: Cart): void {
      if (typeof window === "undefined") return
      localStorage.setItem(getKey(), JSON.stringify(cart))
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: cart }))
    },

    addItem(
      product: {
        id: string
        title: string
        price: number
        product_type: string
        images: string[]
      },
      quantity = 1,
      metadata?: {
        appointment_date?: string
        appointment_time?: string
        ticket_type?: string
      },
    ): void {
      const cart = this.getCart()
      const existingItem =
        product.product_type === "appointment" ? null : cart.items.find((item) => item.product_id === product.id)

      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        cart.items.push({
          id: crypto.randomUUID(),
          product_id: product.id,
          title: product.title,
          price: product.price,
          quantity,
          product_type: product.product_type,
          image: product.images[0] || "/placeholder.svg?height=100&width=100",
          ...(metadata?.appointment_date && { appointment_date: metadata.appointment_date }),
          ...(metadata?.appointment_time && { appointment_time: metadata.appointment_time }),
          ...(metadata?.ticket_type && { ticket_type: metadata.ticket_type }),
        })
      }

      cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      this.saveCart(cart)
    },

    updateQuantity(itemId: string, quantity: number): void {
      const cart = this.getCart()
      const item = cart.items.find((i) => i.id === itemId)
      if (item) {
        if (quantity <= 0) {
          this.removeItem(itemId)
        } else {
          item.quantity = quantity
          cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
          this.saveCart(cart)
        }
      }
    },

    removeItem(itemId: string): void {
      const cart = this.getCart()
      cart.items = cart.items.filter((item) => item.id !== itemId)
      cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      this.saveCart(cart)
    },

    clearCart(): void {
      this.saveCart({ items: [], total: 0 })
    },

    getItemCount(): number {
      return this.getCart().items.reduce((sum, item) => sum + item.quantity, 0)
    },
  }
}

/** Returns a cart store scoped to a specific vendor store. Use this in all [storeId] routes. */
export function createCartStore(storeId: string) {
  return makeCartStore(() => `cart_${storeId}`)
}

/** Backward-compatible default — only used by generic (non-storeId) pages. */
export const cartStore = makeCartStore(() => "yom_essentials_cart")
