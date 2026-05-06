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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample products for preview
const sampleProducts = [
  {
    id: "1",
    title: "Premium Wireless Headphones",
    description: "High-quality audio with noise cancellation",
    price: 45000,
    images: ["/wireless-headphones-premium-white.jpg"],
    product_type: "physical",
    stock_quantity: 25,
    category: "Electronics",
  },
  {
    id: "2",
    title: "UI/UX Design Course",
    description: "Complete guide to modern interface design",
    price: 15000,
    images: ["/digital-course-design-modern.jpg"],
    product_type: "digital",
    license_type: "standard",
    category: "Courses",
  },
  {
    id: "3",
    title: "Business Strategy Session",
    description: "1-hour consultation with expert advisor",
    price: 25000,
    images: ["/business-consultation-meeting-professional.jpg"],
    product_type: "appointment",
    duration_minutes: 60,
    category: "Services",
  },
  {
    id: "4",
    title: "Tech Summit 2025",
    description: "Annual technology conference",
    price: 35000,
    images: ["/tech-conference-event-modern.jpg"],
    product_type: "event",
    event_date: "2025-03-15",
    event_location: "Lagos Convention Center",
    category: "Events",
  },
  {
    id: "5",
    title: "Minimalist Watch",
    description: "Elegant timepiece for everyday wear",
    price: 85000,
    images: ["/minimalist-watch-elegant-white.jpg"],
    product_type: "physical",
    stock_quantity: 10,
    category: "Accessories",
  },
  {
    id: "6",
    title: "Photography Presets Pack",
    description: "50+ professional Lightroom presets",
    price: 8000,
    images: ["/photography-presets-digital-product.jpg"],
    product_type: "digital",
    license_type: "extended",
    category: "Digital Assets",
  },
]

const sampleStore = {
  store_name: "Crystal Store",
  logo_url: "/crystal-logo-minimal.jpg",
  email: "hello@crystalstore.com",
  phone: "+234 800 123 4567",
  address: "Victoria Island, Lagos",
}

export default function CrystalClearTemplate() {
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
        return "Appointment"
      case "event":
        return "Event"
      default:
        return type
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 p-0.5">
                <div className="w-full h-full rounded-xl bg-white flex items-center justify-center overflow-hidden">
                  <Image
                    src={sampleStore.logo_url || "/placeholder.svg"}
                    alt={sampleStore.store_name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              </div>
              <span className="font-semibold text-slate-800 text-lg">{sampleStore.store_name}</span>
            </div>

            {/* Search */}
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

            {/* Cart */}
            <Button variant="ghost" className="relative">
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
            Welcome to {sampleStore.store_name}
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-8">
            Discover our curated collection of premium products and services
          </p>

          {/* Contact Info Glass Card */}
          <div className="inline-flex items-center gap-6 px-6 py-3 rounded-2xl bg-white/60 backdrop-blur-lg border border-white/30 shadow-lg shadow-blue-500/5">
            <a
              href={`mailto:${sampleStore.email}`}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">{sampleStore.email}</span>
            </a>
            <div className="w-px h-4 bg-slate-200" />
            <a
              href={`tel:${sampleStore.phone}`}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">{sampleStore.phone}</span>
            </a>
            <div className="w-px h-4 bg-slate-200" />
            <span className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{sampleStore.address}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-2xl bg-white/60 backdrop-blur-lg border border-white/30">
            <div className="flex flex-wrap gap-3">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-white/70 border-slate-200/50 rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Product Type Filter */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group cursor-pointer rounded-3xl bg-white/60 backdrop-blur-lg border border-white/30 overflow-hidden shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                  <Image
                    src={product.images[0] || "/placeholder.svg"}
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

                {/* Content */}
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
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>

            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Image */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
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
                <Badge className="w-fit mb-3 bg-blue-50 text-blue-600 border-0 gap-1.5">
                  {getProductTypeIcon(selectedProduct.product_type)}
                  {getProductTypeLabel(selectedProduct.product_type)}
                </Badge>

                <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedProduct.title}</h2>
                <p className="text-slate-600 mb-4">{selectedProduct.description}</p>

                {/* Type-specific info */}
                {selectedProduct.product_type === "physical" && (
                  <p className="text-sm text-slate-500 mb-4">
                    <Package className="w-4 h-4 inline mr-1" />
                    {selectedProduct.stock_quantity} in stock
                  </p>
                )}
                {selectedProduct.product_type === "appointment" && (
                  <p className="text-sm text-slate-500 mb-4">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {selectedProduct.duration_minutes} minutes session
                  </p>
                )}
                {selectedProduct.product_type === "event" && (
                  <div className="text-sm text-slate-500 mb-4 space-y-1">
                    <p>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {selectedProduct.event_date}
                    </p>
                    <p>
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {selectedProduct.event_location}
                    </p>
                  </div>
                )}

                <div className="mt-auto">
                  <p className="text-3xl font-bold text-slate-800 mb-4">{formatPrice(selectedProduct.price)}</p>

                  {selectedProduct.product_type === "physical" && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm text-slate-600">Quantity:</span>
                      <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">1</span>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 h-12">
                    {selectedProduct.product_type === "digital"
                      ? "Buy & Download"
                      : selectedProduct.product_type === "appointment"
                        ? "Book Appointment"
                        : selectedProduct.product_type === "event"
                          ? "Purchase Ticket"
                          : "Add to Cart"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-lg border-t border-white/30 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} {sampleStore.store_name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
