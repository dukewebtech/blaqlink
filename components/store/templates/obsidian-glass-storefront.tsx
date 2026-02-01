"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Mail, Phone, MapPin, ShoppingCart, Search, Calendar, Download, Ticket, Package, Star, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cartStore } from "@/lib/cart-store"
import { useRouter } from "next/navigation"
import { ProductDetailModal } from "@/components/store/product-detail-modal"
import { useToast } from "@/components/ui/use-toast"

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

interface ObsidianGlassStorefrontProps {
  storeInfo: StoreInfo
  products: Product[]
  categories: Category[]
  storeId: string
}

export function ObsidianGlassStorefront({ storeInfo, products, categories, storeId }: ObsidianGlassStorefrontProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [cartCount, setCartCount] = useState(cartStore.getItemCount())
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
        return "Booking"
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-0.5">
                <div className="w-full h-full rounded-xl bg-zinc-900 flex items-center justify-center overflow-hidden">
                  {storeInfo.store_logo_url || storeInfo.profile_image ? (
                    <Image
                      src={storeInfo.store_logo_url || storeInfo.profile_image || "/placeholder.svg"}
                      alt={storeInfo.business_name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-sm font-bold text-violet-400">{storeInfo.business_name?.charAt(0)}</span>
                  )}
                </div>
              </div>
              <span className="font-bold text-xl tracking-tight">{storeInfo.business_name}</span>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl text-zinc-100 placeholder:text-zinc-500"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              className="relative text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              onClick={handleCartClick}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto text-center relative">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              {storeInfo.business_name}
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
            Premium products crafted for the modern lifestyle
          </p>

          <div className="inline-flex flex-wrap items-center justify-center gap-6 px-8 py-4 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 shadow-2xl shadow-violet-500/5">
            {storeInfo.email && (
              <a
                href={`mailto:${storeInfo.email}`}
                className="flex items-center gap-2 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">{storeInfo.email}</span>
              </a>
            )}
            {storeInfo.phone && (
              <>
                <div className="w-px h-4 bg-zinc-700" />
                <a
                  href={`tel:${storeInfo.phone}`}
                  className="flex items-center gap-2 text-zinc-400 hover:text-violet-400 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{storeInfo.phone}</span>
                </a>
              </>
            )}
            {storeInfo.location && (
              <>
                <div className="w-px h-4 bg-zinc-700" />
                <span className="flex items-center gap-2 text-zinc-400">
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
          <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-zinc-800/50 border-zinc-700 rounded-xl text-zinc-100">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {categoryOptions.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100"
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40 bg-zinc-800/50 border-zinc-700 rounded-xl text-zinc-100">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all" className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">
                    All Types
                  </SelectItem>
                  <SelectItem value="physical" className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">
                    Physical
                  </SelectItem>
                  <SelectItem value="digital" className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">
                    Digital
                  </SelectItem>
                  <SelectItem value="appointment" className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">
                    Appointment
                  </SelectItem>
                  <SelectItem value="event" className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">
                    Event
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-zinc-500">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 overflow-hidden hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10"
                >
                  <div
                    className="relative aspect-square overflow-hidden bg-zinc-800 cursor-pointer"
                    onClick={() => handleProductPageClick(product)}
                  >
                    <Image
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-zinc-900/80 backdrop-blur-sm text-violet-400 border border-violet-500/30 gap-1.5">
                        {getProductTypeIcon(product.product_type)}
                        {getProductTypeLabel(product.product_type)}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleQuickView(product, e)}
                        className="p-2.5 rounded-xl bg-zinc-900/80 backdrop-blur-sm hover:bg-zinc-800 border border-violet-500/30 transition-all"
                        title="Quick View"
                      >
                        <Eye className="h-4 w-4 text-violet-400" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-violet-400 font-medium">
                        {categoryMap.get(product.category) || product.category}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <h3
                      className="font-semibold text-zinc-100 mb-1 line-clamp-1 cursor-pointer hover:text-violet-400 transition-colors"
                      onClick={() => handleProductPageClick(product)}
                    >
                      {product.title}
                    </h3>
                    <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900/60 backdrop-blur-xl border-t border-zinc-800/50 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} {storeInfo.business_name}. All rights reserved.
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
