"use client"

import type React from "react"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import Image from "next/image"
import {
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Search,
  Calendar,
  Download,
  Ticket,
  Package,
  Heart,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
}

interface StoreInfo {
  id: string
  business_name: string
  full_name: string
  location: string
  profile_image?: string
  store_logo_url?: string // Added store_logo_url field
  phone?: string
  email?: string
}

interface AuroraFrostStorefrontProps {
  storeInfo: StoreInfo
  products: Product[]
  categories: Category[]
  storeId: string
}

export function AuroraFrostStorefront({ storeInfo, products, categories, storeId }: AuroraFrostStorefrontProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [cartCount, setCartCount] = useState(cartStore.getItemCount())
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const router = useRouter()
  const { toast } = useToast()

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  const categoryOptions = [
    { id: "all", name: "All Categories" },
    ...categories.map((c) => ({ id: c.id, name: c.name })),
  ]

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesType = selectedType === "all" || product.product_type === selectedType
    return matchesSearch && matchesCategory && matchesType && product.status === "published"
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(price)
  }

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case "physical":
        return <Package className="w-4 h-4" />
      case "digital":
        return <Download className="w-4 h-4" />
      case "appointment":
        return <Calendar className="w-4 h-4" />
      case "event":
        return <Ticket className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case "physical":
        return "Product"
      case "digital":
        return "Digital"
      case "appointment":
        return "Session"
      case "event":
        return "Event"
      default:
        return type
    }
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCartClick = () => {
    router.push(`/store/${storeId}/cart`)
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
    setCartCount(cartStore.getItemCount())
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.title} added to your cart`,
    })
  }

  const handleQuickView = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleProductPageClick = (product: Product) => {
    router.push(`/store/${storeId}/product/${product.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50/30 to-teal-50">
      {/* Decorative background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-teal-200/40 to-cyan-200/40 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/40 border-b border-white/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400 via-amber-300 to-teal-400 p-0.5 shadow-lg shadow-rose-200/50">
                <div className="w-full h-full rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center overflow-hidden">
                  {storeInfo.store_logo_url || storeInfo.profile_image ? (
                    <Image
                      src={storeInfo.store_logo_url || storeInfo.profile_image || "/placeholder.svg"}
                      alt={storeInfo.business_name}
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-sm font-bold text-rose-600">{storeInfo.business_name?.charAt(0)}</span>
                  )}
                </div>
              </div>
              <div>
                <span className="font-semibold text-stone-800 text-lg block leading-tight">
                  {storeInfo.business_name}
                </span>
                <span className="text-xs text-stone-500">Nurture your soul</span>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-sm mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 bg-white/60 border-white/50 focus:bg-white/80 focus:border-rose-200 rounded-2xl h-11 text-stone-700 placeholder:text-stone-400"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              className="relative rounded-2xl h-11 w-11 p-0 hover:bg-white/50"
              onClick={handleCartClick}
            >
              <ShoppingCart className="w-5 h-5 text-stone-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs rounded-full flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-lg border border-white/50 mb-6">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-400 to-amber-400 animate-pulse" />
            <span className="text-sm text-stone-600">Handcrafted with love</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-medium text-stone-800 mb-4 tracking-tight">
            Welcome to <span className="italic text-rose-600">{storeInfo.business_name}</span>
          </h1>
          <p className="text-stone-600 text-lg max-w-xl mx-auto mb-10">
            Discover mindful products and experiences designed to nourish your body, mind, and spirit
          </p>

          <div className="inline-flex flex-wrap items-center justify-center gap-4 px-6 py-4 rounded-3xl bg-white/50 backdrop-blur-xl border border-white/60 shadow-xl shadow-rose-100/50">
            {storeInfo.email && (
              <a
                href={`mailto:${storeInfo.email}`}
                className="flex items-center gap-2 text-stone-600 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-white/50"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">{storeInfo.email}</span>
              </a>
            )}
            {storeInfo.phone && (
              <a
                href={`tel:${storeInfo.phone}`}
                className="flex items-center gap-2 text-stone-600 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-white/50"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">{storeInfo.phone}</span>
              </a>
            )}
            {storeInfo.location && (
              <span className="flex items-center gap-2 text-stone-600 px-3 py-1.5">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{storeInfo.location}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 mb-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center justify-between p-5 rounded-3xl bg-white/50 backdrop-blur-xl border border-white/60 shadow-lg shadow-stone-100/50">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-white/60 border-white/50 rounded-2xl text-stone-700 h-10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="rounded-xl">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40 bg-white/60 border-white/50 rounded-2xl text-stone-700 h-10">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all" className="rounded-xl">
                    All Types
                  </SelectItem>
                  <SelectItem value="physical" className="rounded-xl">
                    Physical
                  </SelectItem>
                  <SelectItem value="digital" className="rounded-xl">
                    Digital
                  </SelectItem>
                  <SelectItem value="appointment" className="rounded-xl">
                    Appointment
                  </SelectItem>
                  <SelectItem value="event" className="rounded-xl">
                    Event
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-stone-500 italic">
              {filteredProducts.length} offering{filteredProducts.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-4 pb-20 relative">
        <div className="max-w-6xl mx-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-stone-500">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group rounded-3xl bg-white/50 backdrop-blur-xl border border-white/60 overflow-hidden shadow-lg shadow-stone-100/50 hover:shadow-xl hover:shadow-rose-100/50 transition-all duration-500 hover:-translate-y-1"
                >
                  <div
                    className="relative aspect-[4/3] overflow-hidden cursor-pointer"
                    onClick={() => handleProductPageClick(product)}
                  >
                    <Image
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />

                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        onClick={(e) => handleQuickView(product, e)}
                        className="p-2.5 rounded-2xl bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-colors shadow-md opacity-0 group-hover:opacity-100"
                        title="Quick View"
                      >
                        <Eye className="w-4 h-4 text-stone-600" />
                      </button>
                      <button
                        onClick={(e) => toggleFavorite(product.id, e)}
                        className="p-2.5 rounded-2xl bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-colors shadow-md"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${favorites.includes(product.id) ? "fill-rose-500 text-rose-500" : "text-stone-400"}`}
                        />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-white/70 backdrop-blur-sm text-stone-700 border-0 gap-1.5 rounded-xl shadow-sm">
                        {getProductTypeIcon(product.product_type)}
                        {getProductTypeLabel(product.product_type)}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-rose-500 font-medium mb-1 tracking-wide uppercase">
                      {categoryMap.get(product.category) || product.category}
                    </p>
                    <h3
                      className="font-medium text-stone-800 mb-2 line-clamp-1 text-lg cursor-pointer hover:text-rose-600 transition-colors"
                      onClick={() => handleProductPageClick(product)}
                    >
                      {product.title}
                    </h3>
                    <p className="text-sm text-stone-500 mb-4 line-clamp-2 leading-relaxed">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-semibold text-stone-800">{formatPrice(product.price)}</span>
                      <Button
                        size="sm"
                        className="rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500 hover:from-rose-600 hover:via-amber-600 hover:to-teal-600 text-white border-0 shadow-md shadow-rose-200/50 px-5"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(product, 1)
                        }}
                      >
                        {product.product_type === "digital"
                          ? "Get"
                          : product.product_type === "appointment"
                            ? "Book"
                            : product.product_type === "event"
                              ? "Join"
                              : "Add"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-white/40 backdrop-blur-xl border-t border-white/50 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-stone-500 text-sm">
            © {new Date().getFullYear()} {storeInfo.business_name}. Made with mindfulness.
          </p>
        </div>
      </footer>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open)
            if (!open) setSelectedProduct(null)
          }}
          onAddToCart={handleAddToCart}
          storeName={storeInfo?.business_name || storeInfo?.full_name}
        />
      )}
    </div>
  )
}
