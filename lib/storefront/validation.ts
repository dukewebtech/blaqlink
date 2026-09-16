/**
 * Checkout validation — copied exactly from the storefront templates
 * (storefront-templates/blaqora-storefront*.html, function validate()).
 * Same regexes, same thresholds, same error copy, for every template.
 */

// Matches 0XXXXXXXXXX or +234XXXXXXXXXX / 234XXXXXXXXXX, network prefix 7/8/9
export const NIGERIAN_PHONE_REGEX = /^(\+?234|0)[789]\d{9}$/
export const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/

export function isValidFullName(name: string): boolean {
  return name.trim().length >= 2
}

export function isValidNigerianPhone(phone: string): boolean {
  return NIGERIAN_PHONE_REGEX.test(phone.replace(/[\s-]/g, ""))
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

// The templates require "your full address, including a landmark" — enforced
// as a minimum length rather than parsing structure.
export function isValidAddress(address: string): boolean {
  return address.trim().length >= 10
}

export interface CheckoutDetailsInput {
  name: string
  phone: string
  email: string
}

export interface FieldError {
  field: "name" | "phone" | "email" | "address" | "state" | "city" | "area"
  message: string
}

/** Step 1 ("Your details") — exact rules and copy from the templates. */
export function validateDetailsStep(input: CheckoutDetailsInput, storeName = "the seller"): FieldError[] {
  const errors: FieldError[] = []
  if (!isValidFullName(input.name)) {
    errors.push({ field: "name", message: `Enter your name so ${storeName} knows who to reach.` })
  }
  if (!isValidNigerianPhone(input.phone)) {
    errors.push({ field: "phone", message: "Enter a valid Nigerian phone number." })
  }
  if (!isValidEmail(input.email)) {
    errors.push({ field: "email", message: "Enter a valid email address." })
  }
  return errors
}

export interface DeliveryStepInput {
  needsDelivery: boolean
  method: "delivery" | "pickup"
  areaFee: number | null // null = no area chosen yet
  address: string
  state: string
  city: string
}

/**
 * Step 2 ("Delivery") — only runs when the cart needs delivery at all
 * (i.e. contains a physical product). Ticket/booking/digital-only carts
 * skip straight past this, matching the templates' "How to receive it" branch.
 */
export function validateDeliveryStep(input: DeliveryStepInput): FieldError[] {
  if (!input.needsDelivery) return []

  const errors: FieldError[] = []
  if (input.method === "delivery") {
    if (!isValidAddress(input.address)) {
      errors.push({ field: "address", message: "Add your full address, including a landmark." })
    }
    if (!input.state.trim()) {
      errors.push({ field: "state", message: "Select your state." })
    }
    if (!input.city.trim()) {
      errors.push({ field: "city", message: "Select your city." })
    }
    if (input.areaFee === null) {
      errors.push({ field: "area", message: "Choose your delivery area." })
    }
  }
  return errors
}
