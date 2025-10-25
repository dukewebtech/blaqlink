"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ShoppingCart, Heart, User, Star, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cartStore } from "@/lib/cart-store"
import { ProductDetailModal } from "@/components/store/product-detail-modal"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  product_type: string
  category_id: string
  description?: string
}

interface Category {
  id: string
  name: string
  image: string | null
}

interface StoreInfo {
  business_name: string
  full_name: string
}

export default function BeautyEssentialsTemplate() {
  const [activeTab, setActiveTab] = useState("bestsellers")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes, storeRes] = await Promise.all([
          fetch("/api/public/products"),
          fetch("/api/public/categories"),
          fetch("/api/public/store-info"),
        ])

        const productsData = await productsRes.json()
        const categoriesData = await categoriesRes.json()
        const storeData = await storeRes.json()

        setProducts(productsData.products || [])
        setCategories(categoriesData.categories || [])
        setStoreInfo(storeData)
        setLoading(false)
      } catch (err) {
        console.error("[v0] Error fetching template data:", err)
        setError("Failed to load store data")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(cartStore.getItemCount())
    }
    updateCartCount()
    const interval = setInterval(updateCartCount, 500)
    return () => clearInterval(interval)
  }, [])

  const handleProductClick = (product: Product) => {
    setSelectedProduct({
      id: product.id,
      title: product.name,
      price: product.price,
      images: product.images,
      product_type: product.product_type,
      category: product.category_id,
      description: product.description || "",
    })
    setModalOpen(true)
  }

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("[v0] Adding to cart:", product.name)
    cartStore.addItem({
      id: product.id,
      title: product.name,
      price: product.price,
      product_type: product.product_type,
      images: product.images,
    })
  }

  if (!loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">No Products Available</h2>
          <p className="text-muted-foreground">
            You need to add products to your store before this template can display properly.
          </p>
          <Link href="/products/create">
            <Button className="mt-4">Add Your First Product</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner */}
      <div className="bg-emerald-600 text-white text-center py-2 text-sm font-medium">
        BOXING DAY SALE UP TO 50% OFF
      </div>

      {/* Navigation */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/templates"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Templates</span>
            </Link>
            <div className="text-xl font-bold">{storeInfo?.business_name || "Your Store"}</div>
            <div className="flex items-center gap-6">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-10 w-64 bg-muted/50" />
              </div>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/store/cart")}>
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartCount}
                </Badge>
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
                Welcome to {storeInfo?.business_name || "Our Store"}
              </h1>
              <p className="text-lg text-muted-foreground text-pretty">
                Discover our curated collection of premium products
              </p>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                SHOP NOW
              </Button>
            </div>
            <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-200">
              <img
                src={products[0]?.images?.[0] || "/placeholder.svg?height=600&width=600"}
                alt="Hero products"
                className="w-full h-auto rounded-lg"
              />
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
                >
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={category.image || "/placeholder.svg?height=100&width=100"}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium text-center">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products We Love */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Products we love</h2>
          <div className="flex justify-center gap-4 mb-12">
            <Button
              variant={activeTab === "bestsellers" ? "default" : "ghost"}
              onClick={() => setActiveTab("bestsellers")}
              className="transition-all duration-300"
            >
              ALL PRODUCTS
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product, index) => (
              <Card
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.images?.[0] || "/placeholder.svg?height=400&width=400"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
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
                    <span className="font-bold">NGN {product.price.toLocaleString()}</span>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      Add to Bag
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links Footer */}
      <section className="py-12 border-t">
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-bold mb-6">Quick Links</h3>
          <div className="flex flex-wrap gap-3">
            {["Find a Store", "Order Status", "Shopping Help", "Returns", "Your Saves"].map((link) => (
              <Button key={link} variant="outline" className="rounded-full bg-transparent">
                {link}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
        storeName={storeInfo?.business_name}
      />
    </div>
  )
}
