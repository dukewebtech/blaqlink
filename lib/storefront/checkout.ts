import type { CartItem } from "@/lib/cart-store"
import { needsDelivery, resolveDeliveryFee } from "@/lib/storefront/delivery"
import { validateDeliveryStep, validateDetailsStep, type FieldError } from "@/lib/storefront/validation"

/** The three checkout steps, in the exact order and naming the templates use. */
export const CHECKOUT_STEPS = ["details", "delivery", "pay"] as const
export type CheckoutStep = (typeof CHECKOUT_STEPS)[number]

export const CHECKOUT_STEP_LABELS: Record<CheckoutStep, string> = {
  details: "Details",
  delivery: "Delivery",
  pay: "Pay",
}

export interface CheckoutState {
  name: string
  phone: string
  email: string
  method: "delivery" | "pickup"
  areaId: string | null
  areaName: string | null
  areaFee: number | null
  address: string
  addressState: string
  addressCity: string
  addressPostalCode: string
  note: string
}

export function createInitialCheckoutState(): CheckoutState {
  return {
    name: "",
    phone: "",
    email: "",
    method: "delivery",
    areaId: null,
    areaName: null,
    areaFee: null,
    address: "",
    addressState: "",
    addressCity: "",
    addressPostalCode: "",
    note: "",
  }
}

export interface CheckoutTotals {
  subtotal: number
  deliveryFee: number
  total: number
  needsDelivery: boolean
}

/** Mirrors the templates' `totals()` exactly: fee only applies when delivery is needed and chosen. */
export function computeTotals(items: CartItem[], state: CheckoutState): CheckoutTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const requiresDelivery = needsDelivery(items)
  const deliveryFee = requiresDelivery ? resolveDeliveryFee(state.method, state.areaFee) : 0
  return { subtotal, deliveryFee, total: subtotal + deliveryFee, needsDelivery: requiresDelivery }
}

/** Selecting "pickup" always zeroes the fee, exactly like the templates' data-method handler. */
export function setDeliveryMethod(state: CheckoutState, method: "delivery" | "pickup"): CheckoutState {
  return { ...state, method, ...(method === "pickup" ? { areaId: null, areaName: null, areaFee: 0 } : {}) }
}

export function chooseDeliveryArea(state: CheckoutState, area: { id: string; name: string; fee: number }): CheckoutState {
  return { ...state, areaId: area.id, areaName: area.name, areaFee: area.fee }
}

export function validateCheckoutStep(step: CheckoutStep, items: CartItem[], state: CheckoutState): FieldError[] {
  if (step === "details") {
    return validateDetailsStep({ name: state.name, phone: state.phone, email: state.email })
  }
  if (step === "delivery") {
    return validateDeliveryStep({
      needsDelivery: needsDelivery(items),
      method: state.method,
      areaFee: state.areaFee,
      address: state.address,
      state: state.addressState,
      city: state.addressCity,
    })
  }
  return []
}

/** What the "How to receive it" copy should say when the cart needs no delivery at all. */
export function noDeliveryFulfilmentHint(items: CartItem[]): "tickets" | "booking confirmation" | "files" {
  if (items.some((item) => item.product_type === "event")) return "tickets"
  if (items.some((item) => item.product_type === "appointment")) return "booking confirmation"
  return "files"
}
