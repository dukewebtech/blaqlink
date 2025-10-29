"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowRight, Store, Palette, Zap } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

const templates = [
  {
    id: "beauty-essentials",
    name: "Beauty Essentials",
    description:
      "Clean, organized layout perfect for beauty and skincare brands. Features category circles and promotional bundles.",
    href: "/templates/beauty-essentials",
    image: "/placeholder.svg?height=400&width=600",
    features: ["Category Icons", "Product Bundles", "Promotional Banners", "Quick Add to Cart"],
    badge: "New",
    color: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: "premium-boutique",
    name: "Premium Boutique",
    description: "Minimal, elegant design inspired by luxury brands. Perfect for fashion and lifestyle stores.",
    href: "/templates/premium-boutique",
    image: "/minimal-fashion-boutique-storefront.jpg",
    features: ["Clean Navigation", "Large Hero Section", "Category Icons", "Featured Collections"],
    badge: "Popular",
    color: "from-blue-500/20 to-purple-500/20",
  },
  {
    id: "marketplace-pro",
    name: "Marketplace Pro",
    description: "Feature-rich layout with advanced filters and dense product grids for large catalogs.",
    href: "/templates/marketplace-pro",
    image: "/marketplace-ecommerce-layout.jpg",
    features: ["Advanced Filters", "Brand Carousel", "Dense Grid", "Quick Actions"],
    color: "from-green-500/20 to-teal-500/20",
  },
  {
    id: "editorial-magazine",
    name: "Editorial Magazine",
    description: "Story-driven layout with large imagery and editorial content for brand storytelling.",
    href: "/templates/editorial-magazine",
    image: "/magazine-editorial-fashion-layout.jpg",
    features: ["Hero Banners", "Mixed Layouts", "Journal Section", "Visual Stories"],
    color: "from-orange-500/20 to-red-500/20",
  },
]

export default function TemplatesPage() {
  const [userStoreId, setUserStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserStoreId = async () => {
      try {
        console.log("[v0] Fetching user store ID...")
        const res = await fetch("/api/users/me")
        console.log("[v0] Response status:", res.status)
        if (res.ok) {
          const data = await res.json()
          console.log("[v0] User data received:", data)
          console.log("[v0] User ID:", data.id)
          setUserStoreId(data.id)
        } else {
          console.error("[v0] Failed to fetch user data:", res.status)
        }
      } catch (error) {
        console.error("[v0] Error fetching user store ID:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserStoreId()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Dashboard</span>
            <span>›</span>
            <span className="text-primary font-medium">Templates</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Storefront Templates</h1>
              <p className="text-muted-foreground mt-1">
                Choose a professionally designed template for your online store
              </p>
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Palette className="h-4 w-4" />
              Customize Theme
            </Button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className="relative aspect-video bg-gradient-to-br overflow-hidden"
                style={{ background: `linear-gradient(to bottom right, ${template.color})` }}
              >
                <img
                  src={template.image || "/placeholder.svg"}
                  alt={template.name}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                {template.badge && (
                  <Badge className="absolute top-3 right-3 gap-1 shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    {template.badge}
                  </Badge>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Link href={template.href} className="flex-1">
                    <Button variant="outline" className="w-full gap-2 group/btn bg-transparent">
                      <Store className="h-4 w-4" />
                      Default Preview
                    </Button>
                  </Link>
                  {loading ? (
                    <Button className="flex-1 gap-2" disabled>
                      <Sparkles className="h-4 w-4" />
                      Loading...
                    </Button>
                  ) : userStoreId ? (
                    <Link href={`/store/${userStoreId}`} target="_blank" className="flex-1">
                      <Button className="w-full gap-2 group/btn">
                        <Sparkles className="h-4 w-4" />
                        My Store
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <Button className="flex-1 gap-2" disabled>
                      <Sparkles className="h-4 w-4" />
                      My Store
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Coming Soon Section */}
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-dashed">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">More Templates Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're constantly adding new professionally designed templates. Check back soon for more options!
              </p>
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              Request a Template
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
