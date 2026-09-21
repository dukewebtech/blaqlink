const BASE_URL = "https://api.shipbubble.com/v1"

async function shipbubbleFetch(apiKey: string, method: string, path: string, body?: object) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    })
    const data = await res.json()
    if (!res.ok || data.status === "error") {
      throw new Error(data.message || `Shipbubble request failed (${res.status})`)
    }
    return data
  } finally {
    clearTimeout(timeout)
  }
}

export interface ShipbubblePackageCategory {
  categoryId: number
  name: string
}

/** Account-specific — Shipbubble requires a category_id per rate request, not a fixed constant. */
export async function getPackageCategories(apiKey: string): Promise<ShipbubblePackageCategory[]> {
  const data = await shipbubbleFetch(apiKey, "GET", "/shipping/labels/categories")
  const categories: any[] = data.data ?? []
  return categories.map((c) => ({ categoryId: c.category_id, name: c.category }))
}

export interface ShipbubbleAddressInput {
  name: string
  email: string
  phone: string
  address: string
}

export interface ShipbubbleValidatedAddress {
  addressCode: number
  formattedAddress: string
  city: string
  state: string
}

/** Validates and geocodes a free-text address into an address_code, the handle every other Shipbubble call needs. */
export async function validateAddress(apiKey: string, input: ShipbubbleAddressInput): Promise<ShipbubbleValidatedAddress> {
  const data = await shipbubbleFetch(apiKey, "POST", "/shipping/address/validate", {
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
  })

  return {
    addressCode: data.data.address_code,
    formattedAddress: data.data.formatted_address,
    city: data.data.city,
    state: data.data.state,
  }
}

export interface ShipbubblePackageItem {
  name: string
  description: string
  unitWeightKg: number
  unitAmountNaira: number
  quantity: number
}

export interface ShipbubbleRate {
  courierId: string
  courierName: string
  courierLogo: string | null
  amount: number
  currency: string
  pickupEta: string | null
  deliveryEta: string | null
  serviceType: string
  serviceCode: string | null
}

export interface ShipbubbleRatesResult {
  requestToken: string
  rates: ShipbubbleRate[]
}

/** Fetches live courier options between two already-validated addresses for the given parcel. */
export async function fetchRates(
  apiKey: string,
  params: {
    senderAddressCode: number
    receiverAddressCode: number
    pickupDate: string // yyyy-mm-dd
    categoryId: number
    items: ShipbubblePackageItem[]
    dimensionsCm: { length: number; width: number; height: number }
  },
): Promise<ShipbubbleRatesResult> {
  const data = await shipbubbleFetch(apiKey, "POST", "/shipping/fetch_rates", {
    sender_address_code: params.senderAddressCode,
    reciever_address_code: params.receiverAddressCode,
    pickup_date: params.pickupDate,
    category_id: params.categoryId,
    package_items: params.items.map((i) => ({
      name: i.name,
      description: i.description,
      unit_weight: i.unitWeightKg,
      unit_amount: i.unitAmountNaira,
      quantity: i.quantity,
    })),
    package_dimension: {
      length: params.dimensionsCm.length,
      width: params.dimensionsCm.width,
      height: params.dimensionsCm.height,
    },
  })

  const couriers: any[] = data.data?.couriers ?? []
  return {
    requestToken: data.data.request_token,
    rates: couriers.map((c) => ({
      courierId: c.courier_id,
      courierName: c.courier_name,
      courierLogo: c.courier_image ?? null,
      amount: Number(c.total ?? c.rate_card_amount),
      currency: c.currency || "NGN",
      pickupEta: c.pickup_eta_time ?? null,
      deliveryEta: c.delivery_eta_time ?? null,
      serviceType: c.service_type,
      serviceCode: c.service_code ?? null,
    })),
  }
}

export interface ShipbubbleLabelResult {
  orderId: string
  trackingUrl: string | null
}

/** Books the chosen courier, creating the shipping label. */
export async function createLabel(
  apiKey: string,
  requestToken: string,
  courierId: string,
  serviceCode?: string,
): Promise<ShipbubbleLabelResult> {
  const data = await shipbubbleFetch(apiKey, "POST", "/shipping/labels", {
    request_token: requestToken,
    courier_id: courierId,
    ...(serviceCode ? { service_code: serviceCode } : {}),
  })

  return {
    orderId: data.data.order_id,
    trackingUrl: data.data.tracking_url ?? null,
  }
}
