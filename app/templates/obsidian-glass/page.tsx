"use client"

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
  X,
  Plus,
  Minus,
  Clock,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample products for preview
const sampleProducts = [
  {
    id: "1",
    title: "Gaming Mechanical Keyboard",
    description: "RGB backlit with cherry MX switches",
    price: 65000,
    images: ["/gaming-keyboard-rgb-dark.jpg"],
    product_type: "physical",
    stock_quantity: 15,
    category: "Gaming",
  },
  {
    id: "2",
    title: "Motion Graphics Bundle",
    description: "500+ premium animation templates",
    price: 28000,
    images: ["/motion-graphics-neon-digital.jpg"],
    product_type: "digital",
    license_type: "extended",
    category: "Digital Assets",
  },
  {
    id: "3",
    title: "Career Coaching Session",
    description: "Personal career development consultation",
    price: 35000,
    images: ["/career-coaching-dark-professional.jpg"],
    product_type: "appointment",
    duration_minutes: 90,
    category: "Coaching",
  },
  {
    id: "4",
    title: "Night Music Festival",
    description: "Electronic music experience",
    price: 20000,
    images: ["/music-festival-night-neon.jpg"],
    product_type: "event",
    event_date: "2025-04-20",
    event_location: "Eko Atlantic City",
    category: "Entertainment",
  },
  {
    id: "5",
    title: "Smart Fitness Watch",
    description: "Advanced health tracking technology",
    price: 120000,
    images: ["/smart-watch-fitness-dark.jpg"],
    product_type: "physical",
    stock_quantity: 8,
    category: "Wearables",
  },
  {
    id: "6",
    title: "Dark UI Kit Pro",
    description: "Complete dark mode design system",
    price: 12000,
    images: ["/dark-ui-kit-design-system.jpg"],
    product_type: "digital",
    license_type: "standard",
    category: "Design",
  },
]

const sampleStore = {
  store_name: "Obsidian Store",
  logo_url: "/obsidian-logo-dark-minimal.jpg",
  email: "contact@obsidianstore.com",
  phone: "+234 700 999 8888",
  address: "Lekki Phase 1, Lagos",
}

export default function ObsidianGlassTemplate() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [cartCount, setCartCount] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<(typeof sampleProducts)[0] | null>(null)

  const categories = ["all", ...new Set(sampleProducts.map((p) => p.category))]

  const filteredProducts = sampleProducts.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesType = selectedType === "all" || product.product_type === selectedType
    return matchesSearch && matchesCategory && matchesType
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-0.5">
                <div className="w-full h-full rounded-xl bg-zinc-900 flex items-center justify-center overflow-hidden">
                  <Image
                    src={sampleStore.logo_url || "/placeholder.svg"}
                    alt={sampleStore.store_name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              </div>
              <span className="font-bold text-xl tracking-tight">{sampleStore.store_name}</span>
            </div>

            {/* Search */}
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

            {/* Cart */}
            <Button variant="ghost" className="relative text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
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
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto text-center relative">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              {sampleStore.store_name}
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
            Premium products crafted for the modern lifestyle
          </p>

          {/* Contact Info Glass Card */}
          <div className="inline-flex flex-wrap items-center justify-center gap-6 px-8 py-4 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 shadow-2xl shadow-violet-500/5">
            <a
              href={`mailto:${sampleStore.email}`}
              className="flex items-center gap-2 text-zinc-400 hover:text-violet-400 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">{sampleStore.email}</span>
            </a>
            <div className="w-px h-4 bg-zinc-700" />
            <a
              href={`tel:${sampleStore.phone}`}
              className="flex items-center gap-2 text-zinc-400 hover:text-violet-400 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">{sampleStore.phone}</span>
            </a>
            <div className="w-px h-4 bg-zinc-700" />
            <span className="flex items-center gap-2 text-zinc-400">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{sampleStore.address}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50">
            <div className="flex flex-wrap gap-3">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-zinc-800/50 border-zinc-700 rounded-xl text-zinc-100">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">
                      {cat === "all" ? "All Categories" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Product Type Filter */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group cursor-pointer rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 overflow-hidden hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-zinc-800">
                  <Image
                    src={product.images[0] || "/placeholder.svg"}
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
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg shadow-violet-500/25"
                    >
                      Quick View
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-violet-400 font-medium">{product.category}</span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <h3 className="font-semibold text-zinc-100 mb-1 line-clamp-1">{product.title}</h3>
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
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl shadow-violet-500/10">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>

            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Image */}
              <div className="aspect-square rounded-xl overflow-hidden bg-zinc-800">
                <Image
                  src={selectedProduct.images[0] || "/placeholder.svg"}
                  alt={selectedProduct.title}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex flex-col">
                <Badge className="w-fit mb-3 bg-violet-500/10 text-violet-400 border border-violet-500/30 gap-1.5">
                  {getProductTypeIcon(selectedProduct.product_type)}
                  {getProductTypeLabel(selectedProduct.product_type)}
                </Badge>

                <h2 className="text-2xl font-bold text-zinc-100 mb-2">{selectedProduct.title}</h2>
                <p className="text-zinc-400 mb-4">{selectedProduct.description}</p>

                {/* Type-specific info */}
                {selectedProduct.product_type === "physical" && (
                  <p className="text-sm text-zinc-500 mb-4">
                    <Package className="w-4 h-4 inline mr-1 text-violet-400" />
                    {selectedProduct.stock_quantity} units available
                  </p>
                )}
                {selectedProduct.product_type === "appointment" && (
                  <p className="text-sm text-zinc-500 mb-4">
                    <Clock className="w-4 h-4 inline mr-1 text-violet-400" />
                    {selectedProduct.duration_minutes} minutes session
                  </p>
                )}
                {selectedProduct.product_type === "event" && (
                  <div className="text-sm text-zinc-500 mb-4 space-y-1">
                    <p>
                      <Calendar className="w-4 h-4 inline mr-1 text-violet-400" />
                      {selectedProduct.event_date}
                    </p>
                    <p>
                      <MapPin className="w-4 h-4 inline mr-1 text-violet-400" />
                      {selectedProduct.event_location}
                    </p>
                  </div>
                )}

                <div className="mt-auto">
                  <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-4">
                    {formatPrice(selectedProduct.price)}
                  </p>

                  {selectedProduct.product_type === "physical" && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm text-zinc-400">Quantity:</span>
                      <div className="flex items-center gap-2 bg-zinc-800 rounded-xl p-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium text-zinc-100">1</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 h-12 shadow-lg shadow-violet-500/25">
                    {selectedProduct.product_type === "digital"
                      ? "Purchase & Download"
                      : selectedProduct.product_type === "appointment"
                        ? "Book Now"
                        : selectedProduct.product_type === "event"
                          ? "Get Ticket"
                          : "Add to Cart"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-zinc-900/60 backdrop-blur-xl border-t border-zinc-800/50 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} {sampleStore.store_name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
