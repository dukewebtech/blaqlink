import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { validateDetailsStep, validateDeliveryStep } from "@/lib/storefront/validation"
import { needsDelivery as computeNeedsDelivery } from "@/lib/storefront/delivery"
import { getDeliveryAreas } from "@/lib/storefront/delivery-server"
import { createCheckoutSession, type PendingOrderItem, type PendingOrderMetadata } from "@/lib/storefront/order-service"
import { getAppUrl } from "@/lib/utils/app-url"
import { allowRequest, clientIp } from "@/lib/rate-limit"
import { bookingSlotError, parseCheckoutLines } from "@/lib/storefront/checkout-lines"

interface CheckoutRequestBody {
  storeId: string
  items: unknown
  details: {
    name: string
    phone: string
    email: string
    method: "delivery" | "pickup"
    areaId?: string
    // Live-rate checkout (Terminal Africa / Shipbubble): the quote returned by
    // /api/shipping/rates and the courier the shopper picked from it. Omitted
    // entirely for manual-mode stores (the default) — areaId is used instead.
    quoteId?: string
    rateId?: string
    address?: string
    state?: string
    city?: string
    postalCode?: string
    note?: string
  }
  callbackUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    if (!(await allowRequest(`checkout:${clientIp(request)}`, 600, 30, true))) {
      return NextResponse.json({ error: "Too many checkout attempts. Wait a few minutes and try again." }, { status: 429 })
    }

    const body: CheckoutRequestBody | null = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { storeId, details } = body
    if (typeof storeId !== "string" || !details || typeof details !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const parsed = parseCheckoutLines(body.items)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const lines = parsed.lines

    const supabase = createAdminClient()

    const { data: vendor } = await supabase
      .from("users")
      .select("id, business_name, full_name, email, shipping_mode, store_slug")
      .eq("id", storeId)
      .maybeSingle()

    if (!vendor) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }
    const storeName = vendor.business_name || vendor.full_name || "the seller"

    // Never trust the browser for prices, options or availability — every
    // line is re-resolved here. Stock, tickets and slots are then held
    // atomically by createCheckoutSession (reserve_checkout).
    const productIds = [...new Set(lines.map((i) => i.product_id))]
    const [{ data: products, error: productsError }, { data: variants }, { data: tiers }] = await Promise.all([
      supabase
        .from("products")
        .select("id, title, price, product_type, status, user_id, available_days, time_slots")
        .in("id", productIds),
      supabase.from("product_variants").select("id, product_id, size, color_name, price").in("product_id", productIds),
      supabase.from("ticket_tiers").select("id, product_id, name, price").in("product_id", productIds),
    ])

    if (productsError || !products) {
      return NextResponse.json({ error: "Failed to load items" }, { status: 500 })
    }

    const unavailable = (title?: string) =>
      NextResponse.json({ error: title ? `${title} is no longer available. Remove it from your bag.` : "One of the items in your bag is no longer available" }, { status: 409 })

    const resolvedItems: PendingOrderItem[] = []
    for (const line of lines) {
      const product = products.find((p) => p.id === line.product_id)
      if (!product || product.user_id !== storeId || product.status !== "published") return unavailable()

      let unitPrice = Number(product.price ?? 0)
      let variantLabel: string | undefined
      let tierName: string | undefined

      const productVariants = (variants ?? []).filter((v) => v.product_id === product.id)
      if (product.product_type === "physical" && productVariants.length > 0) {
        const variant = productVariants.find((v) => v.id === line.product_variant_id)
        if (!variant) return NextResponse.json({ error: `Choose a size or colour for ${product.title}.` }, { status: 409 })
        variantLabel = [variant.size, variant.color_name].filter(Boolean).join(" / ")
        // An option can cost more or less than the product; blank = product price.
        if (variant.price !== null && variant.price !== undefined) unitPrice = Number(variant.price)
      } else if (line.product_variant_id) {
        return NextResponse.json({ error: `Invalid option selected for ${product.title}` }, { status: 409 })
      }

      if (product.product_type === "event") {
        const productTiers = (tiers ?? []).filter((t) => t.product_id === product.id)
        if (productTiers.length === 0) return unavailable(product.title)
        const tier = productTiers.find((t) => t.id === line.ticket_tier_id)
        if (!tier) return NextResponse.json({ error: `Choose a ticket type for ${product.title}.` }, { status: 409 })
        unitPrice = Number(tier.price)
        tierName = tier.name
      } else if (line.ticket_tier_id) {
        return NextResponse.json({ error: `Invalid ticket type selected for ${product.title}` }, { status: 409 })
      }

      if (product.product_type === "appointment") {
        if (!line.appointment_date || !line.appointment_time) {
          return NextResponse.json({ error: `Pick a date and time for ${product.title}.` }, { status: 409 })
        }
        if (line.quantity !== 1) {
          return NextResponse.json({ error: `Each booking is for one session. Book ${product.title} once per time.` }, { status: 400 })
        }
        const slotError = bookingSlotError(product, line.appointment_date, line.appointment_time)
        if (slotError) return NextResponse.json({ error: slotError }, { status: 409 })
      } else if (line.appointment_date || line.appointment_time) {
        return NextResponse.json({ error: `Invalid booking time for ${product.title}` }, { status: 409 })
      }

      if (!(unitPrice > 0)) return unavailable(product.title)

      resolvedItems.push({
        product_id: product.id,
        product_title: product.title,
        product_type: product.product_type,
        quantity: line.quantity,
        price: unitPrice,
        subtotal: Math.round(unitPrice * line.quantity * 100) / 100,
        ...(line.product_variant_id && { product_variant_id: line.product_variant_id, variant_label: variantLabel }),
        ...(line.ticket_tier_id && { ticket_tier_id: line.ticket_tier_id, ticket_tier_name: tierName }),
        ...(line.appointment_date && { appointment_date: line.appointment_date }),
        ...(line.appointment_time && { appointment_time: line.appointment_time }),
      })
    }

    // Step 1 — details
    const detailErrors = validateDetailsStep(details, storeName)
    if (detailErrors.length > 0) {
      return NextResponse.json({ error: detailErrors[0].message, errors: detailErrors }, { status: 400 })
    }

    // Step 2 — delivery, only when the cart actually needs it (physical items present)
    const requiresDelivery = computeNeedsDelivery(resolvedItems.map((i) => ({ product_type: i.product_type })))
    let deliveryAreaName: string | null = null
    let deliveryFee = 0
    let shippingProvider: "terminal_africa" | "shipbubble" | null = null
    let shippingRateId: string | null = null
    let shippingRequestToken: string | null = null

    if (requiresDelivery && details.method === "delivery" && vendor.shipping_mode !== "manual") {
      // Live-rate checkout — never trust the client's quoted amount, re-verify
      // the chosen rate against what /api/shipping/rates actually cached.
      if (!details.quoteId || !details.rateId) {
        return NextResponse.json({ error: "Please choose a delivery option" }, { status: 400 })
      }
      const { data: quote } = await supabase
        .from("shipping_rate_quotes")
        .select("store_id, provider, rates, request_token, created_at")
        .eq("id", details.quoteId)
        .maybeSingle()

      const isExpired = quote && Date.now() - new Date(quote.created_at).getTime() > 15 * 60 * 1000
      if (!quote || quote.store_id !== storeId || isExpired) {
        return NextResponse.json({ error: "Your delivery options have expired — please pick delivery again" }, { status: 409 })
      }
      const rate = (quote.rates as { id: string; carrierName: string; amount: number }[]).find(
        (r) => r.id === details.rateId,
      )
      if (!rate) {
        return NextResponse.json({ error: "That delivery option is no longer available" }, { status: 409 })
      }
      const deliveryErrors = validateDeliveryStep({
        needsDelivery: true,
        method: "delivery",
        areaFee: rate.amount,
        address: details.address ?? "",
        state: details.state ?? "",
        city: details.city ?? "",
      })
      if (deliveryErrors.length > 0) {
        return NextResponse.json({ error: deliveryErrors[0].message, errors: deliveryErrors }, { status: 400 })
      }
      deliveryAreaName = rate.carrierName
      deliveryFee = rate.amount
      shippingProvider = quote.provider
      shippingRateId = rate.id
      shippingRequestToken = quote.request_token
    } else if (requiresDelivery && details.method === "delivery") {
      const areas = await getDeliveryAreas(storeId)
      const area = areas.find((a) => a.id === details.areaId)
      const deliveryErrors = validateDeliveryStep({
        needsDelivery: true,
        method: "delivery",
        areaFee: area?.fee ?? null,
        address: details.address ?? "",
        state: details.state ?? "",
        city: details.city ?? "",
      })
      if (deliveryErrors.length > 0) {
        return NextResponse.json({ error: deliveryErrors[0].message, errors: deliveryErrors }, { status: 400 })
      }
      deliveryAreaName = area!.name
      deliveryFee = area!.fee
    }

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0)
    const total = subtotal + deliveryFee

    // Built here, not taken from the browser, so a checkout can't send the
    // buyer anywhere else after paying. Only the template name is kept.
    const templateParam = (() => {
      try {
        return new URL(String(body.callbackUrl ?? ""), getAppUrl()).searchParams.get("template")
      } catch {
        return null
      }
    })()
    const callbackUrl = new URL(`${getAppUrl()}/${vendor.store_slug || vendor.id}/order/confirmed`)
    callbackUrl.searchParams.set("store", vendor.id)
    if (templateParam && /^[a-z]{3,20}$/.test(templateParam)) callbackUrl.searchParams.set("template", templateParam)

    const metadata: PendingOrderMetadata = {
      customer_name: details.name.trim(),
      customer_phone: details.phone.trim(),
      delivery_method: requiresDelivery ? details.method : null,
      delivery_area: requiresDelivery && details.method === "delivery" ? deliveryAreaName : null,
      delivery_address: requiresDelivery && details.method === "delivery" ? details.address?.trim() ?? null : null,
      delivery_state: requiresDelivery && details.method === "delivery" ? details.state?.trim() ?? null : null,
      delivery_city: requiresDelivery && details.method === "delivery" ? details.city?.trim() ?? null : null,
      delivery_postal_code: requiresDelivery && details.method === "delivery" ? details.postalCode?.trim() || null : null,
      customer_note: details.note?.trim() || null,
      items: resolvedItems,
      shipping_provider: shippingProvider,
      shipping_rate_id: shippingRateId,
      shipping_request_token: shippingRequestToken,
    }

    const session = await createCheckoutSession({
      vendorId: vendor.id,
      metadata,
      email: details.email.trim(),
      amount: Math.round(total * 100) / 100,
      callbackUrl: callbackUrl.toString(),
      lines,
    })
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status })
    }

    return NextResponse.json({ authorization_url: session.authorization_url, reference: session.reference })
  } catch (error) {
    console.error("[checkout/initialize] Error:", error)
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 })
  }
}
