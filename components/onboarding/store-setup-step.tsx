"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Loader2, Upload, X, Store } from "lucide-react"

const CATEGORIES = ["Food & Beverages", "Fashion", "Electronics", "Beauty", "Services", "Other"]

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
]

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

interface Props {
  prefillName?: string
  onComplete: () => void
}

export function StoreSetupStep({ prefillName = "", onComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [businessName, setBusinessName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [category, setCategory] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  // Pre-fill business name from full name once available
  useEffect(() => {
    if (prefillName && !businessName) {
      setBusinessName(prefillName)
      if (!slugEdited) setSlug(toSlug(prefillName))
    }
  }, [prefillName])

  function handleBusinessNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setBusinessName(val)
    if (!slugEdited) setSlug(toSlug(val))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(toSlug(e.target.value))
    setSlugEdited(true)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: form })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setLogoUrl(data.url)
    } catch {
      setError("Logo upload failed. You can skip this and add it later.")
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!businessName.trim() || !slug.trim() || !category || !city.trim() || !state) {
      setError("Please fill in all required fields.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 1,
          data: { businessName, storeSlug: slug, businessCategory: category, city, state, storeLogo: logoUrl },
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to create store")
      }
      onComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Step 1 of 1</p>
        <h2 className="text-2xl font-bold">Let's name your store</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Just one step and you're in — no further setup required before your dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Business Name */}
        <div className="space-y-1.5">
          <Label htmlFor="businessName">Business Name <span className="text-destructive">*</span></Label>
          <Input
            id="businessName"
            placeholder="e.g. Rinno Cakes"
            value={businessName}
            onChange={handleBusinessNameChange}
            required
            className="h-11"
          />
        </div>

        {/* Store Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="storeSlug">Store URL Slug <span className="text-destructive">*</span></Label>
          <Input
            id="storeSlug"
            placeholder="rinno-cakes"
            value={slug}
            onChange={handleSlugChange}
            required
            className="h-11 font-mono text-sm"
          />
          {slug && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              <Store className="h-3.5 w-3.5 shrink-0" />
              <span>blaqora.store/<strong className="text-foreground">{slug}</strong></span>
            </div>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>Business Category <span className="text-destructive">*</span></Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
            <Input
              id="city"
              placeholder="e.g. Lagos"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>State <span className="text-destructive">*</span></Label>
            <Select value={state} onValueChange={setState} required>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-1.5">
          <Label>Business Logo <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <input id="logo" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          {logoUrl ? (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded" />
              <p className="text-sm text-muted-foreground flex-1">Logo uploaded</p>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setLogoUrl("")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label
              htmlFor="logo"
              className="flex items-center gap-3 h-14 px-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/20"
            >
              {uploadingLogo ? (
                <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-sm text-muted-foreground">Uploading…</span></>
              ) : (
                <><Upload className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Click to upload (PNG, JPG, SVG)</span></>
              )}
            </label>
          )}
        </div>

        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}

        <Button type="submit" size="lg" className="w-full gap-2 h-12 text-base" disabled={loading || uploadingLogo}>
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" />Creating your store…</>
          ) : (
            <>Create My Store <ArrowRight className="h-5 w-5" /></>
          )}
        </Button>
      </form>
    </Card>
  )
}
