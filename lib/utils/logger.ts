/**
 * Centralized logging utility
 * Automatically disabled in production
 */

const isDevelopment = process.env.NODE_ENV === "development"

export const logger = {
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log("[v0]", ...args)
    }
  },

  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error("[v0]", ...args)
    } else {
      // In production, send to monitoring service
      // TODO: Integrate with Sentry or similar
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn("[v0]", ...args)
    }
  },
}
