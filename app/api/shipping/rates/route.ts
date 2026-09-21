import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getQuotes as getTerminalQuotes } from "@/lib/shipping/terminal-africa"
import { fetchRates as fetchShipbubbleRates, validateAddress, getPackageCategories } from "@/lib/shipping/shipbubble"

interface RateRequestBody {
  storeId: string
  items: { product_id: string; quantity: number }[]
  dropoff: {
    name: string
    phone: string
    email: string
    address: string
    state: string
    city: string
    postalCode?: string
  }
}

export interface NormalizedRate {
  id: string // opaque id to hand back at checkout — a rate_id (Terminal) or courier_id (Shipbubble)
  carrierName: string
  carrierLogo: string | null
  amount: number
  etaLabel: string | null
}

const QUOTE_TTL_MS = 15 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const body: RateRequestBody = await request.json()
    const { storeId, items, dropoff } = body

    if (!storeId || !items?.length || !dropoff) {
      return NextResponse.json({ error: "storeId, items and dropoff are required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: vendor } = await supabase
      .from("users")
      .select(
        "id, business_name, full_name, email, phone, shipping_mode, pickup_street, pickup_city, pickup_state, pickup_phone, pickup_line2, pickup_postal_code, shipbubble_sender_address_code, terminal_africa_api_key, shipbubble_api_key, default_parcel_weight_kg",
      )
      .eq("id", storeId)
      .maybeSingle()

    if (!vendor) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }
    if (vendor.shipping_mode === "manual") {
      return NextResponse.json({ error: "This store does not use live shipping rates" }, { status: 400 })
    }
    if (!vendor.pickup_street || !vendor.pickup_city || !vendor.pickup_state) {
      return NextResponse.json({ error: "This store hasn't finished setting up their pickup address yet" }, { status: 422 })
    }
    // Terminal Africa rejects a persisted address without these on top of street/city/state.
    if (
      vendor.shipping_mode === "terminal_africa" &&
      (!vendor.pickup_line2 || !vendor.pickup_phone || !vendor.pickup_postal_code)
    ) {
      return NextResponse.json({ error: "This store hasn't finished setting up their pickup address yet" }, { status: 422 })
    }
    const apiKey = vendor.shipping_mode === "terminal_africa" ? vendor.terminal_africa_api_key : vendor.shipbubble_api_key
    if (!apiKey) {
      return NextResponse.json({ error: "This store hasn't added their shipping API key yet" }, { status: 422 })
    }

    const productIds = [...new Set(items.map((i) => i.product_id))]
    const { data: products } = await supabase
      .from("products")
      .select("id, title, price, weight_kg, length_cm, width_cm, height_cm")
      .in("id", productIds)

    if (!products || products.length !== productIds.length) {
      return NextResponse.json({ error: "One of the items in your cart is no longer available" }, { status: 409 })
    }

    // A product's own weight always wins; the vendor's default only fills the gap.
    const defaultWeightKg = vendor.default_parcel_weight_kg ? Number(vendor.default_parcel_weight_kg) : null
    const missingWeight = !defaultWeightKg && products.find((p) => !p.weight_kg)
    if (missingWeight) {
      return NextResponse.json(
        {
          error: `This store hasn't set a shipping weight for "${missingWeight.title}" yet, and has no default parcel weight configured`,
        },
        { status: 422 },
      )
    }

    let maxLength = 0
    let maxWidth = 0
    let maxHeight = 0
    for (const product of products) {
      maxLength = Math.max(maxLength, Number(product.length_cm) || 0)
      maxWidth = Math.max(maxWidth, Number(product.width_cm) || 0)
      maxHeight = Math.max(maxHeight, Number(product.height_cm) || 0)
    }

    const vendorName = vendor.business_name || vendor.full_name || "Store"

    let rates: NormalizedRate[]
    let requestToken: string | null = null

    if (vendor.shipping_mode === "terminal_africa") {
      const [firstName, ...rest] = vendorName.split(" ")
      const quotes = await getTerminalQuotes(
        apiKey,
        {
          firstName: firstName || vendorName,
          lastName: rest.join(" ") || "Store",
          email: vendor.email || undefined,
          phone: vendor.pickup_phone || vendor.phone || undefined,
          line1: vendor.pickup_street,
          line2: vendor.pickup_line2 || undefined,
          city: vendor.pickup_city,
          state: vendor.pickup_state,
          zip: vendor.pickup_postal_code || undefined,
        },
        {
          firstName: dropoff.name.split(" ")[0] || dropoff.name,
          lastName: dropoff.name.split(" ").slice(1).join(" ") || dropoff.name,
          email: dropoff.email,
          phone: dropoff.phone,
          line1: dropoff.address,
          line2: dropoff.address,
          city: dropoff.city,
          state: dropoff.state,
          zip: dropoff.postalCode || undefined,
        },
        {
          description: `${items.length} item(s) from ${vendorName}`,
          items: products.map((p) => ({
            name: p.title,
            description: p.title,
            weightKg: Number(p.weight_kg || defaultWeightKg),
            valueNaira: Number(p.price),
            quantity: items.find((i) => i.product_id === p.id)?.quantity ?? 1,
          })),
        },
      )
      rates = quotes.map((q) => ({
        id: q.rateId,
        carrierName: q.carrierName,
        carrierLogo: q.carrierLogo,
        amount: q.amount,
        etaLabel: q.deliveryTime,
      }))
    } else {
      if (!vendor.shipbubble_sender_address_code) {
        return NextResponse.json(
          { error: "This store hasn't validated their pickup address with Shipbubble yet" },
          { status: 422 },
        )
      }

      const receiver = await validateAddress(apiKey, {
        name: dropoff.name,
        email: dropoff.email,
        phone: dropoff.phone,
        address: `${dropoff.address}, ${dropoff.city}, ${dropoff.state}`,
      })

      const categories = await getPackageCategories(apiKey)
      const category =
        categories.find((c) => /general|accessor|fashion/i.test(c.name)) || categories[0]
      if (!category) {
        return NextResponse.json({ error: "Shipbubble has no package categories configured" }, { status: 502 })
      }

      const result = await fetchShipbubbleRates(apiKey, {
        senderAddressCode: Number(vendor.shipbubble_sender_address_code),
        receiverAddressCode: receiver.addressCode,
        pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        categoryId: category.categoryId,
        items: products.map((p) => ({
          name: p.title,
          description: p.title,
          unitWeightKg: Number(p.weight_kg || defaultWeightKg),
          unitAmountNaira: Number(p.price),
          quantity: items.find((i) => i.product_id === p.id)?.quantity ?? 1,
        })),
        dimensionsCm: { length: maxLength || 10, width: maxWidth || 10, height: maxHeight || 10 },
      })

      requestToken = result.requestToken
      rates = result.rates.map((r) => ({
        id: r.courierId,
        carrierName: r.courierName,
        carrierLogo: r.courierLogo,
        amount: r.amount,
        etaLabel: r.deliveryEta,
      }))
    }

    if (rates.length === 0) {
      return NextResponse.json({ error: "No delivery options are available for this address right now" }, { status: 422 })
    }

    const quoteId = crypto.randomUUID()
    await supabase.from("shipping_rate_quotes").insert({
      id: quoteId,
      store_id: storeId,
      provider: vendor.shipping_mode,
      rates,
      request_token: requestToken,
    })

    // Best-effort cleanup of stale quotes — never blocks the response.
    supabase
      .from("shipping_rate_quotes")
      .delete()
      .lt("created_at", new Date(Date.now() - QUOTE_TTL_MS).toISOString())
      .then(() => {})

    return NextResponse.json({ quoteId, provider: vendor.shipping_mode, rates })
  } catch (error) {
    console.error("[shipping/rates] Error:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch delivery rates"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
