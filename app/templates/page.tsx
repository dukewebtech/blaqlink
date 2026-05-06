"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowRight, Store, Zap, Check, Eye } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"

const templates = [
  {
    id: "crystal-clear",
    name: "Crystal Clear",
    description:
      "Minimal, elegant glass design with soft whites, subtle blue gradients, and frosted glass panels. Perfect for modern brands.",
    href: "/templates/crystal-clear",
    image: "/minimal-glass-storefront-light-blue-white-elegant-.jpg",
    features: ["Glassmorphism", "Subtle Gradients", "Clean Layout", "Light Theme"],
    badge: "Glass Style",
    color: "from-blue-500/20 to-cyan-500/20",
    style: "glass",
  },
  {
    id: "obsidian-glass",
    name: "Obsidian Glass",
    description:
      "Bold dark mode design with deep blacks, violet/fuchsia neon accents, and glowing gradient orbs. Ideal for tech and gaming.",
    href: "/templates/obsidian-glass",
    image: "/dark-glass-storefront-neon-purple-violet-black-mod.jpg",
    features: ["Dark Mode", "Neon Accents", "Glow Effects", "Bold Design"],
    badge: "Glass Style",
    color: "from-violet-500/20 to-fuchsia-500/20",
    style: "glass",
  },
  {
    id: "aurora-frost",
    name: "Aurora Frost",
    description:
      "Soft organic glass design with warm rose/amber/teal gradients and floating decorative shapes. Perfect for wellness and lifestyle.",
    href: "/templates/aurora-frost",
    image: "/soft-glass-storefront-rose-amber-teal-organic-well.jpg",
    features: ["Warm Gradients", "Organic Shapes", "Serif Typography", "Soft Aesthetic"],
    badge: "Glass Style",
    color: "from-rose-500/20 to-teal-500/20",
    style: "glass",
  },
  // Existing templates
  {
    id: "beauty-essentials",
    name: "Beauty Essentials",
    description:
      "Clean, organized layout perfect for beauty and skincare brands. Features category circles and promotional bundles.",
    href: "/templates/beauty-essentials",
    image: "/placeholder.svg?height=400&width=600",
    features: ["Category Icons", "Product Bundles", "Promotional Banners", "Quick Add to Cart"],
    badge: "Classic",
    color: "from-pink-500/20 to-rose-500/20",
    style: "classic",
  },
  {
    id: "marketplace-pro",
    name: "Marketplace Pro",
    description: "Feature-rich layout with advanced filters and dense product grids for large catalogs.",
    href: "/templates/marketplace-pro",
    image: "/marketplace-ecommerce-professional-grid-layout.jpg",
    features: ["Advanced Filters", "Brand Carousel", "Dense Grid", "Quick Actions"],
    badge: "Classic",
    color: "from-green-500/20 to-teal-500/20",
    style: "classic",
  },
  {
    id: "editorial-magazine",
    name: "Editorial Magazine",
    description: "Story-driven layout with large imagery and editorial content for brand storytelling.",
    href: "/templates/editorial-magazine",
    image: "/magazine-editorial-fashion-layout-storytelling.jpg",
    features: ["Hero Banners", "Mixed Layouts", "Journal Section", "Visual Stories"],
    badge: "Classic",
    color: "from-orange-500/20 to-red-500/20",
    style: "classic",
  },
]

export default function TemplatesPage() {
  const [userStoreId, setUserStoreId] = useState<string | null>(null)
  const [currentTemplate, setCurrentTemplate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [settingTemplate, setSettingTemplate] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/users/me")
        if (res.ok) {
          const data = await res.json()
          setUserStoreId(data.data?.user?.id || data.id)
          setCurrentTemplate(data.data?.user?.store_template || data.store_template || null)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

  const handleSetDefault = async (templateId: string) => {
    setSettingTemplate(templateId)
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_template: templateId }),
      })

      if (res.ok) {
        setCurrentTemplate(templateId)
        toast.success("Template set as default", {
          description: `Your storefront will now use the ${templates.find((t) => t.id === templateId)?.name} template.`,
        })
      } else {
        toast.error("Failed to set template")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setSettingTemplate(null)
    }
  }

  const glassTemplates = templates.filter((t) => t.style === "glass")
  const classicTemplates = templates.filter((t) => t.style === "classic")

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
            {currentTemplate && (
              <Badge variant="outline" className="gap-2 px-3 py-1.5">
                <Check className="h-3 w-3" />
                Current: {templates.find((t) => t.id === currentTemplate)?.name || "Default"}
              </Badge>
            )}
          </div>
        </div>

        {/* Glass Style Templates Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Glass Style Templates</h2>
            <Badge variant="secondary">New</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Modern glassmorphism designs with frosted effects, subtle transparency, and clean aesthetics.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {glassTemplates.map((template) => (
              <Card
                key={template.id}
                className={`group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  currentTemplate === template.id ? "ring-2 ring-primary" : ""
                }`}
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
                  {currentTemplate === template.id && (
                    <Badge className="absolute top-3 left-3 gap-1 shadow-lg bg-primary">
                      <Check className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                  <Badge className="absolute top-3 right-3 gap-1 shadow-lg bg-violet-500">
                    <Sparkles className="h-3 w-3" />
                    {template.badge}
                  </Badge>
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
                      <Button variant="outline" className="w-full gap-2 bg-transparent">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </Link>
                    <Button
                      className="flex-1 gap-2"
                      disabled={currentTemplate === template.id || settingTemplate === template.id}
                      onClick={() => handleSetDefault(template.id)}
                    >
                      {settingTemplate === template.id ? (
                        <>
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Setting...
                        </>
                      ) : currentTemplate === template.id ? (
                        <>
                          <Check className="h-4 w-4" />
                          Active
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Set as Default
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Classic Templates Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Classic Templates</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Traditional e-commerce layouts with proven conversion patterns.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classicTemplates.map((template) => (
              <Card
                key={template.id}
                className={`group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  currentTemplate === template.id ? "ring-2 ring-primary" : ""
                }`}
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
                  {currentTemplate === template.id && (
                    <Badge className="absolute top-3 left-3 gap-1 shadow-lg bg-primary">
                      <Check className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                  {template.badge && (
                    <Badge className="absolute top-3 right-3 gap-1 shadow-lg" variant="secondary">
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
                      <Button variant="outline" className="w-full gap-2 bg-transparent">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </Link>
                    <Button
                      className="flex-1 gap-2"
                      disabled={currentTemplate === template.id || settingTemplate === template.id}
                      onClick={() => handleSetDefault(template.id)}
                    >
                      {settingTemplate === template.id ? (
                        <>
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Setting...
                        </>
                      ) : currentTemplate === template.id ? (
                        <>
                          <Check className="h-4 w-4" />
                          Active
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Set as Default
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* View Store Section */}
        {userStoreId && (
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">View Your Storefront</h3>
                <p className="text-muted-foreground text-sm">See how your store looks with the selected template</p>
              </div>
              <Link href={`/store/${userStoreId}`} target="_blank">
                <Button className="gap-2">
                  <Store className="h-4 w-4" />
                  Open My Store
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Coming Soon Section */}
        <Card className="p-8 bg-gradient-to-br from-muted/50 to-muted border-dashed">
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
