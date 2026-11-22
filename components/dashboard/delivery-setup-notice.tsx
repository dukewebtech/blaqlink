"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Truck } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Warns a vendor that buyers can only pick up physical items until a delivery
 * area is added. `when="always"` shows it even before any physical product
 * exists (used in the product form).
 */
export function DeliverySetupNotice({ when = "has-physical" }: { when?: "has-physical" | "always" }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/delivery-areas/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return
        setShow(!d.hasDeliveryOptions && (when === "always" || d.hasPhysicalProducts))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [when])

  if (!show) return null
  return (
    <div
      role="note"
      className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
      style={{
        background: "var(--bq-warning-50)",
        color: "var(--bq-warning-ink)",
        borderColor: "color-mix(in srgb, var(--bq-warning) 35%, transparent)",
      }}
    >
      <Truck className="h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Buyers can't get your items delivered yet</p>
        <p>Add at least one delivery area with its fee. Until then, buyers can only choose pickup at checkout.</p>
      </div>
      <Button asChild size="sm" className="shrink-0 whitespace-nowrap">
        <Link href="/shipping">Add delivery area</Link>
      </Button>
    </div>
  )
}
