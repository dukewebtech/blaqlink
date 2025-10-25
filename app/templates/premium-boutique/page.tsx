"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Heart, ShoppingCart, Menu, Star, ArrowRight, X, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { cartStore } from "@/lib/cart-store"
import { ProductDetailModal } from "@/components/store/product-detail-modal"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  product_type: string
  category_id: string
}

interface Category {
  id: string
  name: string
  image: string | null
}

interface StoreInfo {
  business_name: string
}

export default function PremiumBoutiquePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes, storeRes] = await Promise.all([
          fetch("/api/public/products"),
          fetch("/api/public/categories"),
          fetch("/api/public/store-info"),
        ])

        const productsData = await productsRes.json()
        const categoriesData = await categoriesRes.json()
        const storeData = await storeRes.json()

        setProducts(productsData.products || [])
        setCategories(categoriesData.categories || [])
        setStoreInfo(storeData)
        setLoading(false)
      } catch (err) {
        console.error("[v0] Error fetching template data:", err)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(cartStore.getItemCount())
    }
    updateCartCount()
    const interval = setInterval(updateCartCount, 500)
    return () => clearInterval(interval)
  }, [])

  const handleProductClick = (product: Product) => {
    setSelectedProduct({
      id: product.id,
      title: product.name,
      price: product.price,
      images: product.images,
      product_type: product.product_type,
      category: product.category_id,
      description: "",
    })
    setModalOpen(true)
  }

  if (!loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">No Products Available</h2>
          <p className="text-muted-foreground">
            You need to add products to your store before this template can display properly.
          </p>
          <Link href="/products/create">
            <Button className="mt-4">Add Your First Product</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    )
  }

  const featuredProducts = products.slice(0, 3)
  const newArrivals = products.slice(0, 6)
  const accessories = products.slice(0, 4)
  const collections = categories.slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <div className="text-2xl font-bold tracking-tight">{storeInfo?.business_name || "BOUTIQUE"}</div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <a href="#" className="hover:text-primary transition-colors">
                  Shop All
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  Categories
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  New Arrivals
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  Sale
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
              <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/store/cart")}>
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                  {cartCount}
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
                Shop All
              </a>
              <a href="#" className="block py-2 hover:text-primary transition-colors">
                Categories
              </a>
              <a href="#" className="block py-2 hover:text-primary transition-colors">
                New Arrivals
              </a>
              <a href="#" className="block py-2 hover:text-primary transition-colors">
                Sale
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
              {storeInfo?.business_name}. <span className="text-muted-foreground">The best way to buy</span>
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
                    <img
                      src={category.image || "/placeholder.svg?height=80&width=80"}
                      alt={category.name}
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
            The latest. <span className="text-muted-foreground">Take a look at what's new, right now.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product, i) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group cursor-pointer bg-accent rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-6 md:p-8 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.product_type}</p>
                    <p className="text-sm font-medium">NGN {product.price.toLocaleString()}</p>
                  </div>
                  <div className="aspect-[4/5] bg-background rounded-xl overflow-hidden">
                    <img
                      src={product.images?.[0] || "/placeholder.svg?height=500&width=400"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* New Arrivals */}
        <section className="py-16 space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            New Arrivals. <span className="text-muted-foreground">Fresh styles just for you.</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {newArrivals.map((product, i) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group cursor-pointer space-y-3"
              >
                <div className="relative aspect-[3/4] bg-accent rounded-lg overflow-hidden">
                  <img
                    src={product.images?.[0] || "/placeholder.svg?height=400&width=300"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                    <span className="text-xs font-medium">4.5</span>
                    <span className="text-xs text-muted-foreground">(0)</span>
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                  <p className="font-semibold">NGN {product.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Accessories Section */}
        {accessories.length > 0 && (
          <section className="py-16 space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              More Products. <span className="text-muted-foreground">Complete your collection.</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {accessories.map((item, i) => (
                <div key={item.id} onClick={() => handleProductClick(item)} className="group cursor-pointer space-y-3">
                  <div className="relative aspect-square bg-accent rounded-xl overflow-hidden">
                    <img
                      src={item.images?.[0] || "/placeholder.svg?height=400&width=400"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h3>
                    <p className="font-semibold">NGN {item.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Collections */}
        {collections.length > 0 && (
          <section className="py-16 space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Collections. <span className="text-muted-foreground">Curated styles for every occasion.</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {collections.map((collection, i) => (
                <div
                  key={collection.id}
                  className="group cursor-pointer bg-accent rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <img
                      src={collection.image || "/placeholder.svg?height=600&width=400"}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                      <div className="text-white space-y-2">
                        <h3 className="text-xl font-semibold">{collection.name}</h3>
                        <Button variant="secondary" size="sm" className="mt-2 gap-2">
                          Shop Now
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
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
                    All Products
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Categories
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    New Arrivals
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
              <p>© 2025 {storeInfo?.business_name || "Your Store"}. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Use
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
        storeName={storeInfo?.business_name}
      />
    </div>
  )
}
