"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Heart, ShoppingCart, Menu, Star, X } from "lucide-react"
import Image from "next/image"

interface Category {
  id: string
  name: string
  image_url: string | null
}

interface Product {
  id: string
  name: string
  price: number
  description: string | null
  image_url: string | null
  category_id: string | null
}

const featuredProducts = [
  {
    name: "Elegant Summer Dress",
    tagline: "Lightweight & Breathable",
    price: 89,
    image: "https://ladybiba.com/cdn/shop/files/DSC02215.jpg",
  },
  {
    name: "Classic Denim Collection",
    tagline: "Timeless Style",
    price: 129,
    image: "https://ladybiba.com/cdn/shop/files/DSC02156.jpg",
  },
  {
    name: "Premium Knitwear",
    tagline: "Soft & Cozy",
    price: 149,
    image: "https://ladybiba.com/cdn/shop/files/DSC02172.jpg",
  },
]

const newArrivals = [
  {
    name: "Floral Print Dress",
    price: 95,
    colors: ["#FF6B9D", "#FFE5EC", "#C9ADA7"],
    image: "https://ladybiba.com/cdn/shop/files/18841C0D-761A-4231-958A-132ACB03DD52.jpg",
    rating: 4.8,
    reviews: 124,
  },
  {
    name: "Casual Linen Top",
    price: 65,
    colors: ["#FFFFFF", "#F5E6D3", "#D4A574"],
    image: "https://ladybiba.com/cdn/shop/files/L-7.jpg",
    rating: 4.6,
    reviews: 89,
  },
  {
    name: "Elegant Midi Skirt",
    price: 85,
    colors: ["#000000", "#8B4513", "#D2691E"],
    image: "https://ladybiba.com/cdn/shop/files/L-25.jpg",
    rating: 4.9,
    reviews: 156,
  },
  {
    name: "Summer Blouse",
    price: 75,
    colors: ["#E8F4F8", "#FFE5EC", "#FFF8DC"],
    image: "https://ladybiba.com/cdn/shop/files/L-17.jpg",
    rating: 4.7,
    reviews: 98,
  },
  {
    name: "Chic Jumpsuit",
    price: 145,
    colors: ["#2C3E50", "#34495E", "#7F8C8D"],
    image: "https://ladybiba.com/cdn/shop/files/L-12.jpg",
    rating: 4.8,
    reviews: 142,
  },
  {
    name: "Bohemian Dress",
    price: 110,
    colors: ["#8B4513", "#D2691E", "#F4A460"],
    image: "https://ladybiba.com/cdn/shop/files/L-1_d4cdf289-f16c-420c-94f2-b8fd0472ed2d.jpg",
    rating: 4.9,
    reviews: 187,
  },
]

const accessories = [
  {
    name: "Leather Crossbody Bag",
    price: 125,
    image: "https://ladybiba.com/cdn/shop/files/27267E8F-B585-4BC2-A0B1-C0FBD7F8CA66.jpg",
    tag: "New",
  },
  {
    name: "Statement Earrings",
    price: 45,
    image: "https://ladybiba.com/cdn/shop/files/6E30F2B3-FA51-4AD7-9249-647DB4ADC975.jpg",
    tag: "Trending",
  },
  {
    name: "Silk Scarf Collection",
    price: 55,
    image: "https://ladybiba.com/cdn/shop/files/96CC726D-578A-4D56-AA98-9A57E2EA8B12.jpg",
  },
  {
    name: "Designer Sunglasses",
    price: 95,
    image: "https://ladybiba.com/cdn/shop/files/DSC01410.jpg",
    tag: "Best Seller",
  },
]

const collections = [
  {
    title: "Spring Essentials",
    description: "Fresh styles for the new season",
    image: "https://ladybiba.com/cdn/shop/files/DSC01442.jpg",
  },
  {
    title: "Evening Wear",
    description: "Elegant pieces for special occasions",
    image: "https://ladybiba.com/cdn/shop/files/DSC01387.jpg",
  },
  {
    title: "Casual Comfort",
    description: "Everyday styles that feel amazing",
    image: "https://ladybiba.com/cdn/shop/files/5312DEC9-390E-4815-AD27-79A9960F084D.jpg",
  },
]

export default function PremiumBoutiquePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([fetch("/api/products"), fetch("/api/categories")])

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData)
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your store...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <div className="text-2xl font-bold tracking-tight">BOUTIQUE</div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <a href="#" className="hover:text-primary transition-colors">
                  Shop
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  Categories
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  New Arrivals
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  About
                </a>
              </nav>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                  0
                </Badge>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <a href="#" className="block py-2 hover:text-primary transition-colors">
                Shop
              </a>
              <a href="#" className="block py-2 hover:text-primary transition-colors">
                Categories
              </a>
              <a href="#" className="block py-2 hover:text-primary transition-colors">
                New Arrivals
              </a>
              <a href="#" className="block py-2 hover:text-primary transition-colors">
                About
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="py-16 md:py-24 text-center space-y-6">
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight">
              Store. <span className="text-muted-foreground">The best way to buy</span>
            </h1>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-muted-foreground">
              the products you love.
            </h1>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-150">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs">👤</span>
              </div>
              <div className="text-left">
                <p className="font-medium">Need shopping help?</p>
                <a href="#" className="text-primary hover:underline">
                  Ask a Specialist →
                </a>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs">📍</span>
              </div>
              <div className="text-left">
                <p className="font-medium">Visit a Store</p>
                <a href="#" className="text-primary hover:underline">
                  Find one near you →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Category Icons */}
        {categories.length > 0 && (
          <section className="py-12 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:justify-center gap-6 md:gap-8">
              {categories.slice(0, 6).map((category, i) => (
                <div
                  key={category.id}
                  className="flex flex-col items-center gap-3 cursor-pointer group"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-accent group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={category.image_url || "/placeholder.svg"}
                      alt={category.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium text-center">{category.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className="py-16 space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Featured Products. <span className="text-muted-foreground">Discover our favorites.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product, i) => (
              <div
                key={i}
                className="group cursor-pointer bg-accent rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-6 md:p-8 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.tagline}</p>
                    <p className="text-sm font-medium">${product.price.toFixed(2)}</p>
                  </div>
                  <div className="aspect-[4/5] bg-background rounded-xl overflow-hidden">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={400}
                      height={500}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* New Arrivals with Color Swatches */}
        <section className="py-16 space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            New Arrivals. <span className="text-muted-foreground">Fresh styles just for you.</span>
          </h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {products.map((product, i) => (
                <div key={product.id} className="group cursor-pointer space-y-3">
                  <div className="relative aspect-[3/4] bg-accent rounded-lg overflow-hidden">
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{product.rating}</span>
                      <span className="text-xs text-muted-foreground">({product.reviews})</span>
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                    <p className="font-semibold">${product.price.toFixed(2)}</p>
                    <div className="flex gap-1.5">
                      {product.colors.map((color, j) => (
                        <div
                          key={j}
                          className="w-4 h-4 rounded-full border border-border cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available yet. Add some products to see them here!</p>
            </div>
          )}
        </section>

        {/* Accessories Section */}
        <section className="py-16 space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Accessories. <span className="text-muted-foreground">Complete your look.</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {accessories.map((item, i) => (
              <div key={i} className="group cursor-pointer space-y-3">
                <div className="relative aspect-square bg-accent rounded-xl overflow-hidden">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.tag && <Badge className="absolute top-3 left-3 shadow-lg">{item.tag}</Badge>}
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">{item.name}</h3>
                  <p className="font-semibold">${item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Collections */}
        <section className="py-16 space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Collections. <span className="text-muted-foreground">Curated styles for every occasion.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {collections.map((collection, i) => (
              <div
                key={i}
                className="group cursor-pointer bg-accent rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <Image
                    src={collection.image || "/placeholder.svg"}
                    alt={collection.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div className="text-white space-y-2">
                      <h3 className="text-xl font-semibold">{collection.title}</h3>
                      <p className="text-sm text-white/90">{collection.description}</p>
                      <Button variant="secondary" size="sm" className="mt-2 gap-2">
                        Shop Now
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-accent border-t border-border mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Shop</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Women
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Men
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Accessories
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Sale
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Shipping Info
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Returns
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Size Guide
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Sustainability
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Pinterest
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <p>More ways to shop: Find a Store or other retailer near you. Or call 1-800-MY-STORE.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Use
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Sales Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
