const LIVE_BASE_URL = "https://api.terminal.africa/v1"
const SANDBOX_BASE_URL = "https://sandbox.terminal.africa/v1"

// Terminal Africa's keys are prefixed (sk_test_.../sk_live_...), and test keys
// are only accepted on the sandbox host — unlike Shipbubble, where the same
// URL serves both. Picking the host from the key means vendors don't have to
// separately flag which environment they're in, and it self-corrects the
// moment they swap in a live key.
function baseUrlFor(apiKey: string): string {
  return apiKey.startsWith("sk_test_") ? SANDBOX_BASE_URL : LIVE_BASE_URL
}

async function terminalFetch(apiKey: string, method: string, path: string, body?: object) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`${baseUrlFor(apiKey)}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    })
    const data = await res.json()
    if (!res.ok || data.status === false) {
      throw new Error(data.message || `Terminal Africa request failed (${res.status})`)
    }
    return data
  } finally {
    clearTimeout(timeout)
  }
}

export interface TerminalAddress {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  line1: string
  line2?: string
  city: string
  state: string
  zip?: string
  country?: string // ISO 2, defaults to NG
}

export interface TerminalParcelItem {
  name: string
  description: string
  weightKg: number
  valueNaira: number
  quantity: number
}

export interface TerminalParcel {
  description: string
  items: TerminalParcelItem[]
}

export interface TerminalRate {
  rateId: string
  carrierName: string
  carrierLogo: string | null
  amount: number
  currency: string
  deliveryTime: string | null
}

// Terminal rejects any phone not in E.164 form ("Phone Number does not match
// address country") — shoppers and vendors both typically type local format.
function toE164Nigeria(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("234")) return `+${digits}`
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`
  return `+234${digits}`
}

function toAddressPayload(a: TerminalAddress) {
  return {
    first_name: a.firstName,
    last_name: a.lastName,
    email: a.email,
    phone: a.phone ? toE164Nigeria(a.phone) : undefined,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    zip: a.zip,
    country: a.country || "NG",
  }
}

/**
 * One-shot rate quote — no separate address/shipment creation needed first.
 * `persist_data: true` makes the returned rate_id directly bookable via
 * bookShipment(), per Terminal's docs.
 */
export async function getQuotes(
  apiKey: string,
  pickup: TerminalAddress,
  delivery: TerminalAddress,
  parcel: TerminalParcel,
): Promise<TerminalRate[]> {
  const data = await terminalFetch(apiKey, "POST", "/rates/shipment/quotes", {
    pickup_address: toAddressPayload(pickup),
    delivery_address: toAddressPayload(delivery),
    parcel: {
      description: parcel.description,
      weight_unit: "kg",
      items: parcel.items.map((i) => ({
        name: i.name,
        description: i.description,
        currency: "NGN",
        value: i.valueNaira,
        weight: i.weightKg,
        quantity: i.quantity,
      })),
    },
    currency: "NGN",
    persist_data: true,
  })

  const rates: any[] = Array.isArray(data.data) ? data.data : (data.data?.rates ?? [])
  return rates.map((r) => ({
    rateId: r.id,
    carrierName: r.carrier_name,
    carrierLogo: r.carrier_logo ?? null,
    amount: Number(r.amount),
    currency: r.currency || "NGN",
    deliveryTime: r.delivery_time ?? null,
  }))
}

export interface TerminalBookingResult {
  shipmentId: string
  trackingNumber: string | null
  trackingUrl: string | null
}

/** Books the chosen rate. Omitting shipment_id/dropoff_id lets Terminal auto-generate a shipment from the persisted quote. */
export async function bookShipment(apiKey: string, rateId: string): Promise<TerminalBookingResult> {
  const data = await terminalFetch(apiKey, "POST", "/shipments/pickup", {
    rate_id: rateId,
    duty_payer: "sender",
  })

  return {
    shipmentId: data.data.shipment_id,
    trackingNumber: data.data.extras?.tracking_number ?? null,
    trackingUrl: data.data.extras?.tracking_url ?? null,
  }
}
