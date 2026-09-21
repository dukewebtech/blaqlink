import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { validateDetailsStep, validateDeliveryStep } from "@/lib/storefront/validation"
import { needsDelivery as computeNeedsDelivery } from "@/lib/storefront/delivery"
import { getDeliveryAreas } from "@/lib/storefront/delivery-server"
import { createCheckoutSession, type PendingOrderItem, type PendingOrderMetadata } from "@/lib/storefront/order-service"

interface CheckoutLineInput {
  product_id: string
  quantity: number
  product_variant_id?: string
  ticket_tier_id?: string
  appointment_date?: string
  appointment_time?: string
}

interface CheckoutRequestBody {
  storeId: string
  items: CheckoutLineInput[]
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
    const body: CheckoutRequestBody = await request.json()
    const { storeId, items, details } = body

    if (!storeId || !items?.length) {
      return NextResponse.json({ error: "storeId and items are required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: vendor } = await supabase
      .from("users")
      .select("id, business_name, full_name, email, shipping_mode")
      .eq("id", storeId)
      .maybeSingle()

    if (!vendor) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }
    const storeName = vendor.business_name || vendor.full_name || "the seller"

    // Never trust client-submitted prices — re-fetch every product/variant/tier server-side.
    const productIds = [...new Set(items.map((i) => i.product_id))]
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, price, product_type, status, user_id")
      .in("id", productIds)

    if (productsError || !products) {
      return NextResponse.json({ error: "Failed to load items" }, { status: 500 })
    }

    const resolvedItems: PendingOrderItem[] = []
    for (const line of items) {
      const product = products.find((p) => p.id === line.product_id)
      if (!product || product.user_id !== storeId || product.status !== "published") {
        return NextResponse.json({ error: "One of the items in your cart is no longer available" }, { status: 409 })
      }

      let unitPrice = Number(product.price ?? 0)
      let variantLabel: string | undefined
      let tierName: string | undefined

      if (line.product_variant_id) {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("id, size, color_name, stock_quantity, product_id")
          .eq("id", line.product_variant_id)
          .maybeSingle()
        if (!variant || variant.product_id !== product.id) {
          return NextResponse.json({ error: `Invalid option selected for ${product.title}` }, { status: 409 })
        }
        if (variant.stock_quantity < line.quantity) {
          return NextResponse.json({ error: `Not enough stock left for ${product.title}` }, { status: 409 })
        }
        variantLabel = [variant.size, variant.color_name].filter(Boolean).join(" / ")
      }

      if (line.ticket_tier_id) {
        const { data: tier } = await supabase
          .from("ticket_tiers")
          .select("id, name, price, quantity_total, quantity_sold, product_id")
          .eq("id", line.ticket_tier_id)
          .maybeSingle()
        if (!tier || tier.product_id !== product.id) {
          return NextResponse.json({ error: `Invalid ticket tier selected for ${product.title}` }, { status: 409 })
        }
        const left = tier.quantity_total == null ? Infinity : tier.quantity_total - tier.quantity_sold
        if (left < line.quantity) {
          return NextResponse.json({ error: `Not enough "${tier.name}" tickets left` }, { status: 409 })
        }
        unitPrice = Number(tier.price)
        tierName = tier.name
      }

      resolvedItems.push({
        product_id: product.id,
        product_title: product.title,
        product_type: product.product_type,
        quantity: line.quantity,
        price: unitPrice,
        subtotal: unitPrice * line.quantity,
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blaqora.store"
    const callbackUrl = body.callbackUrl || `${appUrl}/store/${storeId}/payment`

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
      metadata,
      email: details.email.trim(),
      amount: total,
      callbackUrl,
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error("[checkout/initialize] Error:", error)
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 })
  }
}
