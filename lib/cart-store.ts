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
  product_variant_id?: string
  variant_label?: string
  ticket_tier_id?: string
  ticket_tier_name?: string
  /** Stock/quantity-left cap for this exact line, e.g. a variant's stock. Unset = uncapped. */
  max?: number
  /** Bookings: a slot can only be in the cart once — re-adding the same slot is a conflict, not a quantity bump. */
  unique?: boolean
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

    /**
     * Merge/uniqueness rules copied exactly from the storefront templates:
     * a line is identified by product + variant + tier + appointment slot; a
     * matching non-unique line has its quantity bumped (capped at `max` when
     * one is given), a matching unique (booking) line is a conflict, and
     * anything else becomes a new line.
     */
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
        product_variant_id?: string
        variant_label?: string
        ticket_tier_id?: string
        ticket_tier_name?: string
        max?: number
        unique?: boolean
      },
    ): { ok: true } | { ok: false; reason: "slot_taken" } {
      const cart = this.getCart()
      const isUnique = metadata?.unique ?? product.product_type === "appointment"
      const matchesLine = (item: CartItem) =>
        item.product_id === product.id &&
        item.product_variant_id === metadata?.product_variant_id &&
        item.ticket_tier_id === metadata?.ticket_tier_id &&
        item.appointment_date === metadata?.appointment_date &&
        item.appointment_time === metadata?.appointment_time

      const existingItem = cart.items.find(matchesLine)

      if (existingItem && isUnique) {
        return { ok: false, reason: "slot_taken" }
      }

      if (existingItem) {
        const nextQty = existingItem.quantity + quantity
        existingItem.quantity = existingItem.max != null ? Math.min(nextQty, existingItem.max) : nextQty
      } else {
        cart.items.push({
          id: crypto.randomUUID(),
          product_id: product.id,
          title: product.title,
          price: product.price,
          quantity: metadata?.max != null ? Math.min(quantity, metadata.max) : quantity,
          product_type: product.product_type,
          image: product.images[0] || "/placeholder.svg?height=100&width=100",
          ...(metadata?.appointment_date && { appointment_date: metadata.appointment_date }),
          ...(metadata?.appointment_time && { appointment_time: metadata.appointment_time }),
          ...(metadata?.ticket_type && { ticket_type: metadata.ticket_type }),
          ...(metadata?.product_variant_id && { product_variant_id: metadata.product_variant_id }),
          ...(metadata?.variant_label && { variant_label: metadata.variant_label }),
          ...(metadata?.ticket_tier_id && { ticket_tier_id: metadata.ticket_tier_id }),
          ...(metadata?.ticket_tier_name && { ticket_tier_name: metadata.ticket_tier_name }),
          ...(metadata?.max != null && { max: metadata.max }),
          ...(isUnique && { unique: true }),
        })
      }

      cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      this.saveCart(cart)
      return { ok: true }
    },

    updateQuantity(itemId: string, quantity: number): void {
      const cart = this.getCart()
      const item = cart.items.find((i) => i.id === itemId)
      if (item) {
        if (quantity <= 0) {
          this.removeItem(itemId)
        } else {
          item.quantity = item.max != null ? Math.min(quantity, item.max) : quantity
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
