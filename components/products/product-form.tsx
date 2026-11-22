"use client"

import { createClient } from "@/lib/supabase/client"
import { shrinkImage } from "@/lib/images"
import { DIGITAL_FILE_ACCEPT, MAX_DIGITAL_FILE_BYTES } from "@/lib/products/digital-files"
import { VARIANT_OPTION_PRESETS, isColourOption } from "@/lib/products/schema"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useVendorUser } from "@/components/dashboard/vendor-user-context"
import { cn } from "@/lib/utils"
import { formatNaira } from "@/lib/money"
import { fromLagosInput, toLagosInput } from "@/lib/dates"
import {
  DAYS_OF_WEEK,
  MAX_IMAGES,
  MIN_PRICE,
  generateTimeSlots,
  normaliseProductInput,
  validateProduct,
  type DayOfWeek,
  type ProductErrors,
  type ProductType,
} from "@/lib/products/schema"

interface Category {
  id: string
  name: string
}

interface TierRow {
  id?: string
  name: string
  price: string
  quantity_total: string
  quantity_sold?: number
}

interface VariantRow {
  id?: string
  size: string
  color_name: string
  color_hex: string
  stock_quantity: string
}

interface DigitalFile {
  url: string
  name: string
}

export interface ProductFormInitial {
  id: string
  product_type: ProductType
  status: string
  title: string
  description: string | null
  price: number | null
  compare_at_price: number | null
  category: string | null
  images: string[] | null
  file_urls: string[] | null
  license_type: string | null
  download_limit: number | null
  event_date: string | null
  event_location: string | null
  ticket_tiers: { id: string; name: string; price: number; quantity_total: number | null; quantity_sold: number }[]
  sku: string | null
  stock_quantity: number | null
  variants: { id: string; size: string | null; color_name: string | null; color_hex: string | null; stock_quantity: number }[]
  option1_name?: string | null
  option2_name?: string | null
  weight_kg: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  duration_minutes: number | null
  available_days: string[] | null
  start_time: string | null
  end_time: string | null
  booking_link: string | null
}

const TYPE_COPY: Record<ProductType, { title: string; intro: string; nameLabel: string; namePlaceholder: string }> = {
  digital: { title: "Digital product", intro: "Buyers get a download link by email as soon as they pay.", nameLabel: "Product name", namePlaceholder: "e.g. Budget planner template" },
  event: { title: "Event tickets", intro: "Each buyer gets a QR ticket by email, which you scan at the door.", nameLabel: "Event name", namePlaceholder: "e.g. Lagos Live: December edition" },
  physical: { title: "Physical product", intro: "Stock goes down automatically when someone buys.", nameLabel: "Product name", namePlaceholder: "e.g. Ankara tote bag" },
  appointment: { title: "Booking", intro: "Buyers pick a free time and pay to book it.", nameLabel: "Service name", namePlaceholder: "e.g. 1-hour hair consultation" },
}

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240]

function fileNameFromPath(path: string) {
  const last = path.split("/").pop() ?? path
  return last.replace(/^\d+-/, "")
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}

const OTHER = "__other"

function optionPlaceholder(name: string, fallback: string) {
  const examples: Record<string, string> = { size: "M", colour: "Indigo", color: "Indigo", material: "Cotton", style: "Classic", length: "Long", flavour: "Vanilla", scent: "Oud", weight: "500g", pack: "Pack of 3" }
  return `e.g. ${examples[name.trim().toLowerCase()] ?? fallback}`
}

/** Pick a common option name, or type your own. */
function OptionNamePicker({ id, label, value, onChange, error }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string }) {
  const isPreset = (VARIANT_OPTION_PRESETS as readonly string[]).includes(value)
  const [custom, setCustom] = useState(!isPreset)
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={custom ? OTHER : value}
        onValueChange={(v) => {
          if (v === OTHER) {
            setCustom(true)
            onChange("")
          } else {
            setCustom(false)
            onChange(v)
          }
        }}
      >
        <SelectTrigger id={id} aria-invalid={!!error && !custom}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VARIANT_OPTION_PRESETS.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
          <SelectItem value={OTHER}>Something else…</SelectItem>
        </SelectContent>
      </Select>
      {custom && (
        <Input
          aria-label={`${label} name`}
          placeholder="e.g. Finish"
          maxLength={30}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          autoFocus
        />
      )}
      <FieldError id={id} message={error} />
    </div>
  )
}

export function ProductForm({ productType, initial }: { productType: ProductType; initial?: ProductFormInitial }) {
  const router = useRouter()
  const { user: vendor } = useVendorUser()
  const isEdit = !!initial
  const copy = TYPE_COPY[productType]

  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [price, setPrice] = useState(initial?.price && productType !== "event" ? String(initial.price) : "")
  const [compareAt, setCompareAt] = useState(initial?.compare_at_price ? String(initial.compare_at_price) : "")
  const [category, setCategory] = useState(initial?.category ?? "")
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [files, setFiles] = useState<DigitalFile[]>((initial?.file_urls ?? []).map((url) => ({ url, name: fileNameFromPath(url) })))
  const [licenseType, setLicenseType] = useState(initial?.license_type ?? "standard")
  const [downloadLimit, setDownloadLimit] = useState(initial?.download_limit ? String(initial.download_limit) : "")
  const [eventDate, setEventDate] = useState(toLagosInput(initial?.event_date))
  const [eventLocation, setEventLocation] = useState(initial?.event_location ?? "")
  const [tiers, setTiers] = useState<TierRow[]>(
    initial?.ticket_tiers?.length
      ? initial.ticket_tiers.map((t) => ({ id: t.id, name: t.name, price: String(t.price), quantity_total: t.quantity_total ? String(t.quantity_total) : "", quantity_sold: t.quantity_sold }))
      : [{ name: "Regular", price: "", quantity_total: "" }],
  )
  const [trackStock, setTrackStock] = useState(initial ? initial.stock_quantity !== null || (initial.variants?.length ?? 0) > 0 : true)
  const [stock, setStock] = useState(initial?.stock_quantity != null ? String(initial.stock_quantity) : "")
  const [sku, setSku] = useState(initial?.sku ?? "")
  const [option1Name, setOption1Name] = useState(initial?.option1_name || "Size")
  const [option2Name, setOption2Name] = useState(initial?.option2_name || "Colour")
  const colourSwatch = isColourOption(option2Name)
  const [variants, setVariants] = useState<VariantRow[]>(
    (initial?.variants ?? []).map((v) => ({ id: v.id, size: v.size ?? "", color_name: v.color_name ?? "", color_hex: v.color_hex ?? "", stock_quantity: String(v.stock_quantity) })),
  )
  const [dims, setDims] = useState({
    weight_kg: initial?.weight_kg ? String(initial.weight_kg) : "",
    length_cm: initial?.length_cm ? String(initial.length_cm) : "",
    width_cm: initial?.width_cm ? String(initial.width_cm) : "",
    height_cm: initial?.height_cm ? String(initial.height_cm) : "",
  })
  const [duration, setDuration] = useState(initial?.duration_minutes ? String(initial.duration_minutes) : "60")
  const [days, setDays] = useState<DayOfWeek[]>((initial?.available_days ?? []).filter((d): d is DayOfWeek => (DAYS_OF_WEEK as readonly string[]).includes(d)))
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) ?? "09:00")
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) ?? "17:00")
  const [bookingLink, setBookingLink] = useState(initial?.booking_link ?? "")

  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesState, setCategoriesState] = useState<"loading" | "ready" | "error">("loading")
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)

  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [errors, setErrors] = useState<ProductErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState<"draft" | "published" | null>(null)
  const [plan, setPlan] = useState<{ pct: number; fixed: number } | null>(null)

  const imageInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/categories?type=${productType}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (cancelled) return
        setCategories((d.categories ?? []).map((c: Category) => ({ id: c.id, name: c.name })))
        setCategoriesState("ready")
      })
      .catch(() => !cancelled && setCategoriesState("error"))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!vendor) return
    fetch("/api/pricing-plans")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const plans = d?.plans ?? []
        const p = plans.find((x: any) => x.id === vendor.plan_id) ?? plans.find((x: any) => x.plan_key === "free")
        if (p) setPlan({ pct: Number(p.transaction_fee_percentage), fixed: Number(p.transaction_fee_fixed) })
      })
      .catch(() => {})
  }, [vendor])

  const slots = useMemo(() => generateTimeSlots(startTime, endTime, Number(duration) || null), [startTime, endTime, duration])

  function payload(status: "draft" | "published") {
    const num = (v: string) => (v.trim() === "" ? null : Number(v))
    return {
      product_type: productType,
      status,
      title,
      description,
      price: productType === "event" ? undefined : num(price) ?? 0,
      compare_at_price: num(compareAt),
      category: category || null,
      images,
      file_urls: files.map((f) => f.url),
      license_type: licenseType,
      download_limit: num(downloadLimit),
      event_date: eventDate ? fromLagosInput(eventDate) : null,
      event_location: eventLocation,
      ticket_tiers: tiers.map((t) => ({ id: t.id, name: t.name, price: num(t.price), quantity_total: num(t.quantity_total) })),
      sku,
      stock_quantity: trackStock && variants.length === 0 ? num(stock) ?? 0 : null,
      variants: trackStock
        ? variants.map((v) => ({ id: v.id, size: v.size, color_name: v.color_name, color_hex: colourSwatch ? v.color_hex || null : null, stock_quantity: num(v.stock_quantity) ?? NaN }))
        : [],
      option1_name: option1Name.trim(),
      option2_name: option2Name.trim(),
      weight_kg: num(dims.weight_kg),
      length_cm: num(dims.length_cm),
      width_cm: num(dims.width_cm),
      height_cm: num(dims.height_cm),
      duration_minutes: num(duration),
      available_days: days,
      start_time: startTime,
      end_time: endTime,
      time_slots: slots,
      booking_link: bookingLink,
    }
  }

  async function submit(status: "draft" | "published") {
    setFormError(null)
    const body = payload(status)
    const clientErrors = validateProduct(normaliseProductInput(body as Record<string, unknown>))
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) {
      setFormError("Fix the highlighted fields, then save again.")
      document.querySelector("[aria-invalid='true']")?.scrollIntoView({ block: "center", behavior: "smooth" })
      return
    }

    setSaving(status)
    try {
      const res = await fetch(isEdit ? `/api/products/${initial!.id}` : "/api/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrors(data.errors ?? {})
        setFormError(data.error ?? "We couldn't save this product. Please try again.")
        return
      }
      router.push(`/products-list?saved=${status === "published" ? "published" : "draft"}`)
      router.refresh()
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setSaving(null)
    }
  }

  async function uploadImage(original: File) {
    if (images.length >= MAX_IMAGES) return
    setErrors((e) => ({ ...e, images: undefined }))
    if (!original.type.startsWith("image/")) {
      setErrors((e) => ({ ...e, images: "Use a JPG, PNG or WebP photo." }))
      return
    }
    setUploadingImage(true)
    try {
      // Phone photos are often 5–10 MB; shrink them here so they upload.
      const file = await shrinkImage(original)
      if (file.size > 4 * 1024 * 1024) throw new Error("That photo is too large. Try a smaller one.")
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error)
      setImages((prev) => [...prev, data.url])
    } catch (err: any) {
      setErrors((e) => ({ ...e, images: err?.message || "That photo didn't upload. Please try again." }))
    } finally {
      setUploadingImage(false)
    }
  }

  async function uploadDigital(file: File) {
    setErrors((e) => ({ ...e, file_urls: undefined }))
    if (file.size > MAX_DIGITAL_FILE_BYTES) {
      setErrors((e) => ({ ...e, file_urls: "Files can be up to 100 MB. Compress it or split it into parts." }))
      return
    }
    setUploadingFile(true)
    try {
      // 1) ask for a one-time upload link, 2) send the file straight to private storage
      const res = await fetch("/api/upload-digital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error)
      const { error } = await createClient()
        .storage.from("digital-files")
        .uploadToSignedUrl(data.path, data.token, file, { contentType: data.contentType })
      if (error) throw new Error("The upload stopped. Check your connection and try again.")
      setFiles((prev) => [...prev, { url: data.url, name: file.name }])
    } catch (err: any) {
      setErrors((e) => ({ ...e, file_urls: err?.message || "That file didn't upload. Please try again." }))
    } finally {
      setUploadingFile(false)
    }
  }

  async function createCategory() {
    const name = newCategoryName.trim()
    if (!name) {
      setNewCategoryError("Give the category a name.")
      return
    }
    setCreatingCategory(true)
    setNewCategoryError(null)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, product_type: productType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCategories((prev) => [...prev, { id: data.category.id, name: data.category.name }].sort((a, b) => a.name.localeCompare(b.name)))
      setCategory(data.category.id)
      setNewCategoryOpen(false)
      setNewCategoryName("")
    } catch (err: any) {
      setNewCategoryError(err?.message || "We couldn't create that category. Please try again.")
    } finally {
      setCreatingCategory(false)
    }
  }

  const err = (key: string) => errors[key]
  const invalid = (key: string) => (errors[key] ? { "aria-invalid": true as const, "aria-describedby": `${key}-error` } : {})

  // What the vendor keeps from one sale at the price they typed
  const priceForFees = productType === "event" ? Math.min(...tiers.map((t) => Number(t.price)).filter((n) => n > 0)) : Number(price)
  const fee = plan && Number.isFinite(priceForFees) && priceForFees > 0 ? Math.round((priceForFees * plan.pct) / 100 + plan.fixed) : null
  const feeShare = fee !== null ? fee / priceForFees : 0

  function renderFeeHint() {
    if (fee === null) return null
    return (
      <p className={cn("text-sm", feeShare >= 0.2 ? "text-amber-700" : "text-muted-foreground")}>
        On a {formatNaira(priceForFees)} sale, {formatNaira(fee)} goes to fees and you keep {formatNaira(priceForFees - fee)}.
        {feeShare >= 0.2 && " That's a large share. Low prices lose more to the fixed fee."}
      </p>
    )
  }

  function renderPriceField(label = "Price") {
    return (
      <div className="space-y-2">
        <Label htmlFor="price">{label}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
          <Input id="price" type="number" inputMode="decimal" min={MIN_PRICE} step="0.01" className="pl-7 tabular-nums" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="5000" {...invalid("price")} />
        </div>
        <FieldError id="price" message={err("price")} />
        {renderFeeHint()}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link href="/products-list" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to products
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{isEdit ? `Edit ${copy.title.toLowerCase()}` : `New ${copy.title.toLowerCase()}`}</h1>
          <p className="text-muted-foreground">{copy.intro}</p>
        </div>
      </div>

      {formError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {formError}
        </div>
      )}

      <form
        className="grid gap-6 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault()
          submit("published")
        }}
        noValidate
      >
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5 md:p-8 space-y-5">
            <h2 className="text-lg font-semibold">Details</h2>
            <div className="space-y-2">
              <Label htmlFor="title">{copy.nameLabel}</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={copy.namePlaceholder} maxLength={200} {...invalid("title")} />
              <FieldError id="title" message={err("title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What buyers get, and anything they should know." {...invalid("description")} />
              <FieldError id="description" message={err("description")} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category">Category (optional)</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setNewCategoryOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> New category
                </Button>
              </div>
              <Select
                value={category || "none"}
                // The picker can report "" while a just-created category is being
                // added to the list; "No category" is "none", so "" is never a choice.
                onValueChange={(v) => v && setCategory(v === "none" ? "" : v)}
                disabled={categoriesState === "loading"}
              >
                <SelectTrigger id="category" {...invalid("category")}>
                  <SelectValue placeholder={categoriesState === "loading" ? "Loading categories…" : "No category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoriesState === "error" && <p className="text-sm text-muted-foreground">Categories didn't load. You can still save without one.</p>}
              <FieldError id="category" message={err("category")} />
            </div>
          </Card>

          {productType === "digital" && (
            <Card className="p-5 md:p-8 space-y-5">
              <h2 className="text-lg font-semibold">File and price</h2>
              <div className="space-y-2">
                <Label htmlFor="digital-file">File buyers download</Label>
                <input
                  ref={fileInput}
                  id="digital-file"
                  type="file"
                  className="sr-only"
                  accept={DIGITAL_FILE_ACCEPT}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadDigital(f)
                    e.target.value = ""
                  }}
                />
                {files.length > 0 && (
                  <ul className="space-y-2">
                    {files.map((f, i) => (
                      <li key={f.url} className="flex items-center gap-3 rounded-lg border p-3">
                        <FileText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        <span className="flex-1 truncate text-sm">{f.name}</span>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${f.name}`} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={uploadingFile} aria-describedby="file_urls-error">
                  {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                  {uploadingFile ? "Uploading…" : files.length ? "Add another file" : "Upload file"}
                </Button>
                <p className="text-sm text-muted-foreground">PDF, ZIP, video, audio, EPUB or Word, up to 100MB. Buyers only get it after paying.</p>
                <FieldError id="file_urls" message={err("file_urls")} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {renderPriceField()}
                <div className="space-y-2">
                  <Label htmlFor="download-limit">Download limit (optional)</Label>
                  <Input id="download-limit" type="number" inputMode="numeric" min={1} max={100} value={downloadLimit} onChange={(e) => setDownloadLimit(e.target.value)} placeholder="Unlimited" {...invalid("download_limit")} />
                  <p className="text-sm text-muted-foreground">How many times each buyer can download.</p>
                  <FieldError id="download_limit" message={err("download_limit")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">Licence</Label>
                <Select value={licenseType} onValueChange={setLicenseType}>
                  <SelectTrigger id="license">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard: personal use</SelectItem>
                    <SelectItem value="extended">Extended: commercial use allowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          )}

          {productType === "event" && (
            <Card className="p-5 md:p-8 space-y-5">
              <h2 className="text-lg font-semibold">Date, venue and tickets</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-date">Date and time (Lagos time)</Label>
                  <Input id="event-date" type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} {...invalid("event_date")} />
                  <FieldError id="event_date" message={err("event_date")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-location">Venue</Label>
                  <Input id="event-location" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="e.g. Eko Hotel, Victoria Island" {...invalid("event_location")} />
                  <FieldError id="event_location" message={err("event_location")} />
                </div>
              </div>
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Ticket types</legend>
                <p className="text-sm text-muted-foreground">Each type has its own price and number available. Leave the number empty for no limit.</p>
                {tiers.map((tier, i) => (
                  <div key={tier.id ?? `new-${i}`} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_8rem_8rem_auto] sm:items-start">
                    <div className="space-y-1">
                      <Label htmlFor={`tier-${i}-name`} className="sr-only sm:not-sr-only sm:text-xs">Name</Label>
                      <Input id={`tier-${i}-name`} placeholder="e.g. VIP" value={tier.name} onChange={(e) => setTiers((p) => p.map((t, j) => (j === i ? { ...t, name: e.target.value } : t)))} {...invalid(`ticket_tiers.${i}.name`)} />
                      <FieldError id={`ticket_tiers.${i}.name`} message={err(`ticket_tiers.${i}.name`)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`tier-${i}-price`} className="sr-only sm:not-sr-only sm:text-xs">Price (₦)</Label>
                      <Input id={`tier-${i}-price`} type="number" inputMode="decimal" min={MIN_PRICE} placeholder="Price ₦" className="tabular-nums" value={tier.price} onChange={(e) => setTiers((p) => p.map((t, j) => (j === i ? { ...t, price: e.target.value } : t)))} {...invalid(`ticket_tiers.${i}.price`)} />
                      <FieldError id={`ticket_tiers.${i}.price`} message={err(`ticket_tiers.${i}.price`)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`tier-${i}-qty`} className="sr-only sm:not-sr-only sm:text-xs">Available</Label>
                      <Input id={`tier-${i}-qty`} type="number" inputMode="numeric" min={tier.quantity_sold || 1} placeholder="No limit" className="tabular-nums" value={tier.quantity_total} onChange={(e) => setTiers((p) => p.map((t, j) => (j === i ? { ...t, quantity_total: e.target.value } : t)))} {...invalid(`ticket_tiers.${i}.quantity_total`)} />
                      {!!tier.quantity_sold && <p className="text-xs text-muted-foreground">{tier.quantity_sold} sold</p>}
                      <FieldError id={`ticket_tiers.${i}.quantity_total`} message={err(`ticket_tiers.${i}.quantity_total`)} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="sm:mt-5"
                      aria-label={`Remove ${tier.name || "this ticket type"}`}
                      disabled={tiers.length === 1 || !!tier.quantity_sold}
                      title={tier.quantity_sold ? "Ticket types with sales can't be removed" : undefined}
                      onClick={() => setTiers((p) => p.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <FieldError id="ticket_tiers" message={err("ticket_tiers")} />
                <Button type="button" variant="outline" size="sm" onClick={() => setTiers((p) => [...p, { name: "", price: "", quantity_total: "" }])} disabled={tiers.length >= 10}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add ticket type
                </Button>
                {renderFeeHint()}
              </fieldset>
            </Card>
          )}

          {productType === "physical" && (
            <Card className="p-5 md:p-8 space-y-5">
              <h2 className="text-lg font-semibold">Price and stock</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {renderPriceField()}
                <div className="space-y-2">
                  <Label htmlFor="compare-at">Original price (optional)</Label>
                  <Input id="compare-at" type="number" inputMode="decimal" className="tabular-nums" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} placeholder="Shows as a discount" {...invalid("compare_at_price")} />
                  <FieldError id="compare_at_price" message={err("compare_at_price")} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <Label htmlFor="track-stock">Track stock</Label>
                  <p className="text-sm text-muted-foreground">Stops sales when you run out. Turn off for made-to-order items.</p>
                </div>
                <Switch id="track-stock" checked={trackStock} onCheckedChange={setTrackStock} />
              </div>
              {trackStock && variants.length === 0 && (
                <div className="space-y-2 sm:max-w-xs">
                  <Label htmlFor="stock">Quantity in stock</Label>
                  <Input id="stock" type="number" inputMode="numeric" min={0} className="tabular-nums" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" {...invalid("stock_quantity")} />
                  <FieldError id="stock_quantity" message={err("stock_quantity")} />
                </div>
              )}
              {trackStock && (
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Options buyers choose (optional)</legend>
                  <p className="text-sm text-muted-foreground">Name the two choices, like Size and Colour, then add each option with its own stock.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OptionNamePicker id="option1_name" label="First choice" value={option1Name} onChange={setOption1Name} error={err("option1_name")} />
                    <OptionNamePicker id="option2_name" label="Second choice" value={option2Name} onChange={setOption2Name} error={err("option2_name")} />
                  </div>
                  {variants.map((v, i) => (
                    <div
                      key={v.id ?? `new-${i}`}
                      className={`grid gap-3 rounded-lg border p-3 sm:items-start ${colourSwatch ? "sm:grid-cols-[1fr_1fr_3rem_7rem_auto]" : "sm:grid-cols-[1fr_1fr_7rem_auto]"}`}
                    >
                      <div className="space-y-1">
                        <Label htmlFor={`var-${i}-size`} className="text-xs">{option1Name || "First choice"}</Label>
                        <Input id={`var-${i}-size`} placeholder={optionPlaceholder(option1Name, "M")} value={v.size} onChange={(e) => setVariants((p) => p.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))} {...invalid(`variants.${i}.size`)} />
                        <FieldError id={`variants.${i}.size`} message={err(`variants.${i}.size`)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`var-${i}-colour`} className="text-xs">{option2Name || "Second choice"}</Label>
                        <Input id={`var-${i}-colour`} placeholder={optionPlaceholder(option2Name, "Indigo")} value={v.color_name} onChange={(e) => setVariants((p) => p.map((x, j) => (j === i ? { ...x, color_name: e.target.value } : x)))} />
                      </div>
                      {colourSwatch && (
                        <div className="space-y-1">
                          <Label htmlFor={`var-${i}-hex`} className="text-xs">Swatch</Label>
                          <input id={`var-${i}-hex`} type="color" className="h-10 w-12 cursor-pointer rounded-md border" value={v.color_hex || "#000000"} onChange={(e) => setVariants((p) => p.map((x, j) => (j === i ? { ...x, color_hex: e.target.value } : x)))} />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label htmlFor={`var-${i}-stock`} className="text-xs">In stock</Label>
                        <Input id={`var-${i}-stock`} type="number" inputMode="numeric" min={0} className="tabular-nums" value={v.stock_quantity} onChange={(e) => setVariants((p) => p.map((x, j) => (j === i ? { ...x, stock_quantity: e.target.value } : x)))} {...invalid(`variants.${i}.stock_quantity`)} />
                        <FieldError id={`variants.${i}.stock_quantity`} message={err(`variants.${i}.stock_quantity`)} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="sm:mt-5" aria-label={`Remove option ${i + 1}`} onClick={() => setVariants((p) => p.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <FieldError id="variants" message={err("variants")} />
                  <Button type="button" variant="outline" size="sm" onClick={() => setVariants((p) => [...p, { size: "", color_name: "", color_hex: "", stock_quantity: "" }])}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Add option
                  </Button>
                </fieldset>
              )}
              <div className="space-y-2 sm:max-w-xs">
                <Label htmlFor="sku">SKU (optional)</Label>
                <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Your own product code" />
              </div>
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium">Delivery</p>
                <p className="text-sm text-muted-foreground">
                  Buyers choose from your delivery zones at checkout. Set your areas and prices once in{" "}
                  <Link href="/shipping" className="font-medium text-primary underline underline-offset-4">Delivery zones</Link>.
                </p>
                <p className="text-sm text-muted-foreground">Weight and size are only used for courier quotes (optional).</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["weight_kg", "Weight (kg)"],
                      ["length_cm", "Length (cm)"],
                      ["width_cm", "Width (cm)"],
                      ["height_cm", "Height (cm)"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={key} className="text-xs">{label}</Label>
                      <Input id={key} type="number" inputMode="decimal" min={0} step="0.1" value={dims[key]} onChange={(e) => setDims((d) => ({ ...d, [key]: e.target.value }))} {...invalid(key)} />
                      <FieldError id={key} message={err(key)} />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {productType === "appointment" && (
            <Card className="p-5 md:p-8 space-y-5">
              <h2 className="text-lg font-semibold">Availability and price</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {renderPriceField("Price per session")}
                <div className="space-y-2">
                  <Label htmlFor="duration">Session length</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="duration" {...invalid("duration_minutes")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {d < 60 ? `${d} minutes` : d % 60 === 0 ? `${d / 60} hour${d === 60 ? "" : "s"}` : `${Math.floor(d / 60)}h ${d % 60}m`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError id="duration_minutes" message={err("duration_minutes")} />
                </div>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Days you're available</legend>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const on = days.includes(d)
                    return (
                      <Button key={d} type="button" variant={on ? "default" : "outline"} size="sm" aria-pressed={on} onClick={() => setDays((p) => (on ? p.filter((x) => x !== d) : [...p, d]))}>
                        {d}
                      </Button>
                    )
                  })}
                </div>
                <FieldError id="available_days" message={err("available_days")} />
              </fieldset>
              <div className="grid grid-cols-2 gap-5 sm:max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="start-time">First session starts</Label>
                  <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} {...invalid("start_time")} />
                  <FieldError id="start_time" message={err("start_time")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Last session ends</Label>
                  <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} {...invalid("end_time")} />
                  <FieldError id="end_time" message={err("end_time")} />
                </div>
              </div>
              <div className="space-y-2" aria-live="polite">
                <p className="text-sm font-medium">Times buyers can book (Lagos time)</p>
                {slots.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((s) => (
                      <span key={s} className="rounded-md border px-2.5 py-1 text-sm tabular-nums">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Set a start and end time with room for at least one full session.</p>
                )}
                <FieldError id="time_slots" message={err("time_slots")} />
                <p className="text-sm text-muted-foreground">One buyer per time. A booked time disappears for everyone else.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-link">Meeting link (optional)</Label>
                <Input id="booking-link" type="url" value={bookingLink} onChange={(e) => setBookingLink(e.target.value)} placeholder="https://meet.google.com/…" {...invalid("booking_link")} />
                <p className="text-sm text-muted-foreground">For online sessions. Shown to the buyer after they book.</p>
                <FieldError id="booking_link" message={err("booking_link")} />
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5 md:p-6 space-y-4">
            <h2 className="text-lg font-semibold">Photos</h2>
            <p className="text-sm text-muted-foreground">The first photo is the cover. Up to {MAX_IMAGES}.</p>
            <input
              ref={imageInput}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Upload a photo"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadImage(f)
                e.target.value = ""
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              {images.map((src, i) => (
                <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={i === 0 ? "Cover photo" : `Photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-background/90 p-1 shadow">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button type="button" onClick={() => imageInput.current?.click()} disabled={uploadingImage} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:bg-muted/50 disabled:opacity-60">
                  {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-5 w-5" aria-hidden="true" />}
                  <span className="text-xs">{uploadingImage ? "Uploading" : "Add photo"}</span>
                </button>
              )}
            </div>
            <FieldError id="images" message={err("images")} />
          </Card>

          <Card className="p-5 md:p-6 space-y-3 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold">{isEdit ? "Save changes" : "Publish"}</h2>
            <p className="text-sm text-muted-foreground">
              {isEdit && initial?.status === "published"
                ? "This item is live in your store. Saving updates it straight away."
                : "Publish to show it in your store, or save a draft to finish later. Drafts are only visible to you."}
            </p>
            <Button type="submit" className="w-full" disabled={!!saving}>
              {saving === "published" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isEdit && initial?.status === "published" ? "Save changes" : "Publish"}
            </Button>
            <Button type="button" variant="outline" className="w-full" disabled={!!saving} onClick={() => submit("draft")}>
              {saving === "draft" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isEdit && initial?.status === "published" ? "Unpublish and save as draft" : "Save as draft"}
            </Button>
          </Card>
        </div>
      </form>

      <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>Categories group items in your store. This one will be for {copy.title.toLowerCase()} items.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-category">Name</Label>
            <Input
              id="new-category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  createCategory()
                }
              }}
              placeholder="e.g. Bags"
              aria-invalid={!!newCategoryError}
              aria-describedby={newCategoryError ? "new-category-error" : undefined}
            />
            <FieldError id="new-category" message={newCategoryError ?? undefined} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewCategoryOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={createCategory} disabled={creatingCategory}>
              {creatingCategory && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Create category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
