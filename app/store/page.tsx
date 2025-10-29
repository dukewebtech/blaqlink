"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ShoppingCart, Heart, User, Star } from "lucide-react"
import Link from "next/link"
import { ProductDetailModal } from "@/components/store/product-detail-modal"
import { useToast } from "@/hooks/use-toast"
import { cartStore } from "@/lib/cart-store"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  title: string
  price: number
  images: string[]
  product_type: string
  category: string
  description: string
  stock_quantity?: number
}

interface Category {
  id: string
  name: string
  product_type: string
  image_url?: string
}

interface StoreInfo {
  business_name: string
  full_name: string
  location: string
  profile_image?: string
  phone?: string
  email?: string
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [cartCount, setCartCount] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchStoreData()
  }, [])

  const fetchStoreData = async () => {
    try {
      setLoading(true)

      const [storeRes, productsRes, categoriesRes] = await Promise.all([
        fetch("/api/public/store-info"),
        fetch("/api/public/products"),
        fetch("/api/public/categories"),
      ])

      const storeData = await storeRes.json()
      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()

      console.log("[v0] Store info:", storeData.storeInfo)
      console.log("[v0] Products loaded:", productsData.products?.length)
      console.log("[v0] Categories loaded:", categoriesData.categories?.length)

      setStoreInfo(storeData.storeInfo)
      setProducts(productsData.products || [])
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error("[v0] Error fetching store data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(cartStore.getItemCount())
    }

    updateCartCount()
    window.addEventListener("cartUpdated", updateCartCount)
    return () => window.removeEventListener("cartUpdated", updateCartCount)
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesTab = activeTab === "all" || product.product_type === activeTab
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const featuredProducts = filteredProducts.slice(0, 8)
  const bestsellerProducts = filteredProducts.slice(0, 4)

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleAddToCart = (product: Product, quantity: number) => {
    cartStore.addItem(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        product_type: product.product_type,
        images: product.images,
      },
      quantity,
    )
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.title} added to your cart`,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading store...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner */}
      <div className="bg-emerald-600 text-white text-center py-2 text-sm font-medium">
        WELCOME TO {storeInfo?.business_name?.toUpperCase() || "YOM ESSENTIALS"} - FREE SHIPPING ON ORDERS OVER $50
      </div>

      {/* Navigation */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/store" className="text-2xl font-bold">
              {storeInfo?.business_name || "Yom Essentials"}
            </Link>
            <div className="flex items-center gap-6">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 w-64 bg-muted/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/store/cart")}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-100 to-pink-200 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
              <Badge className="bg-emerald-600 hover:bg-emerald-700">NEW ARRIVAL</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Discover Quality Products at {storeInfo?.business_name || "Yom Essentials"}
              </h1>
              <p className="text-lg text-muted-foreground text-pretty">
                Shop our curated collection of premium products. Quality you can trust, delivered to{" "}
                {storeInfo?.location || "your door"}.
              </p>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                SHOP NOW
              </Button>
            </div>
            <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-200">
              {featuredProducts[0]?.images?.[0] ? (
                <img
                  src={featuredProducts[0].images[0] || "/placeholder.svg"}
                  alt="Featured product"
                  className="w-full h-auto rounded-lg object-cover aspect-square"
                />
              ) : (
                <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Featured Product</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 border-b">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
              {categories.slice(0, 6).map((category, index) => (
                <button
                  key={category.id}
                  className="group flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => setSearchQuery(category.name)}
                >
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted group-hover:scale-110 transition-transform duration-300">
                    {category.image_url ? (
                      <img
                        src={category.image_url || "/placeholder.svg"}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                        {category.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-center">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Product Type Tabs */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-center gap-4 flex-wrap">
            <Button
              variant={activeTab === "all" ? "default" : "ghost"}
              onClick={() => setActiveTab("all")}
              className="transition-all duration-300"
            >
              ALL PRODUCTS
            </Button>
            <Button
              variant={activeTab === "digital" ? "default" : "ghost"}
              onClick={() => setActiveTab("digital")}
              className="transition-all duration-300"
            >
              DIGITAL
            </Button>
            <Button
              variant={activeTab === "physical" ? "default" : "ghost"}
              onClick={() => setActiveTab("physical")}
              className="transition-all duration-300"
            >
              PHYSICAL
            </Button>
            <Button
              variant={activeTab === "event" ? "default" : "ghost"}
              onClick={() => setActiveTab("event")}
              className="transition-all duration-300"
            >
              EVENTS
            </Button>
            <Button
              variant={activeTab === "appointment" ? "default" : "ghost"}
              onClick={() => setActiveTab("appointment")}
              className="transition-all duration-300"
            >
              APPOINTMENTS
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Featured Products</h2>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No products found. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleProductClick(product)}
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0] || "/placeholder.svg"}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.title}</h3>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">(0)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">${Number(product.price).toFixed(2)}</span>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(product, 1)
                        }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bestsellers */}
      {bestsellerProducts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Bestsellers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {bestsellerProducts.map((product, index) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95 cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Badge className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 hover:bg-yellow-500 z-10">
                      BESTSELLER
                    </Badge>
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0] || "/placeholder.svg"}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">${Number(product.price).toFixed(2)}</span>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(product, 1)
                        }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">{storeInfo?.business_name || "Yom Essentials"}</h3>
              <p className="text-sm text-muted-foreground">
                Quality products delivered to {storeInfo?.location || "your location"}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/store">Shop</Link>
                </li>
                <li>
                  <Link href="/store">About Us</Link>
                </li>
                <li>
                  <Link href="/store">Contact</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/store">Shipping Info</Link>
                </li>
                <li>
                  <Link href="/store">Returns</Link>
                </li>
                <li>
                  <Link href="/store">FAQ</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {storeInfo?.location && <li>{storeInfo.location}</li>}
                {storeInfo?.phone && <li>{storeInfo.phone}</li>}
                {storeInfo?.email && <li>{storeInfo.email}</li>}
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            © 2025 {storeInfo?.business_name || "Yom Essentials"}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddToCart={handleAddToCart}
        storeName={storeInfo?.business_name || storeInfo?.full_name}
      />
    </div>
  )
}
