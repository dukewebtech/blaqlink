import { cache } from "react"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"
import { DaylightStorefront } from "@/components/store/templates/daylight-storefront"
import { EditorialStorefront } from "@/components/store/templates/editorial-storefront"
import { StudioStorefront } from "@/components/store/templates/studio-storefront"
import { BoutiqueStorefront } from "@/components/store/templates/boutique-storefront"
import { OraStorefront } from "@/components/store/templates/ora-storefront"
import type { DaylightBookingDay, DaylightItem, DaylightStore } from "@/components/store/templates/daylight-types"
import { isStoreFontPairing } from "@/lib/storefront/fonts"
import { getAppUrl } from "@/lib/utils/app-url"

const VALID_TEMPLATES = ["daylight", "editorial", "studio", "boutique", "ora"] as const

const APP_URL = getAppUrl()
const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Vendor edits (template, brand colour, items...) must show up on the next
// visit, not after a stale cached render — never cache this route's data.
export const dynamic = "force-dynamic"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SELECT_FIELDS =
  "id, business_name, full_name, store_bio, store_cover_image_url, profile_image, store_logo_url, store_brand_color, store_template, store_font, location, business_address, store_city, store_state, phone, email, admin_kyc_approved, created_at, shipping_mode"

// Not every vendor has picked a store_slug yet (it's an onboarding-time field).
// Until they do, their storefront is still reachable at /{their user id}.
const getVendorBySlug = cache(async (slug: string) => {
  const supabase = createAdminClient()
  const { data: bySlug } = await supabase.from("users").select(SELECT_FIELDS).eq("store_slug", slug).maybeSingle()
  if (bySlug) return bySlug

  if (UUID_RE.test(slug)) {
    const { data: byId } = await supabase.from("users").select(SELECT_FIELDS).eq("id", slug).maybeSingle()
    if (byId) return byId
  }
  return null
})

function generateBookingDays(
  availableDays: string[],
  timeSlots: string[],
  bookedKeys: Set<string>,
): DaylightBookingDay[] {
  const days: DaylightBookingDay[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1)
  let guard = 0
  while (days.length < 5 && guard < 60) {
    const dow = DOW_NAMES[cursor.getDay()]
    if (availableDays.includes(dow)) {
      const iso = cursor.toISOString().slice(0, 10)
      const slots = timeSlots.map((time) => ({ time, free: !bookedKeys.has(`${iso}|${time}`) }))
      days.push({
        label: `${dow} ${cursor.getDate()}`,
        dow,
        dateNum: cursor.getDate(),
        date: iso,
        free: timeSlots.length > 0 && slots.some((s) => s.free),
        slots,
      })
    }
    cursor.setDate(cursor.getDate() + 1)
    guard++
  }
  return days
}

function digitalFileLabel(fileUrls: string[] | null): string | null {
  if (!fileUrls || fileUrls.length === 0) return null
  const ext = fileUrls[0].split(".").pop()?.split("?")[0]?.toUpperCase() ?? "FILE"
  return fileUrls.length > 1 ? `${ext}, ${fileUrls.length} files` : `${ext} file`
}

async function loadStorefrontData(slug: string): Promise<{ store: DaylightStore; items: DaylightItem[] } | null> {
  const vendor = await getVendorBySlug(slug)
  if (!vendor) return null

  const supabase = createAdminClient()

  const [{ data: products }, { data: deliveryAreas }, { count: ordersDelivered }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("user_id", vendor.id)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("delivery_areas")
      .select("id, name, note, fee, state, city")
      .eq("user_id", vendor.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", vendor.id).eq("payment_status", "success"),
    supabase.from("categories").select("id, name, image_url").eq("user_id", vendor.id).eq("status", "active"),
  ])
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]))
  const categoryImageById = new Map((categories ?? []).map((c) => [c.id, c.image_url as string | null]))

  const allProducts = products ?? []
  const physicalIds = allProducts.filter((p) => p.product_type === "physical").map((p) => p.id)
  const eventIds = allProducts.filter((p) => p.product_type === "event").map((p) => p.id)
  const appointmentIds = allProducts.filter((p) => p.product_type === "appointment").map((p) => p.id)

  const [{ data: variants }, { data: tiers }, { data: bookedItems }] = await Promise.all([
    physicalIds.length
      ? supabase.from("product_variants").select("id, product_id, size, color_name, color_hex, stock_quantity").in("product_id", physicalIds)
      : Promise.resolve({ data: [] as any[] }),
    eventIds.length
      ? supabase.from("ticket_tiers").select("id, product_id, name, price, quantity_total, quantity_sold").in("product_id", eventIds).order("sort_order")
      : Promise.resolve({ data: [] as any[] }),
    appointmentIds.length
      ? supabase
          .from("order_items")
          .select("product_id, appointment_date, appointment_time, orders!inner(payment_status)")
          .in("product_id", appointmentIds)
          .eq("orders.payment_status", "success")
      : Promise.resolve({ data: [] as any[] }),
  ])

  const bookedByProduct = new Map<string, Set<string>>()
  for (const row of bookedItems ?? []) {
    if (!row.appointment_date || !row.appointment_time) continue
    const set = bookedByProduct.get(row.product_id) ?? new Set<string>()
    set.add(`${row.appointment_date}|${row.appointment_time}`)
    bookedByProduct.set(row.product_id, set)
  }

  const items: DaylightItem[] = allProducts.map((p) => {
    const type = p.product_type as DaylightItem["type"]
    const productVariants = (variants ?? []).filter((v) => v.product_id === p.id)
    const productTiers = (tiers ?? []).filter((t) => t.product_id === p.id)
    const stockFromVariants = productVariants.length > 0 ? productVariants.reduce((s, v) => s + v.stock_quantity, 0) : null

    return {
      id: p.id,
      type,
      name: p.title,
      description: p.description ?? "",
      price: Number(p.price ?? 0),
      compareAtPrice: p.compare_at_price != null ? Number(p.compare_at_price) : null,
      images: (p.images && p.images.length ? p.images : ["/placeholder.svg"]) as string[],
      // Product-category assignment lives in the legacy `category` TEXT column
      // (holding the category's UUID as a string) — the same convention the
      // product create/edit forms and products-list use; `category_id` is unused.
      categoryId: p.category ?? null,
      categoryName: p.category ? categoryNameById.get(p.category) ?? null : null,
      categoryImageUrl: p.category ? categoryImageById.get(p.category) ?? null : null,
      stock: type === "physical" ? (stockFromVariants ?? p.stock_quantity ?? null) : null,
      variants: productVariants.map((v) => ({
        id: v.id,
        size: v.size,
        colorName: v.color_name,
        colorHex: v.color_hex,
        stock: v.stock_quantity,
      })),
      eventDate: p.event_date ? new Date(p.event_date).toLocaleString("en-NG", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : null,
      eventLocation: p.event_location ?? null,
      tiers: productTiers.map((t) => ({
        id: t.id,
        name: t.name,
        price: Number(t.price),
        left: t.quantity_total == null ? null : Math.max(0, t.quantity_total - t.quantity_sold),
      })),
      durationLabel: p.duration_minutes ? `${p.duration_minutes} minutes` : null,
      venue: p.event_location ?? p.booking_link ?? null,
      days:
        type === "appointment"
          ? generateBookingDays(p.available_days ?? [], p.time_slots ?? [], bookedByProduct.get(p.id) ?? new Set())
          : [],
      fileLabel: type === "digital" ? digitalFileLabel(p.file_urls) : null,
    }
  })

  const store: DaylightStore = {
    id: vendor.id,
    slug,
    name: vendor.business_name || vendor.full_name || "Store",
    bio: vendor.store_bio || null,
    avatarUrl: vendor.profile_image || vendor.store_logo_url || null,
    coverUrl: vendor.store_cover_image_url || null,
    accent: vendor.store_brand_color || "#155DFD",
    location: vendor.business_address || vendor.location || [vendor.store_city, vendor.store_state].filter(Boolean).join(", ") || null,
    whatsappNumber: vendor.phone ? vendor.phone.replace(/\D/g, "") : null,
    email: vendor.email || null,
    ordersDelivered: ordersDelivered ?? 0,
    memberSinceYear: vendor.created_at ? new Date(vendor.created_at).getFullYear() : new Date().getFullYear(),
    verified: !!vendor.admin_kyc_approved,
    deliveryAreas: (deliveryAreas ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      note: a.note,
      fee: Number(a.fee),
      state: a.state ?? null,
      city: a.city ?? null,
    })),
    shippingMode: (vendor.shipping_mode as DaylightStore["shippingMode"]) || "manual",
    fontPairing: isStoreFontPairing(vendor.store_font) ? vendor.store_font : "modern",
  }

  return { store, items }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const vendor = await getVendorBySlug(slug)
  if (!vendor) return {}

  const name = vendor.business_name || vendor.full_name || "Store"
  const description = vendor.store_bio || `Shop ${name} on Blaqora — pay securely by card, transfer or USSD.`
  const image = vendor.store_cover_image_url || vendor.profile_image || vendor.store_logo_url

  return {
    title: `${name} | Blaqora store`,
    description,
    openGraph: {
      title: name,
      description,
      url: `${APP_URL}/${slug}`,
      siteName: "Blaqora",
      images: image ? [{ url: image, width: 1200, height: 630, alt: name }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const vendor = await getVendorBySlug(slug)
  if (!vendor) notFound()

  const template = vendor.store_template || "daylight"
  if (!VALID_TEMPLATES.includes(template as (typeof VALID_TEMPLATES)[number])) {
    redirect(`/store/${vendor.id}`)
  }

  const data = await loadStorefrontData(slug)
  if (!data) notFound()

  if (template === "editorial") {
    return <EditorialStorefront store={data.store} items={data.items} />
  }
  if (template === "studio") {
    return <StudioStorefront store={data.store} items={data.items} />
  }
  if (template === "boutique") {
    return <BoutiqueStorefront store={data.store} items={data.items} />
  }
  if (template === "ora") {
    return <OraStorefront store={data.store} items={data.items} />
  }
  return <DaylightStorefront store={data.store} items={data.items} />
}
