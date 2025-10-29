"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ShoppingCart, Heart, User, Star, SlidersHorizontal, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cartStore } from "@/lib/cart-store"
import { useRouter } from "next/navigation"
import { ProductDetailModal } from "@/components/store/product-detail-modal"

interface Product {
  id: string
  title: string
  price: number
  images: string[]
  product_type: string
  category: string
  description: string
  stock_quantity?: number
  status: string
}

interface Category {
  id: string
  name: string
  product_type: string
  image_url?: string
  status: string
}

interface StoreInfo {
  id: string
  business_name: string
  full_name: string
  location: string
  profile_image?: string
  phone?: string
  email?: string
}

export default function PublicStorePage({ params }: { params: { storeId: string } }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartCount, setCartCount] = useState(0)
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchStoreData()
  }, [params.storeId])

  const fetchStoreData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching store data for:", params.storeId)

      const [storeRes, productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/public/store-info?storeId=${params.storeId}`),
        fetch(`/api/public/products?storeId=${params.storeId}`),
        fetch(`/api/public/categories?storeId=${params.storeId}`),
      ])

      console.log("[v0] Store response status:", storeRes.status)
      console.log("[v0] Products response status:", productsRes.status)
      console.log("[v0] Categories response status:", categoriesRes.status)

      if (!storeRes.ok) {
        console.error("[v0] Store not found")
        toast({
          title: "Store not found",
          description: "The store you're looking for doesn't exist.",
          variant: "destructive",
        })
        return
      }

      const storeData = await storeRes.json()
      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()

      console.log("[v0] Store info loaded:", storeData.storeInfo?.business_name)
      console.log("[v0] Products loaded:", productsData.products?.length || 0)
      console.log("[v0] Categories loaded:", categoriesData.categories?.length || 0)

      setStoreInfo(storeData.storeInfo)
      setProducts(productsData.products || [])
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error("[v0] Error fetching store data:", error)
      toast({
        title: "Error loading store",
        description: "Failed to load store data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === "all" || product.product_type === selectedFilter
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    return matchesSearch && matchesFilter && matchesCategory
  })

  const handleAddToCart = (product: Product) => {
    cartStore.addItem(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        product_type: product.product_type,
        images: product.images,
      },
      1,
    )
    toast({
      title: "Added to cart",
      description: `${product.title} added to your cart`,
    })
    setCartCount(cartStore.getItemCount())
  }

  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(cartStore.getItemCount())
    }
    updateCartCount()
    window.addEventListener("cartUpdated", updateCartCount)
    return () => window.removeEventListener("cartUpdated", updateCartCount)
  }, [])

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName)
    setSearchQuery("")
    setSelectedFilter("all")
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

  if (!storeInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">Store not found</p>
          <p className="text-muted-foreground">The store you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-2">
            <div className="flex items-center gap-2 md:gap-8 min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                {storeInfo.business_name || storeInfo.full_name}
              </h1>
            </div>
            <div className="flex-1 max-w-xl mx-2 md:mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for products..."
                  className="pl-10 bg-muted/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-4">
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                <Heart className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 md:h-10 md:w-10"
                onClick={() => router.push(`/store/${params.storeId}/cart`)}
              >
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                <User className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Store Info Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 text-xs md:text-sm overflow-x-auto">
            <span className="whitespace-nowrap">📍 {storeInfo.location || "Worldwide Shipping"}</span>
            <span className="hidden lg:block whitespace-nowrap">
              ✨ Welcome to {storeInfo.business_name || storeInfo.full_name}
            </span>
            <span className="whitespace-nowrap">🎉 Free Shipping on Orders Over $50</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <Button variant="outline" size="sm" className="gap-2 shrink-0 bg-transparent text-xs md:text-sm">
              <SlidersHorizontal className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">All Filters</span>
              <span className="sm:hidden">Filters</span>
            </Button>
            <Button
              variant={selectedFilter === "all" ? "default" : "outline"}
              size="sm"
              className="shrink-0 text-xs md:text-sm"
              onClick={() => setSelectedFilter("all")}
            >
              All
            </Button>
            <Button
              variant={selectedFilter === "digital" ? "default" : "outline"}
              size="sm"
              className="shrink-0 text-xs md:text-sm"
              onClick={() => setSelectedFilter("digital")}
            >
              Digital
            </Button>
            <Button
              variant={selectedFilter === "physical" ? "default" : "outline"}
              size="sm"
              className="shrink-0 text-xs md:text-sm"
              onClick={() => setSelectedFilter("physical")}
            >
              Physical
            </Button>
            <Button
              variant={selectedFilter === "event" ? "default" : "outline"}
              size="sm"
              className="shrink-0 text-xs md:text-sm"
              onClick={() => setSelectedFilter("event")}
            >
              Events
            </Button>
            <Button
              variant={selectedFilter === "appointment" ? "default" : "outline"}
              size="sm"
              className="shrink-0 text-xs md:text-sm"
              onClick={() => setSelectedFilter("appointment")}
            >
              Appointments
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Categories */}
        {categories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
              {selectedCategory && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                  Clear Filter
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
              {categories.slice(0, 6).map((category, index) => (
                <Card
                  key={category.id}
                  className={`group p-3 md:p-4 hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95 cursor-pointer ${
                    selectedCategory === category.name ? "ring-2 ring-primary" : ""
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <div className="aspect-square bg-muted rounded-lg mb-2 md:mb-3 overflow-hidden">
                    {category.image_url ? (
                      <img
                        src={category.image_url || "/placeholder.svg"}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl font-bold text-muted-foreground">
                        {category.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-xs md:text-sm text-center truncate">{category.name}</h3>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">
              {selectedCategory ? `${selectedCategory} Products` : "All Products"}
            </h2>
            <span className="text-xs md:text-sm text-muted-foreground">
              {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""}
            </span>
          </div>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {filteredProducts.map((product, index) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 h-8 w-8 md:h-10 md:w-10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Heart className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-2 right-2 h-8 w-8 md:h-10 md:w-10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={() => handleViewProduct(product)}
                    >
                      <Eye className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <div className="cursor-pointer" onClick={() => handleViewProduct(product)}>
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                    <div>
                      <h3 className="font-semibold text-xs md:text-sm line-clamp-2">{product.title}</h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1 hidden md:block">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-2 w-2 md:h-3 md:w-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">(0)</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm md:text-base">${Number(product.price).toFixed(2)}</span>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-4"
                      >
                        <span className="hidden sm:inline">Add to Cart</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm md:text-lg">
                {searchQuery || selectedCategory
                  ? `No products found${searchQuery ? ` matching "${searchQuery}"` : ""}${selectedCategory ? ` in ${selectedCategory}` : ""}`
                  : "No products available yet. Check back soon!"}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-bold text-base md:text-lg mb-4">{storeInfo.business_name || storeInfo.full_name}</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-2">
                Quality products delivered to {storeInfo.location || "your location"}
              </p>
              <p className="text-xs text-muted-foreground">Store ID: {storeInfo.id.slice(0, 13)}...</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Quick Links</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li>About Us</li>
                <li>Contact</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Customer Service</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li>Shipping Info</li>
                <li>Returns</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Contact</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                {storeInfo.location && <li>📍 {storeInfo.location}</li>}
                {storeInfo.phone && <li>📞 {storeInfo.phone}</li>}
                {storeInfo.email && <li>✉️ {storeInfo.email}</li>}
              </ul>
            </div>
          </div>
          <div className="text-center text-xs md:text-sm text-muted-foreground pt-8 border-t">
            © 2025 {storeInfo.business_name || storeInfo.full_name}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        storeName={storeInfo?.business_name || storeInfo?.full_name}
      />
    </div>
  )
}
