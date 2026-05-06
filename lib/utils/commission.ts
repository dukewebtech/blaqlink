/**
 * Commission calculation utilities
 * Centralizes platform commission logic
 */

export interface CommissionResult {
  grossAmount: number
  commissionRate: number
  commissionAmount: number
  netAmount: number
}

/**
 * Calculate commission on a gross amount
 * @param grossAmount - Total revenue before commission
 * @param commissionRate - Commission percentage (e.g., 10 for 10%)
 * @returns Commission breakdown
 */
export function calculateCommission(grossAmount: number, commissionRate: number): CommissionResult {
  const commission = grossAmount * (commissionRate / 100)
  const netAmount = grossAmount - commission

  return {
    grossAmount,
    commissionRate,
    commissionAmount: commission,
    netAmount,
  }
}

/**
 * Calculate net revenue from gross (what vendor receives)
 */
export function calculateNetRevenue(grossRevenue: number, commissionRate: number): number {
  return grossRevenue * (1 - commissionRate / 100)
}

/**
 * Calculate gross revenue from net (reverse calculation)
 */
export function calculateGrossFromNet(netRevenue: number, commissionRate: number): number {
  return netRevenue / (1 - commissionRate / 100)
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
  }).format(amount)
}
