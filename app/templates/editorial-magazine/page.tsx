"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, ShoppingBag, User, Heart, ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Product {
  id: string
  name: string
  price: number
  description: string | null
  image_url: string | null
  category_id: string | null
}

const featuredCollections = [
  {
    id: 1,
    title: "Summer Essentials",
    subtitle: "Light & Breezy",
    description: "Discover our curated selection of summer must-haves",
    image: "/placeholder.svg?height=600&width=800",
    cta: "Shop Collection",
  },
  {
    id: 2,
    title: "Urban Edge",
    subtitle: "Street Style",
    description: "Bold pieces for the modern city dweller",
    image: "/placeholder.svg?height=600&width=800",
    cta: "Explore Now",
  },
]

const journalPosts = [
  {
    id: 1,
    title: "The Art of Layering",
    category: "Style Guide",
    excerpt: "Master the perfect layered look for any season with our expert styling tips",
    image: "/placeholder.svg?height=400&width=600",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Sustainable Fashion",
    category: "Conscious Living",
    excerpt: "How we're making fashion more sustainable, one piece at a time",
    image: "/placeholder.svg?height=400&width=600",
    readTime: "7 min read",
  },
  {
    id: 3,
    title: "Color Theory 2024",
    category: "Trends",
    excerpt: "This season's color palette and how to wear it with confidence",
    image: "/placeholder.svg?height=400&width=600",
    readTime: "4 min read",
  },
]

export default function EditorialMagazineTemplate() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const productsRes = await fetch("/api/products")

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData)
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
          <div className="flex items-center justify-between h-20">
            <Link
              href="/templates"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                New In
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Collections
              </a>
              <h1 className="text-3xl font-serif font-bold">ATELIER</h1>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Journal
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </a>
            </nav>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <ShoppingBag className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 z-10" />
        <img
          src="/placeholder.svg?height=1200&width=1920"
          alt="Hero"
          className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-1000"
        />
        <div className="absolute inset-0 z-20 flex items-end">
          <div className="container mx-auto px-4 pb-16 md:pb-24">
            <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
              <Badge className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90">
                Spring/Summer 2024
              </Badge>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-balance">
                Timeless Elegance Redefined
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty">
                Discover our latest collection where classic sophistication meets contemporary design
              </p>
              <Button size="lg" className="gap-2 group">
                Explore Collection
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {featuredCollections.map((collection, index) => (
              <Card
                key={collection.id}
                className="group overflow-hidden hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={collection.image || "/placeholder.svg"}
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white space-y-4">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30">
                      {collection.subtitle}
                    </Badge>
                    <h3 className="text-3xl md:text-4xl font-serif font-bold">{collection.title}</h3>
                    <p className="text-white/90">{collection.description}</p>
                    <Button variant="secondary" className="gap-2 group/btn bg-white text-black hover:bg-white/90">
                      {collection.cta}
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif font-bold">Your Products</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Carefully curated pieces that embody our commitment to quality and timeless style
            </p>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product, index) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 animate-in fade-in zoom-in-95"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <img
                      src={product.image_url || "/placeholder.svg?height=500&width=400"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <h3 className="font-medium text-lg line-clamp-2">{product.name}</h3>
                    <p className="text-xl font-semibold">${product.price.toFixed(2)}</p>
                    <Button variant="outline" className="w-full group/btn bg-transparent">
                      Add to Cart
                      <ShoppingBag className="h-4 w-4 ml-2 group-hover/btn:scale-110 transition-transform" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available yet. Add some products to see them here!</p>
            </div>
          )}
        </div>
      </section>

      {/* Journal Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-2">The Journal</h2>
              <p className="text-muted-foreground">Stories, inspiration, and style insights</p>
            </div>
            <Button variant="outline" className="gap-2 hidden md:flex bg-transparent">
              View All Articles
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {journalPosts.map((post, index) => (
              <Card
                key={post.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="aspect-[3/2] overflow-hidden bg-muted">
                  <img
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span className="text-muted-foreground">{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{post.title}</h3>
                  <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  <Button variant="link" className="p-0 gap-2 group/btn">
                    Read More
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold">Stay Inspired</h2>
            <p className="text-muted-foreground text-lg">
              Subscribe to receive exclusive access to new collections and special offers
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input placeholder="Enter your email" className="flex-1" />
              <Button className="gap-2">
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
