const BASE_URL = "https://api.paystack.co"

async function paystackFetch(method: string, path: string, body?: object) {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured")

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return res.json()
}

export interface InitializeTransactionParams {
  email: string
  amount: number // naira
  currency?: string
  metadata?: object
  callbackUrl: string
  reference?: string
}

export async function initializeTransaction(params: InitializeTransactionParams) {
  return paystackFetch("POST", "/transaction/initialize", {
    email: params.email,
    amount: Math.round(params.amount * 100), // Paystack expects kobo
    currency: params.currency ?? "NGN",
    metadata: params.metadata,
    callback_url: params.callbackUrl,
    ...(params.reference ? { reference: params.reference } : {}),
  })
}

export async function verifyTransaction(reference: string) {
  return paystackFetch("GET", `/transaction/verify/${encodeURIComponent(reference)}`)
}
