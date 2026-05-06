/**
 * Input validation utilities
 * Provides reusable validation functions for API routes
 */

import { z } from "zod"

// Product validation schema
export const productSchema = z.object({
  product_type: z.enum(["digital", "event", "physical", "appointment"]),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().min(0).optional(),
  category: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  images: z.array(z.string().url()).default([]),
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
