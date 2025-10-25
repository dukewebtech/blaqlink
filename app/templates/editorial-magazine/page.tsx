"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, ShoppingBag, User, Heart, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react"
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
}

interface StoreInfo {
  business_name: string
}

export default function EditorialMagazineTemplate() {
  const [products, setProducts] = useState<Product[]>([])
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, storeRes] = await Promise.all([
          fetch("/api/public/products"),
          fetch("/api/public/store-info"),
        ])

        const productsData = await productsRes.json()
        const storeData = await storeRes.json()

        setProducts(productsData.products || [])
        setStoreInfo(storeData)
        setLoading(false)
      } catch (err) {
        console.error("[v0] Error fetching template data:", err)
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
      category: "",
      description: "",
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
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link
              href="/templates"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                New In
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Collections
              </a>
              <h1 className="text-3xl font-serif font-bold">{storeInfo?.business_name || "ATELIER"}</h1>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Journal
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </a>
            </nav>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => router.push("/store/cart")}>
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 z-10" />
        <img
          src={products[0]?.images?.[0] || "/placeholder.svg?height=1200&width=1920"}
          alt="Hero"
          className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-1000"
        />
        <div className="absolute inset-0 z-20 flex items-end">
          <div className="container mx-auto px-4 pb-16 md:pb-24">
            <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
              <Badge className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90">
                New Collection
              </Badge>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-balance">
                Timeless Elegance Redefined
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty">
                Discover our latest collection where classic sophistication meets contemporary design
              </p>
              <Button size="lg" className="gap-2 group">
                Explore Collection
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif font-bold">New Arrivals</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Carefully curated pieces that embody our commitment to quality and timeless style
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product, index) => (
              <Card
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 animate-in fade-in zoom-in-95 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  <img
                    src={product.images?.[0] || "/placeholder.svg?height=500&width=400"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="font-medium text-lg line-clamp-2">{product.name}</h3>
                  <p className="text-xl font-semibold">NGN {product.price.toLocaleString()}</p>
                  <Button
                    variant="outline"
                    className="w-full group/btn bg-transparent"
                    onClick={(e) => handleAddToCart(product, e)}
                  >
                    Add to Cart
                    <ShoppingBag className="h-4 w-4 ml-2 group-hover/btn:scale-110 transition-transform" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <ProductDetailModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
        storeName={storeInfo?.business_name}
      />
    </div>
  )
}
