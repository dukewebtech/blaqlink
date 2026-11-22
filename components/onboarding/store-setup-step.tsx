"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Loader2, Store, Upload, X } from "lucide-react"
import { BusinessCategoryField } from "@/components/onboarding/business-category-field"
import { shrinkImage } from "@/lib/images"

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
    .replace(/^-|-$/g, "")
}

interface Props {
  /** Store name typed at sign-up, if any. */
  prefillName?: string
  stepLabel?: string
  onComplete: () => void
}

export function StoreSetupStep({ prefillName = "", stepLabel, onComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [businessName, setBusinessName] = useState(prefillName)
  const [slug, setSlug] = useState(toSlug(prefillName))
  const [slugEdited, setSlugEdited] = useState(false)
  // The name from sign-up is shown as a summary; "Change" opens the fields.
  const [editingName, setEditingName] = useState(!prefillName)
  const [category, setCategory] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  useEffect(() => {
    if (prefillName && !businessName) {
      setBusinessName(prefillName)
      setSlug(toSlug(prefillName))
      setEditingName(false)
    }
    // only when the sign-up name arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillName])

  function handleBusinessNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setBusinessName(val)
    if (!slugEdited) setSlug(toSlug(val))
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    if (!picked) return
    setUploadingLogo(true)
    setError(null)
    try {
      const file = await shrinkImage(picked)
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: form })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogoUrl(data.url)
    } catch {
      setError("Your logo didn't upload. You can skip it and add it later in Store Settings.")
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!businessName.trim()) {
      setEditingName(true)
      return setError("Add your store name.")
    }
    if (!category.trim()) return setError("Choose what you sell.")
    if (!city.trim() || !state) return setError("Add the city and state you sell from.")
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 1,
          data: { businessName: businessName.trim(), storeSlug: slug || toSlug(businessName), businessCategory: category.trim(), city: city.trim(), state, storeLogo: logoUrl },
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "We couldn't create your store. Please try again.")
      }
      onComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 sm:p-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-500">
      <div className="mb-6">
        {stepLabel && <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">{stepLabel}</p>}
        <h2 className="text-2xl font-bold">Set up your store</h2>
        <p className="mt-1 text-sm text-muted-foreground">A few details so buyers know who they're buying from.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {editingName ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="businessName">
                Store name <span className="text-destructive">*</span>
              </Label>
              <Input id="businessName" placeholder="e.g. Rinno Cakes" value={businessName} onChange={handleBusinessNameChange} className="h-11" autoFocus={!prefillName} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storeSlug">Store link</Label>
              <div className="flex h-11 items-center rounded-md border bg-background pl-3 text-sm focus-within:ring-2 focus-within:ring-ring">
                <span className="shrink-0 text-muted-foreground">blaqora.store/</span>
                <input
                  id="storeSlug"
                  className="h-full min-w-0 flex-1 bg-transparent pr-3 font-mono outline-none"
                  value={slug}
                  onChange={(e) => {
                    setSlug(toSlug(e.target.value))
                    setSlugEdited(true)
                  }}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <p className="text-xs text-muted-foreground">If this link is taken, we'll add a number to the end.</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <Store className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{businessName}</p>
              <p className="truncate text-sm text-muted-foreground">blaqora.store/{slug}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingName(true)}>
              Change
            </Button>
          </div>
        )}

        <BusinessCategoryField value={category} onChange={setCategory} required />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="city">
              City <span className="text-destructive">*</span>
            </Label>
            <Input id="city" placeholder="e.g. Ikeja" value={city} onChange={(e) => setCity(e.target.value)} className="h-11" autoComplete="address-level2" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">
              State <span className="text-destructive">*</span>
            </Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger id="state" className="h-11">
                <SelectValue placeholder="Choose state" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {NIGERIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="logo">
            Logo <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <input id="logo" type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
          {logoUrl ? (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <img src={logoUrl} alt="Your logo" className="h-12 w-12 rounded object-contain" />
              <p className="flex-1 text-sm text-muted-foreground">Logo added</p>
              <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => setLogoUrl("")} aria-label="Remove logo">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label htmlFor="logo" className="flex h-14 cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed bg-muted/20 px-4 transition-colors hover:border-primary/50">
              {uploadingLogo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">Uploading…</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">Tap to add your logo</span>
                </>
              )}
            </label>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={loading || uploadingLogo}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
          {loading ? "Creating your store…" : "Continue"}
          {!loading && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </form>
    </Card>
  )
}
