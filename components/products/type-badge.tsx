import type { CSSProperties } from "react"

export const ITEM_TYPE_LABELS: Record<string, string> = {
  physical: "Product",
  digital: "Digital",
  event: "Tickets",
  appointment: "Booking",
}

// Category colours from the design system: tickets coral, bookings violet,
// products amber, digital green.
const TOKENS: Record<string, string> = { physical: "prod", digital: "dig", event: "tix", appointment: "book" }

/** Small pill naming an item type. type=null means "all types". */
export function TypeBadge({ type, className = "" }: { type: string | null; className?: string }) {
  const token = type ? TOKENS[type] : null
  const style: CSSProperties = token
    ? { background: `var(--bq-${token}-50)`, color: `var(--bq-${token}-ink)` }
    : { background: "var(--bq-bg-soft)", color: "var(--bq-ink-2)" }
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      style={style}
    >
      {type ? ITEM_TYPE_LABELS[type] ?? type : "All types"}
    </span>
  )
}
