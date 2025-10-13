"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ShoppingCart, Heart, User, Star, SlidersHorizontal, ArrowLeft, Eye } from "lucide-react"
import Link from "next/link"

const brands = [
  { name: "Nike", logo: "/nike-swoosh.png", rating: 4.8, reviews: 2525 },
  { name: "Adidas", logo: "/adidas-logo.png", rating: 4.7, reviews: 3567 },
  { name: "Puma", logo: "/leaping-cat-logo.png", rating: 4.6, reviews: 1864 },
  { name: "Reebok", logo: "/reebok-logo.jpg", rating: 4.5, reviews: 2404 },
  { name: "New Balance", logo: "/new-balance-logo.jpg", rating: 4.9, reviews: 1868 },
  { name: "Converse", logo: "/converse-logo.jpg", rating: 4.6, reviews: 7086 },
]

const products = [
  {
    id: 1,
    name: "Air Max Running Shoes",
    brand: "Nike",
    price: 129.99,
    originalPrice: 159.99,
    discount: 19,
    rating: 4.8,
    reviews: 234,
    image: "/nike-air-max-running-shoes.jpg",
    colors: ["#000000", "#FFFFFF", "#FF0000", "#0000FF"],
  },
  {
    id: 2,
    name: "Ultraboost 22 Sneakers",
    brand: "Adidas",
    price: 189.99,
    rating: 4.9,
    reviews: 567,
    image: "/adidas-ultraboost-sneakers.jpg",
    colors: ["#000000", "#FFFFFF", "#808080"],
  },
  {
    id: 3,
    name: "Classic Suede Trainers",
    brand: "Puma",
    price: 79.99,
    rating: 4.6,
    reviews: 189,
    image: "/puma-suede-classic-trainers.jpg",
    colors: ["#8B4513", "#000000", "#FFFFFF", "#FF0000"],
  },
  {
    id: 4,
    name: "Club C 85 Vintage",
    brand: "Reebok",
    price: 89.99,
    rating: 4.7,
    reviews: 423,
    image: "/reebok-club-c-vintage-sneakers.jpg",
    colors: ["#FFFFFF", "#000000"],
  },
  {
    id: 5,
    name: "574 Core Sneakers",
    brand: "New Balance",
    price: 99.99,
    originalPrice: 119.99,
    discount: 17,
    rating: 4.8,
    reviews: 312,
    image: "/new-balance-574-sneakers.jpg",
    colors: ["#808080", "#000000", "#0000FF"],
  },
  {
    id: 6,
    name: "Chuck Taylor All Star",
    brand: "Converse",
    price: 65.99,
    rating: 4.9,
    reviews: 891,
    image: "/converse-chuck-taylor-all-star.jpg",
    colors: ["#000000", "#FFFFFF", "#FF0000", "#0000FF", "#FFFF00"],
  },
  {
    id: 7,
    name: "Air Force 1 Low",
    brand: "Nike",
    price: 119.99,
    rating: 4.9,
    reviews: 1234,
    image: "/placeholder.svg?height=300&width=300",
    colors: ["#FFFFFF", "#000000"],
  },
  {
    id: 8,
    name: "Stan Smith Leather",
    brand: "Adidas",
    price: 94.99,
    rating: 4.8,
    reviews: 678,
    image: "/placeholder.svg?height=300&width=300",
    colors: ["#FFFFFF", "#008000"],
  },
]

export default function MarketplaceProTemplate() {
  const [priceRange, setPriceRange] = useState([0, 200])

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
                  2
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
              Color
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
              Gender
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
              On sale
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
              Price $0 - $200+
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
              Ratings
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
              Size
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
                className="group p-4 hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                  <img
                    src={brand.logo || "/placeholder.svg"}
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

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Sneakers & Athletic Shoes</h2>
            <span className="text-sm text-muted-foreground">Showing 1-8 of 156 results</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <Card
                key={product.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {product.discount && (
                    <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 z-10">
                      -{product.discount}%
                    </Badge>
                  )}
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
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">({product.reviews})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.colors.map((color, i) => (
                      <button
                        key={i}
                        className="w-5 h-5 rounded-full border-2 border-muted hover:border-foreground transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">${product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
