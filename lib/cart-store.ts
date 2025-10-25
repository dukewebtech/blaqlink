// Cart store using localStorage for persistence
export interface CartItem {
  id: string
  product_id: string
  title: string
  price: number
  quantity: number
  product_type: string
  image: string
}

export interface Cart {
  items: CartItem[]
  total: number
}

const CART_KEY = "yom_essentials_cart"

export const cartStore = {
  getCart(): Cart {
    if (typeof window === "undefined") return { items: [], total: 0 }

    const stored = localStorage.getItem(CART_KEY)
    if (!stored) return { items: [], total: 0 }

    try {
      const cart = JSON.parse(stored) as Cart
      return cart
    } catch {
      return { items: [], total: 0 }
    }
  },

  saveCart(cart: Cart): void {
    if (typeof window === "undefined") return
    localStorage.setItem(CART_KEY, JSON.stringify(cart))

    // Dispatch custom event for cart updates
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
  ): void {
    console.log("[v0] cartStore.addItem called:", { productId: product.id, title: product.title, quantity })

    const cart = this.getCart()
    console.log("[v0] Current cart before adding:", { itemCount: cart.items.length, total: cart.total })

    const existingItem = cart.items.find((item) => item.product_id === product.id)

    if (existingItem) {
      console.log("[v0] Product already in cart, updating quantity")
      existingItem.quantity += quantity
    } else {
      console.log("[v0] Adding new product to cart")
      cart.items.push({
        id: crypto.randomUUID(),
        product_id: product.id,
        title: product.title,
        price: product.price,
        quantity,
        product_type: product.product_type,
        image: product.images[0] || "/placeholder.svg?height=100&width=100",
      })
    }

    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    console.log("[v0] Cart after adding:", { itemCount: cart.items.length, total: cart.total })

    this.saveCart(cart)
    console.log("[v0] Cart saved to localStorage")
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
    const cart = this.getCart()
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  },
}
