"use client"

import { useState } from "react"
import Image from "next/image"
import { Mail, Phone, MapPin, ShoppingCart, Search, Calendar, Download, Ticket, Package } from "lucide-react"
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
  phone?: string
  email?: string
}

interface CrystalClearStorefrontProps {
  storeInfo: StoreInfo
  products: Product[]
  categories: Category[]
  storeId: string
}

export function CrystalClearStorefront({ storeInfo, products, categories, storeId }: CrystalClearStorefrontProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [cartCount, setCartCount] = useState(cartStore.getItemCount())
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const categoryNames = ["all", ...new Set(categories.map((c) => c.name))]

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesType = selectedType === "all" || product.product_type === selectedType
    return matchesSearch && matchesCategory && matchesType && product.status === "active"
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(price)
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
        return "Physical"
      case "digital":
        return "Digital"
      case "appointment":
        return "Appointment"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 p-0.5">
                <div className="w-full h-full rounded-xl bg-white flex items-center justify-center overflow-hidden">
                  {storeInfo.profile_image ? (
                    <Image
                      src={storeInfo.profile_image || "/placeholder.svg"}
                      alt={storeInfo.business_name}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-blue-600">{storeInfo.business_name?.charAt(0)}</span>
                  )}
                </div>
              </div>
              <span className="font-semibold text-slate-800 text-lg">{storeInfo.business_name}</span>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/50 border-slate-200/50 focus:bg-white focus:border-blue-300 rounded-full"
                />
              </div>
            </div>

            <Button variant="ghost" className="relative" onClick={handleCartClick}>
              <ShoppingCart className="w-5 h-5 text-slate-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5" />
        <div className="max-w-7xl mx-auto text-center relative">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tight">
            Welcome to {storeInfo.business_name}
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-8">
            Discover our curated collection of premium products and services
          </p>

          <div className="inline-flex flex-wrap items-center justify-center gap-6 px-6 py-3 rounded-2xl bg-white/60 backdrop-blur-lg border border-white/30 shadow-lg shadow-blue-500/5">
            {storeInfo.email && (
              <a
                href={`mailto:${storeInfo.email}`}
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">{storeInfo.email}</span>
              </a>
            )}
            {storeInfo.phone && (
              <>
                <div className="w-px h-4 bg-slate-200" />
                <a
                  href={`tel:${storeInfo.phone}`}
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{storeInfo.phone}</span>
                </a>
              </>
            )}
            {storeInfo.location && (
              <>
                <div className="w-px h-4 bg-slate-200" />
                <span className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{storeInfo.location}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-2xl bg-white/60 backdrop-blur-lg border border-white/30">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-white/70 border-slate-200/50 rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryNames.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40 bg-white/70 border-slate-200/50 rounded-xl">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-slate-500">
              Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="group cursor-pointer rounded-3xl bg-white/60 backdrop-blur-lg border border-white/30 overflow-hidden shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                    <Image
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/80 backdrop-blur-sm text-slate-700 border-0 gap-1.5">
                        {getProductTypeIcon(product.product_type)}
                        {getProductTypeLabel(product.product_type)}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-blue-600 font-medium mb-1">{product.category}</p>
                    <h3 className="font-semibold text-slate-800 mb-2 line-clamp-1">{product.title}</h3>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-800">{formatPrice(product.price)}</span>
                      <Button
                        size="sm"
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                      >
                        {product.product_type === "digital"
                          ? "Buy Now"
                          : product.product_type === "appointment"
                            ? "Book"
                            : product.product_type === "event"
                              ? "Get Ticket"
                              : "Add to Cart"}
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
      <footer className="bg-white/60 backdrop-blur-lg border-t border-white/30 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} {storeInfo.business_name}. All rights reserved.
          </p>
        </div>
      </footer>

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
          onCartUpdate={() => setCartCount(cartStore.getItemCount())}
        />
      )}
    </div>
  )
}
