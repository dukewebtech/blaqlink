"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Building2, ArrowRight, Loader2 } from "lucide-react"

interface Props {
  onNext: () => void
}

const businessCategories = [
  "Fashion & Apparel",
  "Beauty & Cosmetics",
  "Electronics",
  "Home & Living",
  "Health & Wellness",
  "Food & Beverages",
  "Sports & Fitness",
  "Books & Media",
  "Toys & Games",
  "Arts & Crafts",
  "Jewelry & Accessories",
  "Pet Supplies",
  "Other",
]

export function BusinessInformationStep({ onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    businessName: "",
    storeName: "",
    businessCategory: "",
    businessAddress: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 2,
          data: formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save business information")
      }

      onNext()
    } catch (error) {
      console.error("[v0] Error saving business information:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Business Information</h2>
          <p className="text-sm text-muted-foreground">Tell us about your business</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            placeholder="Enter your registered business name"
            required
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="storeName">Store Name *</Label>
          <Input
            id="storeName"
            placeholder="Your store display name"
            required
            value={formData.storeName}
            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">This is how customers will see your store</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessCategory">Business Category *</Label>
          <Select
            required
            value={formData.businessCategory}
            onValueChange={(value) => setFormData({ ...formData, businessCategory: value })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select your business category" />
            </SelectTrigger>
            <SelectContent>
              {businessCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessAddress">Business Address *</Label>
          <Textarea
            id="businessAddress"
            placeholder="Enter your complete business address"
            required
            value={formData.businessAddress}
            onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
            className="min-h-24"
          />
        </div>

        <div className="rounded-lg bg-muted/50 p-4 border">
          <div className="flex items-start gap-2">
            <div className="text-sm">
              <p className="font-medium mb-1">Country: Nigeria 🇳🇬</p>
              <p className="text-xs text-muted-foreground">Currently serving Nigerian merchants only</p>
            </div>
          </div>
        </div>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
