/**
 * Input validation utilities
 * Provides reusable validation functions for API routes
 */

import { z } from "zod"

// Physical product variant: a size and/or a colour option, each with its own stock
export const productVariantSchema = z
  .object({
    size: z.string().min(1).max(50).optional(),
    color_name: z.string().min(1).max(50).optional(),
    color_hex: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    stock_quantity: z.number().int().min(0).default(0),
    sku: z.string().max(100).optional(),
  })
  .refine((v) => v.size || v.color_name, {
    message: "Each variant needs a size or a colour",
  })

// Event ticket tier: a named price tier with an optional capacity
export const ticketTierSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0),
  quantity_total: z.number().int().positive().nullable().optional(),
})

// Product validation schema
export const productSchema = z.object({
  product_type: z.enum(["digital", "event", "physical", "appointment"]),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().min(0).optional(),
  compare_at_price: z.number().min(0).optional(),
  category: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  images: z.array(z.string().url()).default([]),
  // Physical products
  variants: z.array(productVariantSchema).optional(),
  // Event tickets
  ticket_tiers: z.array(ticketTierSchema).optional(),
  // Appointments/bookings — discrete times offered on each available day
  time_slots: z.array(z.string()).optional(),
})

// Checkout validation schema
export const checkoutSchema = z.object({
  customer_name: z.string().min(1).max(200),
  customer_email: z.string().email(),
  customer_phone: z.string().min(7).max(20),
  delivery_method: z.enum(["delivery", "pickup"]).optional(),
  delivery_area: z.string().max(200).optional(),
  delivery_address: z.string().max(500).optional(),
  customer_note: z.string().max(1000).optional(),
})

// Withdrawal validation schema
export const withdrawalSchema = z.object({
  amount: z.number().positive(),
  bank_name: z.string().min(1),
  account_number: z.string().min(10).max(10),
  account_name: z.string().min(1),
})

// Platform settings validation schema
export const platformSettingsSchema = z.object({
  commission_percentage: z.number().min(0).max(100),
  minimum_withdrawal_amount: z.number().min(0),
})

// Pricing plan validation schema
export const pricingPlanSchema = z.object({
  plan_key: z.enum(["free", "starter", "pro"]),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  monthly_fee: z.number().min(0),
  transaction_fee_percentage: z.number().min(0).max(100),
  transaction_fee_fixed: z.number().min(0),
  product_limit: z.number().int().positive().nullable(),
  allowed_selling_types: z.array(z.enum(["digital", "event", "physical", "appointment"])).min(1),
  features: z.array(z.string()),
  is_popular: z.boolean().default(false),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
})

/**
 * Validate request body against schema
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      return { success: false, error: errorMessage }
    }
    return { success: false, error: "Validation failed" }
  }
}
