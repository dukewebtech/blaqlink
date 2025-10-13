"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Check, Store, Sparkles, Eye, Heart, ShoppingCart, Search, Star, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

const MarketplaceLayout = ({ isFullScreen = false }: { isFullScreen?: boolean }) => (
  <div
    className={cn(
      "w-full bg-white overflow-auto",
      isFullScreen ? "min-h-screen" : "h-full rounded-lg border border-border",
    )}
  >
    {/* Header */}
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold text-primary">shop</div>
          {isFullScreen && (
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <a href="#" className="hover:text-primary transition-colors">
                New Arrivals
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Men
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Women
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Sale
              </a>
            </nav>
          )}
        </div>
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Heart className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
              2
            </span>
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-t border-border overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <button className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
            Category
          </button>
          <button className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
            Color
          </button>
          <button className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
            Size
          </button>
          <button className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
            Price
          </button>
          <button className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
            Brand
          </button>
          <button className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
            Rating
          </button>
        </div>
      </div>
    </header>

    <main className="px-4 py-6 space-y-8">
      {/* Featured Brands */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Featured Brands</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {["Nike", "Adidas", "Puma", "Reebok", "New Balance", "Converse"].map((brand) => (
            <div
              key={brand}
              className="flex-shrink-0 w-24 h-24 bg-accent rounded-lg flex items-center justify-center border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <span className="text-sm font-semibold">{brand}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">All Products</h2>
          <span className="text-sm text-muted-foreground">Showing 1-12 of 156</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { name: "Classic Running Shoes", price: "$89.99", rating: 4.5, image: "running shoes product photo" },
            { name: "Premium Sneakers", price: "$129.99", rating: 4.8, image: "white sneakers product" },
            { name: "Sport Training Shoes", price: "$79.99", rating: 4.3, image: "athletic training shoes" },
            { name: "Casual Canvas Shoes", price: "$59.99", rating: 4.6, image: "canvas casual shoes" },
            { name: "High-Top Basketball", price: "$149.99", rating: 4.9, image: "basketball high-top shoes" },
            { name: "Leather Boots", price: "$199.99", rating: 4.7, image: "leather boots product" },
            { name: "Slip-On Loafers", price: "$69.99", rating: 4.4, image: "slip-on loafers" },
            { name: "Trail Running Shoes", price: "$119.99", rating: 4.6, image: "trail running shoes" },
          ].map((product, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative aspect-square bg-accent rounded-lg overflow-hidden mb-3">
                <Image
                  src={`/.jpg?key=mozt0&height=300&width=300&query=${encodeURIComponent(product.image)}`}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button className="absolute top-2 right-2 p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
              <div className="flex items-center gap-1 mb-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">{product.rating}</span>
              </div>
              <p className="font-semibold">{product.price}</p>
            </div>
          ))}
        </div>
      </section>
    </main>

    {/* Footer */}
    {isFullScreen && (
      <footer className="bg-accent border-t border-border mt-12 py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-3">Shop</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Best Sellers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Sale
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Shipping
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Press
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Follow Us</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    )}
  </div>
)

const MinimalLayout = ({ isFullScreen = false }: { isFullScreen?: boolean }) => (
  <div
    className={cn(
      "w-full bg-white overflow-auto",
      isFullScreen ? "min-h-screen" : "h-full rounded-lg border border-border",
    )}
  >
    {/* Header */}
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="text-xl font-bold">Store</div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#" className="hover:text-primary transition-colors">
            Mac
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            iPhone
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            iPad
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Watch
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Accessories
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>

    <main className="px-4 py-12 max-w-6xl mx-auto space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Store. <span className="text-muted-foreground">The best way to buy</span>
        </h1>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-muted-foreground">the products you love.</h1>
      </section>

      {/* Category Icons */}
      <section>
        <div className="grid grid-cols-2 md:flex md:justify-center gap-6 md:gap-8 overflow-x-auto pb-4">
          {[
            { name: "Laptops", icon: "laptop computer" },
            { name: "Phones", icon: "smartphone device" },
            { name: "Tablets", icon: "tablet device" },
            { name: "Watches", icon: "smartwatch" },
            { name: "Audio", icon: "headphones" },
            { name: "Accessories", icon: "tech accessories" },
          ].map((category) => (
            <div key={category.name} className="flex flex-col items-center gap-3 cursor-pointer group">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Image
                  src={`/.jpg?key=moxo8&height=64&width=64&query=${encodeURIComponent(category.icon)}`}
                  alt={category.name}
                  width={40}
                  height={40}
                  className="opacity-70"
                />
              </div>
              <span className="text-sm font-medium text-center">{category.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">
          The latest. <span className="text-muted-foreground">Take a look at what's new, now.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              name: "MacBook Pro",
              tagline: "Built for Apple Intelligence",
              price: "From $2,199",
              image: "macbook pro laptop",
            },
            {
              name: "iPhone 15 Pro",
              tagline: "Titanium. So strong. So light.",
              price: "From $999",
              image: "iphone 15 pro",
            },
            { name: "AirPods Pro", tagline: "Adaptive Audio. Now playing.", price: "$249", image: "airpods pro" },
          ].map((product, i) => (
            <div
              key={i}
              className="group cursor-pointer bg-accent rounded-2xl overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.tagline}</p>
                  <p className="text-sm font-medium">{product.price}</p>
                </div>
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center">
                  <Image
                    src={`/.jpg?key=k67j4&height=300&width=400&query=${encodeURIComponent(product.image)}`}
                    alt={product.name}
                    width={300}
                    height={200}
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>

    {/* Footer */}
    {isFullScreen && (
      <footer className="bg-accent border-t border-border mt-16 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            More ways to shop: Find a Store or other retailer near you. Or call 1-800-MY-STORE.
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms of Use
            </a>
            <a href="#" className="hover:text-foreground">
              Sales Policy
            </a>
          </div>
        </div>
      </footer>
    )}
  </div>
)

const MagazineLayout = ({ isFullScreen = false }: { isFullScreen?: boolean }) => (
  <div
    className={cn(
      "w-full bg-white overflow-auto",
      isFullScreen ? "min-h-screen" : "h-full rounded-lg border border-border",
    )}
  >
    {/* Header */}
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-wider">STORE</div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#" className="hover:text-primary transition-colors">
            Collections
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Editorial
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Lookbook
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            About
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>

    <main className="space-y-0">
      {/* Hero Banner */}
      <section className="relative h-[60vh] bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
        <Image src="/fashion-editorial-hero-banner.jpg" alt="Hero" fill className="object-cover opacity-90" />
        <div className="absolute inset-0 flex items-end p-8 md:p-16 bg-gradient-to-t from-black/60 to-transparent">
          <div className="text-white space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold">Spring Collection 2024</h1>
            <p className="text-lg md:text-xl text-white/90">Discover the latest trends in sustainable fashion</p>
            <button className="px-6 py-3 bg-white text-foreground rounded-lg font-medium hover:bg-white/90 transition-colors">
              Explore Now
            </button>
          </div>
        </div>
      </section>

      {/* Featured Story */}
      <section className="px-4 py-12 md:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Featured Story</span>
              <h2 className="text-3xl md:text-4xl font-bold">Crafted with Purpose</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Every piece in our collection tells a story of craftsmanship, sustainability, and timeless design.
              Discover how we're reimagining fashion for a better tomorrow.
            </p>
            <button className="text-primary font-medium hover:underline">Read the full story →</button>
          </div>
          <div className="aspect-[4/5] bg-accent rounded-2xl overflow-hidden">
            <Image
              src="/fashion-editorial-portrait.jpg"
              alt="Featured"
              width={480}
              height={600}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="px-4 py-12 md:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">New Arrivals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Organic Cotton Tee", price: "$45", image: "organic cotton t-shirt" },
            { name: "Linen Summer Dress", price: "$120", image: "linen summer dress" },
            { name: "Recycled Denim Jacket", price: "$180", image: "denim jacket sustainable" },
            { name: "Wool Blend Sweater", price: "$95", image: "wool sweater" },
            { name: "Canvas Tote Bag", price: "$35", image: "canvas tote bag" },
            { name: "Leather Sandals", price: "$85", image: "leather sandals" },
            { name: "Silk Scarf", price: "$65", image: "silk scarf accessory" },
            { name: "Bamboo Sunglasses", price: "$75", image: "bamboo sunglasses" },
          ].map((product, i) => (
            <div key={i} className="group cursor-pointer space-y-3">
              <div className="aspect-[3/4] bg-accent rounded-lg overflow-hidden">
                <Image
                  src={`/.jpg?key=o38kt&height=400&width=300&query=${encodeURIComponent(product.image)}`}
                  alt={product.name}
                  width={300}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div>
                <h3 className="font-medium text-sm">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Section */}
      <section className="px-4 py-12 md:px-8 bg-accent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">From Our Journal</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "The Art of Slow Fashion", date: "March 15, 2024", image: "slow fashion editorial" },
              { title: "Behind the Seams", date: "March 10, 2024", image: "fashion craftsmanship" },
              { title: "Sustainable Style Guide", date: "March 5, 2024", image: "sustainable fashion guide" },
            ].map((article, i) => (
              <div key={i} className="group cursor-pointer space-y-3">
                <div className="aspect-video bg-background rounded-lg overflow-hidden">
                  <Image
                    src={`/.jpg?key=4ogi7&height=300&width=400&query=${encodeURIComponent(article.image)}`}
                    alt={article.title}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{article.date}</p>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{article.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>

    {/* Footer */}
    {isFullScreen && (
      <footer className="bg-foreground text-background py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="#" className="hover:opacity-100">
                  Women
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100">
                  Men
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100">
                  Accessories
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">About</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="#" className="hover:opacity-100">
                  Our Story
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100">
                  Sustainability
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100">
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Help</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="#" className="hover:opacity-100">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100">
                  Shipping
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100">
                  Returns
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="#" className="hover:opacity-100">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100">
                  Pinterest
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100">
                  Newsletter
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    )}
  </div>
)

const layouts = [
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Filter-heavy layout with brand carousel and product grid",
    component: MarketplaceLayout,
    features: ["Advanced Filters", "Brand Showcase", "Dense Product Grid"],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, spacious design with category icons and featured products",
    component: MinimalLayout,
    features: ["Category Icons", "Large Product Cards", "Lots of White Space"],
  },
  {
    id: "magazine",
    name: "Magazine",
    description: "Editorial-style layout with large hero images and mixed content",
    component: MagazineLayout,
    features: ["Hero Banner", "Mixed Grid Layout", "Visual Storytelling"],
    badge: "Custom",
  },
]

export default function StoreSettingsPage() {
  const [selectedLayout, setSelectedLayout] = useState("marketplace")

  const SelectedLayoutComponent = layouts.find((l) => l.id === selectedLayout)?.component || MarketplaceLayout

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Dashboard</span>
            <span>›</span>
            <span>Settings</span>
            <span>›</span>
            <span className="text-primary font-medium">Store Settings</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
              <p className="text-muted-foreground mt-1">Choose how your storefront looks to customers</p>
            </div>
            <Button size="lg" className="gap-2">
              <Check className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Layout Selection */}
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Storefront Layout</h2>
                <p className="text-sm text-muted-foreground">
                  Select a layout that best represents your brand and products
                </p>
              </div>

              <RadioGroup value={selectedLayout} onValueChange={setSelectedLayout} className="space-y-4">
                {layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className={cn(
                      "relative flex items-start space-x-4 rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer hover:border-primary/50 hover:bg-accent/50",
                      selectedLayout === layout.id ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card",
                    )}
                    onClick={() => setSelectedLayout(layout.id)}
                  >
                    <RadioGroupItem value={layout.id} id={layout.id} className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Label htmlFor={layout.id} className="text-base font-semibold cursor-pointer">
                          {layout.name}
                        </Label>
                        {layout.badge && (
                          <Badge variant="secondary" className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            {layout.badge}
                          </Badge>
                        )}
                        {selectedLayout === layout.id && (
                          <Badge className="gap-1">
                            <Check className="h-3 w-3" />
                            Selected
                          </Badge>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 ml-auto bg-transparent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0" showCloseButton={true}>
                            <div className="w-full h-full overflow-auto">
                              <layout.component isFullScreen={true} />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <p className="text-sm text-muted-foreground">{layout.description}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {layout.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </Card>

          {/* Right: Live Preview */}
          <Card className="p-6 sticky top-24 h-fit">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Live Preview</h2>
                  <p className="text-sm text-muted-foreground">See how your store will look</p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Store className="h-3 w-3" />
                  Preview
                </Badge>
              </div>

              <div className="aspect-[9/16] bg-muted/30 rounded-lg p-4 border-2 border-dashed border-border">
                <div className="w-full h-full animate-in fade-in-0 zoom-in-95 duration-300">
                  <SelectedLayoutComponent />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" />
                <span>Mobile Preview</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
