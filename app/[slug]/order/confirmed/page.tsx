"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { createCartStore } from "@/lib/cart-store"
import type { PublicOrderSummary } from "@/lib/storefront/confirm-paystack-payment"
import { DaylightIconSprite } from "@/components/store/templates/daylight-icons"
import { EditorialIconSprite } from "@/components/store/templates/editorial-icons"
import "@/components/store/templates/daylight-storefront.css"
import "@/components/store/templates/editorial-storefront.css"
import "@/components/store/templates/studio-storefront.css"
import "@/components/store/templates/boutique-storefront.css"
import "@/components/store/templates/ora-storefront.css"

type ConfirmTemplate = "daylight" | "editorial" | "studio" | "boutique" | "ora"

type Summary = PublicOrderSummary

const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 10

function formatBooking(date: string, time: string) {
  const day = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${date}T12:00:00+01:00`),
  )
  return `${day} at ${time}`
}

export default function OrderConfirmedPage({ params: paramsProp }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(paramsProp)
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference") ?? searchParams.get("trxref")
  const storeId = searchParams.get("store")
  const templateParam = searchParams.get("template")
  const template: ConfirmTemplate =
    templateParam === "editorial" || templateParam === "studio" || templateParam === "boutique" || templateParam === "ora"
      ? templateParam
      : "daylight"
  const [status, setStatus] = useState<"loading" | "pending" | "success" | "error">("loading")
  const [order, setOrder] = useState<Summary | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!reference) {
      setStatus("error")
      setError("We couldn't find a payment reference in this link. If you paid, check your email for your receipt.")
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function check(poll: number) {
      try {
        const res = await fetch(`/api/payment/verify?reference=${encodeURIComponent(reference!)}`, { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (res.status === 202) {
          if (poll + 1 >= MAX_POLLS) {
            setStatus("pending")
            return
          }
          setStatus("pending")
          timer = setTimeout(() => check(poll + 1), POLL_INTERVAL_MS)
          return
        }
        if (!res.ok || !data.order) throw new Error(data.error || "We couldn't confirm this payment.")
        setOrder(data.order)
        setStatus("success")
        if (storeId) createCartStore(storeId).clearCart()
      } catch (err) {
        if (cancelled) return
        setStatus("error")
        setError(err instanceof Error ? err.message : "We couldn't confirm this payment.")
      }
    }
    check(0)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [reference, storeId, attempt])

  const storeName = order?.store.name || "the seller"
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

  if (status === "loading" || status === "pending") {
    const stillWaiting = status === "pending"
    return (
      <div className={rootClass} style={{ display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center", padding: 24 }}>
        <div role="status" aria-live="polite" style={{ maxWidth: 420 }}>
          <b style={{ fontSize: 20 }}>{stillWaiting ? "Your payment is still being confirmed" : "Confirming your payment…"}</b>
          <p style={{ marginTop: 8, color: "var(--body)" }}>
            {stillWaiting
              ? "Your money is safe. Some banks take a few minutes. You'll get an email as soon as it's confirmed, so you can close this page."
              : "This usually takes a few seconds. Please don't pay again."}
          </p>
          {stillWaiting && (
            <button type="button" className="btn btn--accent" style={{ marginTop: 16, display: "inline-flex" }} onClick={() => setAttempt((n) => n + 1)}>
              Check again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (status === "error" || !order) {
    return (
      <div className={rootClass} style={{ display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center", padding: 24 }}>
        <div role="alert" style={{ maxWidth: 420 }}>
          <b style={{ fontSize: 20 }}>We couldn&apos;t confirm this payment</b>
          <p style={{ marginTop: 8, color: "var(--body)" }}>{error}</p>
          {reference && (
            <p style={{ marginTop: 8, color: "var(--soft)", fontSize: 14 }}>
              Reference: <span style={{ fontFamily: "monospace" }}>{reference}</span>. Please don&apos;t pay again before checking your email.
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            <button type="button" className="btn btn--accent" onClick={() => { setStatus("loading"); setAttempt((n) => n + 1) }}>
              Try again
            </button>
            <Link href={`/${slug}`} className="btn btn--ghost">
              Back to store
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const hasDigital = order.items.some((i) => i.type === "digital")
  const hasTicket = order.items.some((i) => i.type === "event")
  const bookings = order.items.filter((i) => i.type === "appointment" && i.appointmentDate && i.appointmentTime)
  const hasPhysical = order.items.some((i) => i.type === "physical")

  const next: string[] = []
  if (hasDigital) next.push(`Your download link is on its way to ${order.emailHint}.`)
  if (hasTicket) next.push(`Your QR tickets are on their way to ${order.emailHint}. Each code works once at the entrance.`)
  for (const b of bookings) next.push(`You're booked for ${b.title}: ${formatBooking(b.appointmentDate!, b.appointmentTime!)} (Lagos time).`)
  if (hasPhysical) next.push(`${storeName} will pack your order and send you an update.`)
  next.push(`Your receipt has been sent to ${order.emailHint}. Keep your reference in case you need to contact ${storeName}.`)

  const ref = order.reference || reference || ""
  const waHref = order.store.whatsapp ? `https://wa.me/${order.store.whatsapp}?text=${encodeURIComponent(`Hi ${storeName}, my order ${ref}`)}` : null

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
            <p>Thank you, {order.firstName}. {storeName} has your order.</p>
            <span className="done__ref">
              {ref}
              <button type="button" onClick={() => navigator.clipboard?.writeText(ref)}>Copy</button>
            </span>
            <div className="next">
              <b>What happens next</b>
              <ol>
                {next.map((n, i) => (
                  <li key={i}>{n}</li>
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
          <p>Thank you, {order.firstName}. {storeName} has your order.</p>
          <span className="done__ref">
            {ref}
            <button type="button" onClick={() => navigator.clipboard?.writeText(ref)}>Copy</button>
          </span>
          <div className="next">
            <b>What happens next</b>
            <ol>
              {next.map((n, i) => (
                <li key={i}>{n}</li>
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
