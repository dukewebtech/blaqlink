"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ShoppingCart, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cartStore } from "@/lib/cart-store"
import { useRouter } from "next/navigation"
import { ProductDetailModal } from "@/components/store/product-detail-modal"
import { CrystalClearStorefront } from "@/components/store/templates/crystal-clear-storefront"
import { ObsidianGlassStorefront } from "@/components/store/templates/obsidian-glass-storefront"
import { AuroraFrostStorefront } from "@/components/store/templates/aurora-frost-storefront"

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
  store_template?: string // Added store_template field
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

      const [storeRes, productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/public/store-info?storeId=${params.storeId}`),
        fetch(`/api/public/products?storeId=${params.storeId}`),
        fetch(`/api/public/categories?storeId=${params.storeId}`),
      ])

      if (!storeRes.ok) {
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

      setStoreInfo(storeData.storeInfo)
      setProducts(productsData.products || [])
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error("Error fetching store data:", error)
      toast({
        title: "Error",
        description: "Failed to load store data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    )
  }

  if (!storeInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground">The store you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  switch (storeInfo.store_template) {
    case "crystal-clear":
      return (
        <CrystalClearStorefront
          storeInfo={storeInfo}
          products={products}
          categories={categories}
          storeId={params.storeId}
        />
      )
    case "obsidian-glass":
      return (
        <ObsidianGlassStorefront
          storeInfo={storeInfo}
          products={products}
          categories={categories}
          storeId={params.storeId}
        />
      )
    case "aurora-frost":
      return (
        <AuroraFrostStorefront
          storeInfo={storeInfo}
          products={products}
          categories={categories}
          storeId={params.storeId}
        />
      )
    default:
      // Default template (original storefront)
      return (
        <DefaultStorefront
          storeInfo={storeInfo}
          products={products}
          categories={categories}
          storeId={params.storeId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          cartCount={cartCount}
          setCartCount={setCartCount}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      )
  }
}

function DefaultStorefront({
  storeInfo,
  products,
  categories,
  storeId,
  searchQuery,
  setSearchQuery,
  cartCount,
  setCartCount,
  selectedFilter,
  setSelectedFilter,
  selectedProduct,
  setSelectedProduct,
  isModalOpen,
  setIsModalOpen,
  selectedCategory,
  setSelectedCategory,
}: {
  storeInfo: StoreInfo
  products: Product[]
  categories: Category[]
  storeId: string
  searchQuery: string
  setSearchQuery: (q: string) => void
  cartCount: number
  setCartCount: (c: number) => void
  selectedFilter: string
  setSelectedFilter: (f: string) => void
  selectedProduct: Product | null
  setSelectedProduct: (p: Product | null) => void
  isModalOpen: boolean
  setIsModalOpen: (o: boolean) => void
  selectedCategory: string | null
  setSelectedCategory: (c: string | null) => void
}) {
  const router = useRouter()

  useEffect(() => {
    setCartCount(cartStore.getItems().length)
    const unsubscribe = cartStore.subscribe(() => {
      setCartCount(cartStore.getItems().length)
    })
    return unsubscribe
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === "all" || product.product_type === selectedFilter
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    return matchesSearch && matchesFilter && matchesCategory && product.status === "active"
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price)
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCartUpdate = () => {
    setCartCount(cartStore.getItems().length)
  }

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {storeInfo?.profile_image ? (
                <img
                  src={storeInfo.profile_image || "/placeholder.svg"}
                  alt={storeInfo.business_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{storeInfo?.business_name?.charAt(0) || "S"}</span>
                </div>
              )}
              <div>
                <h1 className="font-semibold text-lg">{storeInfo?.business_name || "Store"}</h1>
                <p className="text-xs text-muted-foreground">{storeInfo?.location || "Online Store"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="relative bg-transparent"
                onClick={() => router.push(`/store/${storeId}/cart`)}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories */}
        {categories.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories
                .filter((cat) => cat.status === "active")
                .map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.name)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all ${
                      selectedCategory === category.name
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("all")}
            >
              All
            </Button>
            <Button
              variant={selectedFilter === "physical" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("physical")}
            >
              Physical
            </Button>
            <Button
              variant={selectedFilter === "digital" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("digital")}
            >
              Digital
            </Button>
            <Button
              variant={selectedFilter === "appointment" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("appointment")}
            >
              Appointments
            </Button>
            <Button
              variant={selectedFilter === "event" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("event")}
            >
              Events
            </Button>
          </div>
        </section>

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{selectedCategory ? selectedCategory : "All Products"}</h2>
            <span className="text-sm text-muted-foreground">
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    <img
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 left-2 text-xs">{product.product_type}</Badge>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleProductClick(product)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                    <h3 className="font-medium text-sm line-clamp-1 mb-1">{product.title}</h3>
                    <p className="font-bold text-primary">{formatPrice(product.price)}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct as any}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedProduct(null)
          }}
          storeId={storeId}
          onCartUpdate={handleCartUpdate}
        />
      )}
    </div>
  )
}
