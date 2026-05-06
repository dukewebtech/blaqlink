"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ShoppingCart, Heart, User, Star, SlidersHorizontal, ArrowLeft, Eye } from "lucide-react"
import Link from "next/link"

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

const brands = [
  { name: "Nike", logo: "/nike-swoosh.png", rating: 4.8, reviews: 2525 },
  { name: "Adidas", logo: "/adidas-logo.png", rating: 4.7, reviews: 3567 },
  { name: "Puma", logo: "/leaping-cat-logo.png", rating: 4.6, reviews: 1864 },
  { name: "Reebok", logo: "/reebok-logo.jpg", rating: 4.5, reviews: 2404 },
  { name: "New Balance", logo: "/new-balance-logo.jpg", rating: 4.9, reviews: 1868 },
  { name: "Converse", logo: "/converse-logo.jpg", rating: 4.6, reviews: 7086 },
]

export default function MarketplaceProTemplate() {
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
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link
                href="/templates"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                shop
              </h1>
            </div>
            <div className="flex-1 max-w-xl mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search for products..." className="pl-10 bg-muted/50" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  0
                </Badge>
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            <Button variant="outline" size="sm" className="gap-2 shrink-0 bg-transparent">
              <SlidersHorizontal className="h-4 w-4" />
              All Filters
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
              Category
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
              Price
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 ml-auto bg-transparent">
              Sort by
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Related Brands */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Related shops</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {brands.map((brand, index) => (
              <Card
                key={brand.name}
                className="group p-4 hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                  <img
                    src={brand.logo || "/placeholder.svg?height=100&width=100"}
                    alt={brand.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-semibold text-sm text-center mb-1">{brand.name}</h3>
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{brand.rating}</span>
                  <span className="text-muted-foreground">({brand.reviews})</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Related Categories */}
        {categories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Categories</h2>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category, index) => (
                <Card
                  key={category.id}
                  className="group p-4 hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                    <img
                      src={category.image_url || "/placeholder.svg?height=100&width=100"}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-center">{category.name}</h3>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">All Products</h2>
            <span className="text-sm text-muted-foreground">Showing {products.length} results</span>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <img
                      src={product.image_url || "/placeholder.svg?height=300&width=300"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">(0)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">${product.price.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available yet. Add some products to see them here!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
