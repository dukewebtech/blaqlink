"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ShoppingCart, Heart, User, Star, SlidersHorizontal, ArrowLeft, Eye, AlertCircle } from "lucide-react"
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
}

interface Category {
  id: string
  name: string
  image: string | null
}

interface StoreInfo {
  business_name: string
}

export default function MarketplaceProTemplate() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)
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
      description: "",
    })
    setModalOpen(true)
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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link
                href="/templates"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {storeInfo?.business_name || "shop"}
              </h1>
            </div>
            <div className="flex-1 max-w-xl mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search for products..." className="pl-10 bg-muted/50" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/store/cart")}>
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartCount}
                </Badge>
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            <Button variant="outline" size="sm" className="gap-2 shrink-0 bg-transparent">
              <SlidersHorizontal className="h-4 w-4" />
              All Filters
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
              Category
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
              Price
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 ml-auto bg-transparent">
              Sort by
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Related Categories */}
        {categories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Shop by Category</h2>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category, index) => (
                <Card
                  key={category.id}
                  className="group p-4 hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                    <img
                      src={category.image || "/placeholder.svg?height=100&width=100"}
                      alt={category.name}
                      className="w-full h-full object-cover p-4 group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-center">{category.name}</h3>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">All Products</h2>
            <span className="text-sm text-muted-foreground">Showing {products.length} results</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <Card
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom cursor-pointer"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleProductClick(product)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <img
                    src={product.images?.[0] || "/placeholder.svg?height=400&width=400"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{product.product_type}</p>
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">(0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">NGN {product.price.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

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
