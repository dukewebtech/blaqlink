"use client"

import type React from "react"

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
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample products for preview
const sampleProducts = [
  {
    id: "1",
    title: "Organic Skincare Set",
    description: "Natural ingredients for radiant skin",
    price: 38000,
    images: ["/placeholder.svg?key=o7qlv"],
    product_type: "physical",
    stock_quantity: 30,
    category: "Beauty",
  },
  {
    id: "2",
    title: "Meditation Audio Collection",
    description: "30 guided meditation sessions",
    price: 9500,
    images: ["/placeholder.svg?key=md1aq"],
    product_type: "digital",
    license_type: "standard",
    category: "Wellness",
  },
  {
    id: "3",
    title: "Yoga Private Session",
    description: "Personalized yoga instruction",
    price: 18000,
    images: ["/placeholder.svg?key=y9kbh"],
    product_type: "appointment",
    duration_minutes: 75,
    category: "Fitness",
  },
  {
    id: "4",
    title: "Wellness Retreat Weekend",
    description: "2-day mindfulness experience",
    price: 95000,
    images: ["/placeholder.svg?key=wr42p"],
    product_type: "event",
    event_date: "2025-05-10",
    event_location: "Lakowe Lakes Resort",
    category: "Retreats",
  },
  {
    id: "5",
    title: "Aromatherapy Diffuser",
    description: "Ultrasonic mist with LED lights",
    price: 25000,
    images: ["/placeholder.svg?key=ad8nm"],
    product_type: "physical",
    stock_quantity: 18,
    category: "Home",
  },
  {
    id: "6",
    title: "Plant-Based Recipe eBook",
    description: "100+ wholesome vegan recipes",
    price: 5500,
    images: ["/placeholder.svg?key=pb3rc"],
    product_type: "digital",
    license_type: "standard",
    category: "Nutrition",
  },
]

const sampleStore = {
  store_name: "Aurora Wellness",
  logo_url: "/placeholder.svg?key=aw7lg",
  email: "hello@aurorawellness.ng",
  phone: "+234 812 345 6789",
  address: "Ikoyi, Lagos",
}

export default function AuroraFrostTemplate() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [cartCount, setCartCount] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<(typeof sampleProducts)[0] | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

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
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400 via-amber-300 to-teal-400 p-0.5 shadow-lg shadow-rose-200/50">
                <div className="w-full h-full rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center overflow-hidden">
                  <Image
                    src={sampleStore.logo_url || "/placeholder.svg"}
                    alt={sampleStore.store_name}
                    width={36}
                    height={36}
                    className="object-cover"
                  />
                </div>
              </div>
              <div>
                <span className="font-semibold text-stone-800 text-lg block leading-tight">
                  {sampleStore.store_name}
                </span>
                <span className="text-xs text-stone-500">Nurture your soul</span>
              </div>
            </div>

            {/* Search */}
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

            {/* Cart */}
            <Button variant="ghost" className="relative rounded-2xl h-11 w-11 p-0 hover:bg-white/50">
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
            Welcome to <span className="italic text-rose-600">{sampleStore.store_name}</span>
          </h1>
          <p className="text-stone-600 text-lg max-w-xl mx-auto mb-10">
            Discover mindful products and experiences designed to nourish your body, mind, and spirit
          </p>

          {/* Contact Info Glass Card */}
          <div className="inline-flex flex-wrap items-center justify-center gap-4 px-6 py-4 rounded-3xl bg-white/50 backdrop-blur-xl border border-white/60 shadow-xl shadow-rose-100/50">
            <a
              href={`mailto:${sampleStore.email}`}
              className="flex items-center gap-2 text-stone-600 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-white/50"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">{sampleStore.email}</span>
            </a>
            <a
              href={`tel:${sampleStore.phone}`}
              className="flex items-center gap-2 text-stone-600 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-white/50"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">{sampleStore.phone}</span>
            </a>
            <span className="flex items-center gap-2 text-stone-600 px-3 py-1.5">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{sampleStore.address}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 mb-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center justify-between p-5 rounded-3xl bg-white/50 backdrop-blur-xl border border-white/60 shadow-lg shadow-stone-100/50">
            <div className="flex flex-wrap gap-3">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-white/60 border-white/50 rounded-2xl text-stone-700 h-10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="rounded-xl">
                      {cat === "all" ? "All Categories" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Product Type Filter */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group cursor-pointer rounded-3xl bg-white/50 backdrop-blur-xl border border-white/60 overflow-hidden shadow-lg shadow-stone-100/50 hover:shadow-xl hover:shadow-rose-100/50 transition-all duration-500 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => toggleFavorite(product.id, e)}
                    className="absolute top-3 right-3 p-2.5 rounded-2xl bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-colors shadow-md"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${favorites.includes(product.id) ? "fill-rose-500 text-rose-500" : "text-stone-400"}`}
                    />
                  </button>

                  {/* Type Badge */}
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-white/70 backdrop-blur-sm text-stone-700 border-0 gap-1.5 rounded-xl shadow-sm">
                      {getProductTypeIcon(product.product_type)}
                      {getProductTypeLabel(product.product_type)}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <p className="text-xs text-rose-500 font-medium mb-1 tracking-wide uppercase">{product.category}</p>
                  <h3 className="font-medium text-stone-800 mb-2 line-clamp-1 text-lg">{product.title}</h3>
                  <p className="text-sm text-stone-500 mb-4 line-clamp-2 leading-relaxed">{product.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-semibold text-stone-800">{formatPrice(product.price)}</span>
                    <Button
                      size="sm"
                      className="rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500 hover:from-rose-600 hover:via-amber-600 hover:to-teal-600 text-white border-0 shadow-md shadow-rose-200/50 px-5"
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
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/10 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-2xl bg-white/70 hover:bg-white transition-colors shadow-md"
            >
              <X className="w-5 h-5 text-stone-600" />
            </button>

            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Image */}
              <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
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
                <Badge className="w-fit mb-3 bg-rose-50 text-rose-600 border-0 gap-1.5 rounded-xl">
                  {getProductTypeIcon(selectedProduct.product_type)}
                  {getProductTypeLabel(selectedProduct.product_type)}
                </Badge>

                <h2 className="text-2xl font-serif font-medium text-stone-800 mb-2">{selectedProduct.title}</h2>
                <p className="text-stone-600 mb-4 leading-relaxed">{selectedProduct.description}</p>

                {/* Type-specific info */}
                {selectedProduct.product_type === "physical" && (
                  <p className="text-sm text-stone-500 mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-500" />
                    {selectedProduct.stock_quantity} in stock
                  </p>
                )}
                {selectedProduct.product_type === "appointment" && (
                  <p className="text-sm text-stone-500 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    {selectedProduct.duration_minutes} minutes
                  </p>
                )}
                {selectedProduct.product_type === "event" && (
                  <div className="text-sm text-stone-500 mb-4 space-y-2">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-rose-500" />
                      {selectedProduct.event_date}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      {selectedProduct.event_location}
                    </p>
                  </div>
                )}

                <div className="mt-auto">
                  <p className="text-3xl font-semibold text-stone-800 mb-4">{formatPrice(selectedProduct.price)}</p>

                  {selectedProduct.product_type === "physical" && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm text-stone-600">Quantity:</span>
                      <div className="flex items-center gap-2 bg-stone-100/80 rounded-2xl p-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl hover:bg-white">
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">1</span>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl hover:bg-white">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500 hover:from-rose-600 hover:via-amber-600 hover:to-teal-600 text-white border-0 h-12 shadow-lg shadow-rose-200/50">
                    {selectedProduct.product_type === "digital"
                      ? "Purchase & Download"
                      : selectedProduct.product_type === "appointment"
                        ? "Book Session"
                        : selectedProduct.product_type === "event"
                          ? "Reserve Spot"
                          : "Add to Cart"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative bg-white/40 backdrop-blur-xl border-t border-white/50 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-stone-500 text-sm">
            © {new Date().getFullYear()} {sampleStore.store_name}. Made with mindfulness.
          </p>
        </div>
      </footer>
    </div>
  )
}
