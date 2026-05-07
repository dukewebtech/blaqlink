const BASE_URL = process.env.KORA_BASE_URL || "https://api.korapay.com/merchant/api/v1"

// Maps common Nigerian bank names (lowercase) → KoraPay bank codes
const BANK_CODES: Record<string, string> = {
  "access bank": "044",
  "access bank (diamond)": "063",
  "citibank": "023",
  "ecobank": "050",
  "fidelity bank": "070",
  "first bank": "011",
  "first bank of nigeria": "011",
  "fcmb": "214",
  "first city monument bank": "214",
  "gtbank": "058",
  "guaranty trust bank": "058",
  "heritage bank": "030",
  "jaiz bank": "301",
  "keystone bank": "082",
  "kuda": "090267",
  "kuda bank": "090267",
  "moniepoint": "090405",
  "moniepoint mfb": "090405",
  "opay": "999992",
  "palmpay": "999991",
  "parallex bank": "104",
  "polaris bank": "076",
  "providus bank": "101",
  "stanbic ibtc": "221",
  "stanbic ibtc bank": "221",
  "standard chartered": "068",
  "sterling bank": "232",
  "titan trust bank": "102",
  "uba": "033",
  "united bank for africa": "033",
  "union bank": "032",
  "union bank of nigeria": "032",
  "vfd bank": "566",
  "wema bank": "035",
  "zenith bank": "057",
  "carbon": "565",
}

export function getBankCode(bankName: string): string | null {
  return BANK_CODES[bankName.toLowerCase().trim()] ?? null
}

async function koraFetch(method: string, path: string, body?: object) {
  const key = process.env.KORA_SECRET_KEY
  if (!key) throw new Error("KORA_SECRET_KEY is not configured")

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

export interface KoraChargeParams {
  reference: string
  amount: number
  currency?: string
  customerEmail: string
  customerName: string
  redirectUrl: string
  notificationUrl?: string
  metadata?: Record<string, unknown>
}

function isLocalhost(url: string) {
  return url.startsWith("http://localhost") || url.startsWith("http://127.")
}

export async function initializeCharge(params: KoraChargeParams) {
  // KoraPay metadata values must all be primitives (string | number | boolean).
  // Flatten nested objects/arrays by JSON-stringifying them under a single key.
  const flatMeta: Record<string, string | number | boolean> = { ref: params.reference }
  if (params.metadata && Object.keys(params.metadata).length > 0) {
    flatMeta.order_data = JSON.stringify(params.metadata)
  }

  const body: Record<string, unknown> = {
    reference: params.reference,
    amount: params.amount,
    currency: params.currency ?? "NGN",
    customer: { email: params.customerEmail, name: params.customerName },
    redirect_url: params.redirectUrl,
    metadata: flatMeta,
  }

  // KoraPay rejects localhost notification_url
  if (params.notificationUrl && !isLocalhost(params.notificationUrl)) {
    body.notification_url = params.notificationUrl
  }

  return koraFetch("POST", "/charges/initialize", body)
}

export async function verifyCharge(reference: string) {
  return koraFetch("GET", `/charges/${reference}`)
}

export interface KoraDisbursementParams {
  reference: string
  amount: number
  bankCode: string
  accountNumber: string
  accountName: string
  narration: string
  customerEmail?: string
}

export async function verifyDisbursement(reference: string) {
  return koraFetch("GET", `/transactions/${reference}`)
}

export async function resolveBankAccount(bankCode: string, accountNumber: string) {
  return koraFetch("POST", "/misc/banks/resolve", {
    bank: bankCode,
    account: accountNumber,
    currency: "NGN",
  })
}

export async function lookupNIN(nin: string) {
  return koraFetch("POST", "/misc/nin", { nin })
}

export async function initializeDisbursement(params: KoraDisbursementParams) {
  return koraFetch("POST", "/transactions/disburse", {
    reference: params.reference,
    destination: {
      type: "bank_account",
      amount: params.amount,
      currency: "NGN",
      narration: params.narration,
      bank_account: {
        bank: params.bankCode,
        account: params.accountNumber,
      },
      customer: {
        name: params.accountName,
        email: params.customerEmail ?? "vendor@blaqora.store",
      },
    },
  })
}
