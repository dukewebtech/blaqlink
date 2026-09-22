"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NigerianLocationSelect } from "@/components/checkout/nigerian-location-select"
import { Store, Loader2, CheckCircle2, AlertCircle, Copy, Check, ExternalLink } from "lucide-react"

const BUSINESS_CATEGORIES = [
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

const BIO_MAX_LENGTH = 200

export default function StoreSettingsPage() {
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")

  const [storeName, setStoreName] = useState("")
  const [storeSlug, setStoreSlug] = useState("")
  const [storeBio, setStoreBio] = useState("")
  const [businessCategory, setBusinessCategory] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [storeState, setStoreState] = useState("")
  const [storeCity, setStoreCity] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)

    async function load() {
      try {
        const res = await fetch("/api/users/me")
        const data = await res.json()
        const user = data?.data?.user
        if (user) {
          setStoreName(user.business_name || user.store_name || "")
          setStoreSlug(user.store_slug || "")
          setStoreBio(user.store_bio || "")
          setBusinessCategory(user.business_category || "")
          setBusinessAddress(user.business_address || "")
          setStoreState(user.store_state || "")
          setStoreCity(user.store_city || "")
        }
      } catch (e) {
        console.error("[store-settings] load error", e)
      } finally {
        setLoadingProfile(false)
      }
    }
    load()
  }, [])

  function handleSlugChange(value: string) {
    const cleaned = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
    setStoreSlug(cleaned)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch("/api/settings/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          storeSlug,
          storeBio,
          businessCategory,
          businessAddress,
          storeCity,
          storeState,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save store settings")

      setStoreSlug(data.data.user.store_slug)
      if (data.slugWasTaken) {
        setNotice(`That store URL was already taken — we saved it as ${origin}/${data.data.user.store_slug} instead.`)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${origin}/${storeSlug}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error("[store-settings] copy failed", e)
    }
  }

  if (loadingProfile) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your store's public name, URL and description — what shoppers see, not how it looks.
          </p>
        </div>

        {storeSlug && (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <a
                href={`${origin}/${storeSlug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline truncate"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {origin}/{storeSlug}
                </span>
              </a>
              <Button onClick={copyLink} variant="outline" size="sm" className="gap-2 shrink-0 bg-transparent">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Store Profile</h2>
              <p className="text-xs text-muted-foreground">Shown on your storefront and shared link previews.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="storeName">
                Store Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="storeName"
                placeholder="Your store display name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="storeSlug">
                Store URL <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center rounded-md border border-input h-11 overflow-hidden focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring">
                <span className="pl-3 pr-1 text-sm text-muted-foreground truncate shrink-0">{origin}/</span>
                <input
                  id="storeSlug"
                  value={storeSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                  className="flex-1 min-w-0 h-full pr-3 bg-transparent outline-none text-sm"
                  placeholder="your-store"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                If this URL is already taken, we'll save the closest available one instead.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="storeBio">Store Bio</Label>
                <span className="text-xs text-muted-foreground">
                  {storeBio.length}/{BIO_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                id="storeBio"
                placeholder="A short description shoppers see on your storefront and in WhatsApp/Instagram link previews."
                value={storeBio}
                onChange={(e) => setStoreBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
                className="min-h-24"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Business Category</Label>
              <Select value={businessCategory} onValueChange={setBusinessCategory}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your business category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Textarea
                id="businessAddress"
                placeholder="Used as your delivery pickup reference"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="min-h-20"
              />
            </div>

            <NigerianLocationSelect
              state={storeState}
              city={storeCity}
              onStateChange={setStoreState}
              onCityChange={setStoreCity}
            />

            {notice && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                <span>{notice}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full gap-2" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Saving…
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Saved!
                </>
              ) : (
                "Save Store Settings"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
