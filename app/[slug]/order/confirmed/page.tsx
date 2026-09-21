"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { createCartStore } from "@/lib/cart-store"
import { DaylightIconSprite } from "@/components/store/templates/daylight-icons"
import { EditorialIconSprite } from "@/components/store/templates/editorial-icons"
import "@/components/store/templates/daylight-storefront.css"
import "@/components/store/templates/editorial-storefront.css"
import "@/components/store/templates/studio-storefront.css"
import "@/components/store/templates/boutique-storefront.css"
import "@/components/store/templates/ora-storefront.css"

type ConfirmTemplate = "daylight" | "editorial" | "studio" | "boutique" | "ora"

interface VerifiedOrder {
  id: string
  customer_name: string
  customer_email: string
  total_amount: number
  payment_reference: string
  items: { product_type: string; product_title: string; quantity: number }[]
}

interface VerifiedVendor {
  business_name?: string | null
  full_name?: string | null
  phone?: string | null
}

export default function OrderConfirmedPage({ params: paramsProp }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(paramsProp)
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const storeId = searchParams.get("store")
  const templateParam = searchParams.get("template")
  const template: ConfirmTemplate =
    templateParam === "editorial" || templateParam === "studio" || templateParam === "boutique" || templateParam === "ora"
      ? templateParam
      : "daylight"
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [order, setOrder] = useState<VerifiedOrder | null>(null)
  const [vendor, setVendor] = useState<VerifiedVendor | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!reference) {
      setStatus("error")
      setError("Payment reference not found")
      return
    }
    fetch(`/api/payment/verify?reference=${reference}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Payment verification failed")
        setOrder(data.order)
        setVendor(data.vendor)
        setStatus("success")
        if (storeId) createCartStore(storeId).clearCart()
      })
      .catch((err) => {
        setStatus("error")
        setError(err.message || "Failed to verify payment")
      })
  }, [reference, storeId])

  const storeName = vendor?.business_name || vendor?.full_name || "the seller"
  const rootClass =
    template === "editorial"
      ? "editorial-store"
      : template === "studio"
        ? "studio-store"
        : template === "boutique"
          ? "boutique-store"
          : template === "ora"
            ? "ora-store"
            : "daylight-store"

  if (status === "loading") {
    return (
      <div className={rootClass} style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--soft)", fontWeight: 600 }}>Confirming your payment…</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className={rootClass} style={{ display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center", padding: 24 }}>
        <div>
          <b style={{ fontSize: 20 }}>We couldn&apos;t confirm this payment</b>
          <p style={{ marginTop: 8, color: "var(--body)" }}>{error}</p>
          <Link href={`/${slug}`} className="btn btn--accent" style={{ marginTop: 16, display: "inline-flex" }}>
            Back to store
          </Link>
        </div>
      </div>
    )
  }

  const hasDigital = order?.items.some((i) => i.product_type === "digital")
  const hasTicket = order?.items.some((i) => i.product_type === "event")
  const hasBooking = order?.items.some((i) => i.product_type === "appointment")
  const hasPhysical = order?.items.some((i) => i.product_type === "physical")

  const next: string[] = []
  if (hasDigital) next.push(`Your download is already in your inbox at <b>${order?.customer_email}</b>.`)
  if (hasTicket) next.push("Your QR ticket has been emailed. Show it at the gate.")
  if (hasBooking) next.push(template === "editorial" ? `${storeName} will confirm your session on WhatsApp.` : `${storeName} will confirm your slot on WhatsApp shortly.`)
  if (hasPhysical) next.push(template === "editorial" ? `${storeName} packs your order and sends a tracking update.` : `${storeName} will pack your order and send a tracking update.`)
  next.push(template === "editorial" ? "Keep this reference in case you need to check on the order." : "Keep your reference safe in case you need to check on the order.")

  const ref = order?.payment_reference ?? reference ?? ""
  const waHref = vendor?.phone ? `https://wa.me/${vendor.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${storeName}, my order ${ref}`)}` : null

  if (template === "editorial") {
    return (
      <div className="editorial-store">
        <EditorialIconSprite />
        <div className="wrap" style={{ minHeight: "100vh" }}>
          <div className="done">
            <div className="done__mark">
              <svg className="i"><use href="#ed-i-check" /></svg>
              <i /><i /><i /><i /><i /><i />
            </div>
            <h2>Payment received</h2>
            <p>Thank you, {order?.customer_name?.split(" ")[0]}. {storeName} has your order.</p>
            <span className="done__ref">
              {ref}
              <button type="button" onClick={() => navigator.clipboard?.writeText(ref)}>Copy</button>
            </span>
            <div className="next">
              <b>What happens next</b>
              <ol>
                {next.map((n, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: n }} />
                ))}
              </ol>
            </div>
            {waHref && (
              <a className="btn btn--wa btn--block" href={waHref} target="_blank" rel="noreferrer" style={{ marginTop: 24 }}>
                <svg className="i"><use href="#ed-i-wa" /></svg>Message {storeName}
              </a>
            )}
            <Link href={`/${slug}`} className="btn btn--line btn--block" style={{ marginTop: 10 }}>Continue shopping</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={rootClass}>
      <DaylightIconSprite />
      <div className="shell" style={{ minHeight: "100vh" }}>
        <div className="done is-on">
          <div className="done__ring">
            <svg className="i"><use href="#dl-i-check" /></svg>
            <i /><i /><i /><i /><i /><i />
          </div>
          <h2>Payment received</h2>
          <p>Thank you, {order?.customer_name?.split(" ")[0]}. {storeName} has your order.</p>
          <span className="done__ref">
            {ref}
            <button type="button" onClick={() => navigator.clipboard?.writeText(ref)}>Copy</button>
          </span>
          <div className="next">
            <b>What happens next</b>
            <ol>
              {next.map((n, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: n }} />
              ))}
            </ol>
          </div>
        </div>
        <div className="done__btns">
          {waHref && (
            <a className="btn btn--wa btn--block" href={waHref} target="_blank" rel="noreferrer">
              <svg className="i"><use href="#dl-i-wa" /></svg>Message {storeName}
            </a>
          )}
          <Link href={`/${slug}`} className="btn btn--ghost btn--block">Continue shopping</Link>
        </div>
      </div>
    </div>
  )
}
