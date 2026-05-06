"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Store, Upload, ArrowRight, Loader2, X, CheckCircle2, Palette } from "lucide-react"
import { useRouter } from "next/navigation"

const storeTemplates = [
  {
    id: "marketplace-pro",
    name: "Marketplace Pro",
    description: "Feature-rich layout with filters and product grids",
    image: "/marketplace-ecommerce-layout.jpg",
    badge: "Recommended",
  },
  {
    id: "premium-boutique",
    name: "Premium Boutique",
    description: "Minimal, elegant design for luxury brands",
    image: "/minimal-fashion-boutique-storefront.jpg",
    badge: "Popular",
  },
  {
    id: "beauty-essentials",
    name: "Beauty Essentials",
    description: "Clean layout for beauty and skincare brands",
    image: "/placeholder.svg?height=200&width=300",
  },
]

const brandColors = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F97316" },
  { name: "Red", value: "#EF4444" },
]

export function StoreSetupStep({ onNext }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    storeTemplate: "marketplace-pro",
    storeLogo: "",
    brandColor: "#3B82F6",
  })
  const [logoFileName, setLogoFileName] = useState("")

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, storeLogo: data.url }))
      setLogoFileName(file.name)
      console.log("[v0] Store logo uploaded:", data.url)
    } catch (error) {
      console.error("[v0] Logo upload error:", error)
      setError("Failed to upload logo. Please try again.")
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 5,
          data: formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to complete store setup")
      }

      // Move to completion screen
      onNext()
    } catch (error) {
      console.error("[v0] Error completing store setup:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Store Setup</h2>
          <p className="text-sm text-muted-foreground">Customize your storefront</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-3">
          <Label>Choose Store Template *</Label>
          <div className="grid md:grid-cols-3 gap-4">
            {storeTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setFormData({ ...formData, storeTemplate: template.id })}
                className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                  formData.storeTemplate === template.id
                    ? "border-primary shadow-lg scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {formData.storeTemplate === template.id && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-primary rounded-full p-1">
                      <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
                {template.badge && <Badge className="absolute top-2 left-2 z-10 text-xs">{template.badge}</Badge>}
                <img
                  src={template.image || "/placeholder.svg"}
                  alt={template.name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label htmlFor="storeLogo">Store Logo (Optional)</Label>
          <div className="relative">
            <input
              id="storeLogo"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={uploadingLogo}
            />
            <label
              htmlFor="storeLogo"
              className="flex items-center justify-center gap-2 h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
            >
              {formData.storeLogo ? (
                <div className="flex items-center gap-3">
                  <img
                    src={formData.storeLogo || "/placeholder.svg"}
                    alt="Store logo"
                    className="h-20 w-20 object-contain rounded"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault()
                      setFormData({ ...formData, storeLogo: "" })
                      setLogoFileName("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : uploadingLogo ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Upload Store Logo</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG (recommended: 200x200px)</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Brand Color */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Brand Color *
          </Label>
          <div className="grid grid-cols-6 gap-3">
            {brandColors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, brandColor: color.value })}
                className={`relative h-12 rounded-lg border-2 transition-all ${
                  formData.brandColor === color.value
                    ? "border-foreground scale-110 shadow-lg"
                    : "border-border hover:scale-105"
                }`}
                style={{ backgroundColor: color.value }}
              >
                {formData.brandColor === color.value && (
                  <CheckCircle2 className="absolute inset-0 m-auto h-6 w-6 text-white drop-shadow-lg" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">This color will be used for buttons and accents in your store</p>
        </div>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Completing Setup...
            </>
          ) : (
            <>
              Complete Setup
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
