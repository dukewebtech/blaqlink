"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createCartStore, type CartItem } from "@/lib/cart-store"
import { validateDetailsStep, validateDeliveryStep } from "@/lib/storefront/validation"
import { computeTotals, type CheckoutState } from "@/lib/storefront/checkout"
import { getStatesList, getCitiesByState, type NigerianState } from "@/lib/nigerian-locations"
import { DaylightIconSprite } from "./daylight-icons"
import {
  DAYLIGHT_TYPE_META,
  formatNaira,
  type DaylightItem,
  type DaylightStore,
  type DaylightItemType,
} from "./daylight-types"
import "./daylight-storefront.css"

function shadeColor(hex: string, amt: number): string {
  const n = Number.parseInt(hex.replace("#", ""), 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  r = Math.round(r * amt)
  g = Math.round(g * amt)
  b = Math.round(b * amt)
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

type CategoryFilter = "all" | DaylightItemType

export interface DaylightSelection {
  qty: number
  size: string | null
  colorName: string | null
  tierId: string | null
  dayDate: string | null
  slotTime: string | null
}

const EMPTY_SELECTION: DaylightSelection = { qty: 1, size: null, colorName: null, tierId: null, dayDate: null, slotTime: null }

export function DaylightStorefront({ store, items }: { store: DaylightStore; items: DaylightItem[] }) {
  const cartStore = useMemo(() => createCartStore(store.id), [store.id])
  const accentInk = useMemo(() => shadeColor(store.accent, 0.72), [store.accent])

  const [cart, setCart] = useState(() => cartStore.getCart())
  const [category, setCategory] = useState<CategoryFilter>("all")
  const [queryInput, setQueryInput] = useState("")
  const [query, setQuery] = useState("")
  const [sheetItem, setSheetItem] = useState<DaylightItem | null>(null)
  const [sel, setSel] = useState<DaylightSelection>(EMPTY_SELECTION)
  const [panel, setPanel] = useState<"none" | "sheet" | "cart" | "checkout">("none")
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1)
  const [order, setOrder] = useState({
    name: "",
    phone: "",
    email: "",
    method: "delivery" as "delivery" | "pickup",
    areaId: null as string | null,
    address: "",
    addressState: "",
    addressCity: "",
    addressPostalCode: "",
    note: "",
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [isTopOn, setIsTopOn] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const onUpdate = () => setCart(cartStore.getCart())
    window.addEventListener("cartUpdated", onUpdate)
    return () => window.removeEventListener("cartUpdated", onUpdate)
  }, [cartStore])

  useEffect(() => {
    const onScroll = () => setIsTopOn(window.scrollY > 180)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setQuery(queryInput), 180)
    return () => clearTimeout(t)
  }, [queryInput])

  useEffect(() => {
    document.body.style.overflow = panel === "none" ? "" : "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [panel])

  const say = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const closeAll = useCallback(() => {
    setPanel("none")
  }, [])

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (category !== "all" && it.type !== category) return false
      if (!q) return true
      const label = DAYLIGHT_TYPE_META[it.type].label
      return `${it.name} ${it.description} ${label}`.toLowerCase().includes(q)
    })
  }, [items, category, query])

  const counts = useMemo(() => {
    const c: Record<CategoryFilter, number> = { all: items.length, physical: 0, event: 0, appointment: 0, digital: 0 }
    for (const it of items) c[it.type]++
    return c
  }, [items])

  // ---------- Item sheet ----------
  function openItem(it: DaylightItem) {
    const sizes = [...new Set(it.variants.map((v) => v.size).filter(Boolean))] as string[]
    const colors = [...new Map(it.variants.filter((v) => v.colorName).map((v) => [v.colorName as string, v])).values()]
    setSheetItem(it)
    setSel({
      qty: 1,
      size: sizes.find((s) => variantStock(it, s, null) > 0) ?? sizes[0] ?? null,
      colorName: colors[0]?.colorName ?? null,
      tierId: it.tiers[0]?.id ?? null,
      dayDate: null,
      slotTime: null,
    })
    setPanel("sheet")
  }

  function variantStock(it: DaylightItem, size: string | null, colorName: string | null): number {
    const matches = it.variants.filter((v) => (size == null || v.size === size) && (colorName == null || v.colorName === colorName))
    return matches.reduce((sum, v) => sum + v.stock, 0)
  }

  const sizes = sheetItem ? [...new Set(sheetItem.variants.map((v) => v.size).filter(Boolean))] as string[] : []
  const colors = sheetItem
    ? [...new Map(sheetItem.variants.filter((v) => v.colorName).map((v) => [v.colorName as string, v])).values()]
    : []
  const selectedTier = sheetItem?.tiers.find((t) => t.id === sel.tierId) ?? null
  const unitPrice = sheetItem ? (sheetItem.type === "event" && selectedTier ? selectedTier.price : sheetItem.price) : 0
  const stepperMax = sheetItem
    ? sizes.length > 0
      ? variantStock(sheetItem, sel.size, null)
      : sheetItem.stock ?? 99
    : 99
  const selectedDay = sheetItem?.days.find((d) => d.date === sel.dayDate) ?? null
  const bookingReady = sheetItem?.type !== "appointment" || (!!sel.dayDate && !!sel.slotTime)
  const isSoldOut = sheetItem ? (sheetItem.type === "physical" ? stepperMax <= 0 : false) : false

  function addCurrentToCart() {
    if (!sheetItem) return
    if (sheetItem.type === "appointment" && !bookingReady) return
    const variant =
      sheetItem.variants.find((v) => (sizes.length === 0 || v.size === sel.size) && (colors.length === 0 || v.colorName === sel.colorName)) ??
      sheetItem.variants.find((v) => v.size === sel.size) ??
      sheetItem.variants.find((v) => v.colorName === sel.colorName)
    const variantLabel = [sel.size, sel.colorName].filter(Boolean).join(" / ") || undefined

    const result = cartStore.addItem(
      {
        id: sheetItem.id,
        title: sheetItem.name,
        price: unitPrice,
        product_type: sheetItem.type,
        images: sheetItem.images,
      },
      sel.qty,
      {
        ...(variant && { product_variant_id: variant.id, variant_label: variantLabel }),
        ...(selectedTier && { ticket_tier_id: selectedTier.id, ticket_tier_name: selectedTier.name }),
        ...(sheetItem.type === "appointment" && sel.dayDate && { appointment_date: sel.dayDate }),
        ...(sheetItem.type === "appointment" && sel.slotTime && { appointment_time: sel.slotTime }),
        max: sizes.length > 0 ? variantStock(sheetItem, sel.size, null) : sheetItem.stock ?? undefined,
      },
    )
    setCart(cartStore.getCart())
    if (!result.ok) {
      say("That slot is already in your cart")
      return
    }
    closeAll()
    say(`${sheetItem.name} added`)
  }

  // ---------- Cart ----------
  const totals = computeTotals(cart.items, {
    name: order.name,
    phone: order.phone,
    email: order.email,
    method: order.method,
    areaId: order.areaId,
    areaName: store.deliveryAreas.find((a) => a.id === order.areaId)?.name ?? null,
    areaFee: order.method === "pickup" ? 0 : store.deliveryAreas.find((a) => a.id === order.areaId)?.fee ?? null,
    address: order.address,
    addressState: order.addressState,
    addressCity: order.addressCity,
    addressPostalCode: order.addressPostalCode,
    note: order.note,
  } satisfies CheckoutState)

  const citiesForState = useMemo(
    () => (order.addressState ? getCitiesByState(order.addressState as NigerianState) : []),
    [order.addressState],
  )

  function selectAddressState(nextState: string) {
    setOrder((o) => ({ ...o, addressState: nextState, addressCity: "" }))
  }

  function lineOptionText(item: CartItem): string {
    const bits: string[] = []
    if (item.variant_label) bits.push(item.variant_label)
    if (item.ticket_tier_name) bits.push(item.ticket_tier_name)
    if (item.appointment_date && item.appointment_time) bits.push(`${item.appointment_date}, ${item.appointment_time}`)
    return bits.join(" · ")
  }

  function updateQty(itemId: string, delta: number) {
    const line = cart.items.find((i) => i.id === itemId)
    if (!line) return
    cartStore.updateQuantity(itemId, line.quantity + delta)
    setCart(cartStore.getCart())
  }

  function removeLine(itemId: string) {
    const line = cart.items.find((i) => i.id === itemId)
    cartStore.removeItem(itemId)
    setCart(cartStore.getCart())
    if (line) say(`${line.title} removed`)
  }

  function startCheckout() {
    setCheckoutStep(1)
    setFieldErrors({})
    setPanel("checkout")
  }

  // ---------- Checkout ----------
  function validateStep(step: 1 | 2): boolean {
    const errs: Record<string, string> = {}
    if (step === 1) {
      for (const e of validateDetailsStep(order, store.name)) errs[e.field] = e.message
    } else {
      for (const e of validateDeliveryStep({
        needsDelivery: totals.needsDelivery,
        method: order.method,
        areaFee: order.method === "pickup" ? 0 : store.deliveryAreas.find((a) => a.id === order.areaId)?.fee ?? null,
        address: order.address,
        state: order.addressState,
        city: order.addressCity,
      })) {
        if (e.field === "area") {
          say(e.message)
        }
        errs[e.field] = e.message
      }
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  function goNext() {
    if (!validateStep(checkoutStep === 3 ? 2 : (checkoutStep as 1 | 2))) return
    setCheckoutStep((s) => (s === 1 ? 2 : 3))
  }

  async function pay() {
    setPaying(true)
    setPayError(null)
    try {
      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          items: cart.items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            ...(i.product_variant_id && { product_variant_id: i.product_variant_id }),
            ...(i.ticket_tier_id && { ticket_tier_id: i.ticket_tier_id }),
            ...(i.appointment_date && { appointment_date: i.appointment_date }),
            ...(i.appointment_time && { appointment_time: i.appointment_time }),
          })),
          details: {
            name: order.name.trim(),
            phone: order.phone.trim(),
            email: order.email.trim(),
            method: order.method,
            areaId: order.areaId ?? undefined,
            address: order.address.trim(),
            state: order.addressState,
            city: order.addressCity,
            postalCode: order.addressPostalCode.trim(),
            note: order.note.trim(),
          },
          callbackUrl: `${window.location.origin}/${store.slug}/order/confirmed?store=${store.id}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Payment initialization failed")
      window.location.href = data.authorization_url
    } catch (err: any) {
      setPaying(false)
      setPayError(err.message || "Something went wrong. Please try again.")
    }
  }

  function shareStore() {
    const shareData = { title: store.name, text: `Shop ${store.name} on Blaqora`, url: window.location.href }
    const nav = navigator as Navigator & { share?: (d: typeof shareData) => Promise<void> }
    if (nav.share) {
      nav.share(shareData).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => say("Store link copied"))
    } else {
      say("Copy the link from your browser")
    }
  }

  const waHref = store.whatsappNumber ? `https://wa.me/${store.whatsappNumber}` : null
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0)
  const gridTitle =
    category === "all"
      ? "All items"
      : category === "physical"
        ? "Shop"
        : category === "event"
          ? "Events"
          : category === "appointment"
            ? "Book me"
            : "Downloads"

  return (
    <div className="daylight-store" style={{ ["--accent" as any]: store.accent, ["--accent-ink" as any]: accentInk }}>
      <DaylightIconSprite />

      <div className="shell">
        <header className={`top${isTopOn ? " is-on" : ""}`}>
          {store.avatarUrl ? (
            <img className="top__logo" src={store.avatarUrl} alt="" />
          ) : (
            <div className="top__logo" style={{ display: "grid", placeItems: "center", background: store.accent, color: "#fff", fontWeight: 800, fontSize: 13 }}>
              {store.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="top__name">{store.name}</span>
          <button
            className="icon-btn"
            type="button"
            aria-label="Search items"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" })
              setTimeout(() => document.getElementById("dl-search")?.focus(), 400)
            }}
          >
            <svg className="i"><use href="#dl-i-search" /></svg>
          </button>
          <button className="icon-btn" type="button" aria-label="Open cart" onClick={() => setPanel("cart")}>
            <svg className="i"><use href="#dl-i-cart" /></svg>
          </button>
        </header>

        <section className="head">
          <div className="cover">
            {store.coverUrl && <img src={store.coverUrl} alt="" />}
            <span className="cover__scrim" />
            <div className="cover__tools">
              <span />
              <button className="icon-btn icon-btn--glass" type="button" aria-label="Share this store" onClick={shareStore}>
                <svg className="i"><use href="#dl-i-share" /></svg>
              </button>
            </div>
          </div>
          <div className="head__body">
            <div className="head__row">
              <div>
                {store.avatarUrl ? (
                  <img className="avatar" src={store.avatarUrl} alt={`${store.name} logo`} />
                ) : (
                  <div className="avatar" style={{ display: "grid", placeItems: "center", background: store.accent, color: "#fff", fontWeight: 800, fontSize: 28, fontFamily: "var(--font-display)" }}>
                    {store.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <h1 className="head__name">
                  {store.name}
                  {store.verified && (
                    <span className="verified" title="Verified vendor">
                      <svg><use href="#dl-i-verified" /></svg>
                      <span className="sr">Verified vendor</span>
                    </span>
                  )}
                </h1>
                {store.bio && <p className="head__bio">{store.bio}</p>}
                <div className="head__meta">
                  {store.location && (
                    <span><svg className="i"><use href="#dl-i-pin" /></svg>{store.location}</span>
                  )}
                  {store.ordersDelivered > 0 && (
                    <span><svg className="i"><use href="#dl-i-box" /></svg>{store.ordersDelivered} orders delivered</span>
                  )}
                  <span><svg className="i"><use href="#dl-i-clock" /></svg>Member since {store.memberSinceYear}</span>
                </div>
              </div>
              <div className="head__actions desk-actions">
                {waHref && (
                  <a className="btn btn--wa" href={waHref} target="_blank" rel="noreferrer">
                    <svg className="i"><use href="#dl-i-wa" /></svg>Message
                  </a>
                )}
                <button className="btn btn--outline" type="button" onClick={shareStore}>
                  <svg className="i"><use href="#dl-i-share" /></svg>Share
                </button>
              </div>
            </div>
            <div className="head__actions mob-actions">
              {waHref && (
                <a className="btn btn--wa" href={waHref} target="_blank" rel="noreferrer">
                  <svg className="i"><use href="#dl-i-wa" /></svg>Message
                </a>
              )}
              <button className="btn btn--outline" type="button" onClick={shareStore}>
                <svg className="i"><use href="#dl-i-share" /></svg>Share
              </button>
            </div>
          </div>
        </section>

        {items.length === 0 ? (
          <div className="empty">
            <span className="empty__art"><i /><i /><i /></span>
            <b>Nothing here yet</b>
            <p>{store.name} hasn&apos;t listed anything yet. Check back soon.</p>
            {waHref && (
              <a className="btn btn--ghost btn--sm" href={waHref} target="_blank" rel="noreferrer">
                Message on WhatsApp
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="tools">
              <div className={`search${queryInput ? " has-value" : ""}`}>
                <svg className="i"><use href="#dl-i-search" /></svg>
                <input
                  id="dl-search"
                  type="search"
                  placeholder={`Search ${store.name}`}
                  aria-label="Search items"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                />
                <button className="search__clear" type="button" aria-label="Clear search" onClick={() => setQueryInput("")}>
                  <svg className="i"><use href="#dl-i-close" /></svg>
                </button>
              </div>
              <div className="cats" role="group" aria-label="Filter by category">
                {(["all", "physical", "event", "appointment", "digital"] as CategoryFilter[]).map((k) => (
                  <button
                    key={k}
                    className={`cat${k !== "all" ? ` cat--${DAYLIGHT_TYPE_META[k].cls}` : ""}`}
                    type="button"
                    aria-pressed={category === k}
                    onClick={() => setCategory(k)}
                  >
                    {k !== "all" && <span className="cat__dot" />}
                    {k === "all" ? "All" : k === "physical" ? "Shop" : k === "event" ? "Events" : k === "appointment" ? "Book me" : "Downloads"} <b>{counts[k]}</b>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-head">
              <h2>{gridTitle}</h2>
              <span>{visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}</span>
            </div>

            {visibleItems.length > 0 ? (
              <div className="grid" aria-live="polite">
                {visibleItems.map((it, i) => (
                  <ItemCard key={it.id} item={it} index={i} onOpen={() => openItem(it)} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <span className="empty__art"><i /><i /><i /></span>
                <b>{query ? `No match for "${query}"` : "Nothing in this category yet"}</b>
                <p>{query ? "Check the spelling, or browse everything in the store." : `${store.name} has other items you might like.`}</p>
                <button
                  className="btn btn--ghost btn--sm"
                  type="button"
                  onClick={() => {
                    setCategory("all")
                    setQueryInput("")
                    setQuery("")
                  }}
                >
                  Show all items
                </button>
              </div>
            )}
          </>
        )}

        <footer className="foot">
          {waHref && (
            <div className="foot__socials">
              <a href={waHref} target="_blank" rel="noreferrer" aria-label={`${store.name} on WhatsApp`}>
                <svg className="i"><use href="#dl-i-wa" /></svg>
              </a>
            </div>
          )}
          <p>
            {store.name}{store.location ? `, ${store.location}` : ""}
            {store.email && <><br />{store.email}</>}
          </p>
          <a className="powered" href="https://blaqora.store">
            <img src="/blaqora-icon.png" alt="" />Powered by <b>Blaqora</b>
          </a>
        </footer>
      </div>

      <button className="fab" type="button" hidden={cartCount === 0} onClick={() => setPanel("cart")}>
        <span className="fab__count">{cartCount}</span>
        <span>View cart</span>
        <span className="fab__sep" />
        <span className="money">{formatNaira(totals.subtotal)}</span>
      </button>

      <div className={`scrim${panel !== "none" ? " is-on" : ""}`} onClick={closeAll} />

      {/* Item sheet */}
      <section className={`sheet${panel === "sheet" ? " is-on" : ""}`} aria-hidden={panel !== "sheet"} role="dialog" aria-modal="true" aria-label="Item details">
        <span className="sheet__grab" />
        <button className="icon-btn icon-btn--glass sheet__close" type="button" aria-label="Close" onClick={closeAll}>
          <svg className="i"><use href="#dl-i-close" /></svg>
        </button>
        <div className="sheet__scroll">
          {sheetItem && (
            <ItemSheet
              item={sheetItem}
              sel={sel}
              setSel={setSel}
              sizes={sizes}
              colors={colors}
              unitPrice={unitPrice}
              stepperMax={stepperMax}
              selectedDay={selectedDay}
              bookingReady={!!bookingReady}
              isSoldOut={isSoldOut}
              waHref={waHref}
              storeName={store.name}
              onAdd={addCurrentToCart}
            />
          )}
        </div>
      </section>

      {/* Cart drawer */}
      <aside className={`drawer${panel === "cart" ? " is-on" : ""}`} aria-hidden={panel !== "cart"} role="dialog" aria-modal="true" aria-label="Your cart">
        <div className="drawer__head">
          <b>Your cart</b>
          <button className="icon-btn" type="button" aria-label="Close cart" onClick={closeAll}>
            <svg className="i"><use href="#dl-i-close" /></svg>
          </button>
        </div>
        <div className="drawer__body">
          {cart.items.length === 0 ? (
            <div className="empty">
              <span className="empty__art"><i /><i /><i /></span>
              <b>Your cart is empty</b>
              <p>Browse {store.name} and add something you like.</p>
              <button className="btn btn--ghost btn--sm" type="button" onClick={closeAll}>Keep shopping</button>
            </div>
          ) : (
            cart.items.map((line) => {
              const opt = lineOptionText(line)
              return (
                <div className="line" key={line.id}>
                  <img src={line.image} alt="" />
                  <div className="line__main">
                    <p className="line__name">{line.title}</p>
                    {opt && <p className="line__opt">{opt}</p>}
                    <div className="line__row">
                      {line.unique ? (
                        <span className="line__opt">1 booking</span>
                      ) : (
                        <span className="qty qty--sm">
                          <button type="button" aria-label="Reduce quantity" onClick={() => updateQty(line.id, -1)}>
                            <svg className="i"><use href="#dl-i-minus" /></svg>
                          </button>
                          <output>{line.quantity}</output>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={line.max != null && line.quantity >= line.max}
                            onClick={() => updateQty(line.id, 1)}
                          >
                            <svg className="i"><use href="#dl-i-plus" /></svg>
                          </button>
                        </span>
                      )}
                      <span className="line__price money">{formatNaira(line.price * line.quantity)}</span>
                    </div>
                    <button className="link-danger" type="button" onClick={() => removeLine(line.id)}>Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        {cart.items.length > 0 && (
          <div className="drawer__foot">
            <div className="totals">
              <div><span>Subtotal</span><b className="money">{formatNaira(totals.subtotal)}</b></div>
              {totals.needsDelivery && <div><span>Delivery</span><b>Chosen at checkout</b></div>}
              <div className="grand"><span>Total</span><b className="money">{formatNaira(totals.subtotal)}</b></div>
            </div>
            <button className="btn btn--accent btn--block" type="button" onClick={startCheckout}>
              Checkout · {formatNaira(totals.subtotal)}
            </button>
          </div>
        )}
      </aside>

      {/* Checkout drawer */}
      <aside className={`drawer${panel === "checkout" ? " is-on" : ""}`} aria-hidden={panel !== "checkout"} role="dialog" aria-modal="true" aria-label="Checkout">
        <div className="drawer__head">
          <button
            className="icon-btn"
            type="button"
            aria-label="Go back"
            style={{ visibility: checkoutStep === 1 ? "hidden" : "visible" }}
            onClick={() => setCheckoutStep((s) => (s === 3 ? 2 : 1))}
          >
            <svg className="i"><use href="#dl-i-back" /></svg>
          </button>
          <b>{checkoutStep === 1 ? "Your details" : checkoutStep === 2 ? (totals.needsDelivery ? "Delivery" : "How to receive it") : "Review and pay"}</b>
          <button className="icon-btn" type="button" aria-label="Close checkout" onClick={closeAll}>
            <svg className="i"><use href="#dl-i-close" /></svg>
          </button>
        </div>
        <div className="steps">
          {[1, 2, 3].map((n, i) => (
            <div key={n} style={{ display: "contents" }}>
              <span className={`dot${checkoutStep === n ? " is-on" : ""}${checkoutStep > n ? " is-done" : ""}`}>
                <i>{n}</i>{n === 1 ? "Details" : n === 2 ? "Delivery" : "Pay"}
              </span>
              {i < 2 && <span className={`steps__line${checkoutStep > n ? " is-done" : ""}`} />}
            </div>
          ))}
        </div>
        <div className="drawer__body">
          {checkoutStep === 1 && (
            <div className="form">
              <div className={`field${fieldErrors.name ? " is-bad" : ""}`}>
                <label htmlFor="dl-c-name">Full name</label>
                <input id="dl-c-name" autoComplete="name" placeholder="Your name" value={order.name} onChange={(e) => setOrder((o) => ({ ...o, name: e.target.value }))} />
                <span className="err">{fieldErrors.name}</span>
              </div>
              <div className={`field${fieldErrors.phone ? " is-bad" : ""}`}>
                <label htmlFor="dl-c-phone">WhatsApp number</label>
                <input id="dl-c-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" value={order.phone} onChange={(e) => setOrder((o) => ({ ...o, phone: e.target.value }))} />
                <span className="hint">{store.name} uses this to confirm your order.</span>
                <span className="err">{fieldErrors.phone}</span>
              </div>
              <div className={`field${fieldErrors.email ? " is-bad" : ""}`}>
                <label htmlFor="dl-c-email">Email</label>
                <input id="dl-c-email" type="email" inputMode="email" autoComplete="email" placeholder="you@email.com" value={order.email} onChange={(e) => setOrder((o) => ({ ...o, email: e.target.value }))} />
                <span className="hint">Your receipt{cart.items.some((l) => l.product_type !== "physical") ? ", tickets and files" : ""} go here.</span>
                <span className="err">{fieldErrors.email}</span>
              </div>
            </div>
          )}
          {checkoutStep === 2 && (
            <div className="form">
              {!totals.needsDelivery ? (
                <div className="strip" style={{ margin: 0 }}>
                  <div>
                    <svg className="i"><use href="#dl-i-check" /></svg>
                    <span>
                      Nothing to deliver. Your {cart.items.some((l) => l.product_type === "event") ? "tickets" : cart.items.some((l) => l.product_type === "appointment") ? "booking confirmation" : "files"} will be sent to <b>{order.email || "your email"}</b> right after payment.
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="opts__label">How would you like to get it?</p>
                  <div className="opts" role="group" aria-label="How to get your order">
                    <button className="opt-card" type="button" aria-pressed={order.method === "delivery"} onClick={() => setOrder((o) => ({ ...o, method: "delivery" }))}>
                      <span className="opt-card__tick" />
                      <span className="opt-card__main"><b>Deliver to me</b><small>A dispatch rider brings it to your address.</small></span>
                    </button>
                    <button className="opt-card" type="button" aria-pressed={order.method === "pickup"} onClick={() => setOrder((o) => ({ ...o, method: "pickup", areaId: null }))}>
                      <span className="opt-card__tick" />
                      <span className="opt-card__main"><b>Pick up from the store</b>{store.location && <small>{store.location}</small>}</span>
                      <span className="opt-card__price">Free</span>
                    </button>
                  </div>
                  {order.method === "delivery" && (
                    <>
                      <p className="opts__label">Where are we delivering to?</p>
                      <div className="opts" role="group" aria-label="Delivery area">
                        {store.deliveryAreas.map((a) => (
                          <button key={a.id} className="opt-card" type="button" aria-pressed={order.areaId === a.id} onClick={() => setOrder((o) => ({ ...o, areaId: a.id }))}>
                            <span className="opt-card__tick" />
                            <span className="opt-card__main"><b>{a.name}</b>{a.note && <small>{a.note}</small>}</span>
                            <span className="opt-card__price money">{formatNaira(a.fee)}</span>
                          </button>
                        ))}
                      </div>
                      <div className={`field${fieldErrors.address ? " is-bad" : ""}`}>
                        <label htmlFor="dl-c-addr">Delivery address</label>
                        <textarea id="dl-c-addr" autoComplete="street-address" placeholder="House number, street, area, landmark" value={order.address} onChange={(e) => setOrder((o) => ({ ...o, address: e.target.value }))} />
                        <span className="err">{fieldErrors.address}</span>
                      </div>
                      <p className="opts__label">Shipping Address</p>
                      <div className="field-row">
                        <div className={`field${fieldErrors.state ? " is-bad" : ""}`}>
                          <label htmlFor="dl-c-state">State *</label>
                          <select id="dl-c-state" autoComplete="address-level1" value={order.addressState} onChange={(e) => selectAddressState(e.target.value)}>
                            <option value="">Select state</option>
                            {getStatesList().map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <span className="err">{fieldErrors.state}</span>
                        </div>
                        <div className={`field${fieldErrors.city ? " is-bad" : ""}`}>
                          <label htmlFor="dl-c-city">City *</label>
                          <select id="dl-c-city" autoComplete="address-level2" value={order.addressCity} disabled={!order.addressState} onChange={(e) => setOrder((o) => ({ ...o, addressCity: e.target.value }))}>
                            <option value="">{order.addressState ? "Select city" : "Select a state first"}</option>
                            {citiesForState.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <span className="err">{fieldErrors.city}</span>
                        </div>
                      </div>
                      <div className="field">
                        <label htmlFor="dl-c-zip">Postal Code</label>
                        <input id="dl-c-zip" autoComplete="postal-code" inputMode="numeric" placeholder="100001" value={order.addressPostalCode} onChange={(e) => setOrder((o) => ({ ...o, addressPostalCode: e.target.value }))} />
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="field">
                <label htmlFor="dl-c-note">Note for {store.name} <span style={{ fontWeight: 500, color: "var(--soft)" }}>(optional)</span></label>
                <textarea id="dl-c-note" placeholder="Anything they should know?" value={order.note} onChange={(e) => setOrder((o) => ({ ...o, note: e.target.value }))} />
              </div>
            </div>
          )}
          {checkoutStep === 3 && (
            <>
              <div className="review" style={{ marginTop: 16 }}>
                {cart.items.map((line) => {
                  const opt = lineOptionText(line)
                  return (
                    <div className="review__row" key={line.id}>
                      <span>
                        {line.quantity}× {line.title}
                        {opt && <><br /><span style={{ fontSize: 12.5 }}>{opt}</span></>}
                      </span>
                      <span className="money">{formatNaira(line.price * line.quantity)}</span>
                    </div>
                  )
                })}
                <div className="review__row"><span>Subtotal</span><span className="money">{formatNaira(totals.subtotal)}</span></div>
                {totals.needsDelivery && (
                  <div className="review__row">
                    <span>{order.method === "pickup" ? "Pickup" : "Delivery"}</span>
                    <span className="money">{totals.deliveryFee ? formatNaira(totals.deliveryFee) : "Free"}</span>
                  </div>
                )}
                <div className="review__row" style={{ borderTop: "1px solid var(--line-2)", marginTop: 6, paddingTop: 11, fontSize: 17 }}>
                  <span style={{ color: "var(--ink)", fontWeight: 800 }}>Total</span>
                  <span className="money" style={{ fontWeight: 800 }}>{formatNaira(totals.total)}</span>
                </div>
              </div>
              <div className="review" style={{ marginTop: 12 }}>
                <div className="review__row"><span>Name</span><span>{order.name}</span></div>
                <div className="review__row"><span>Phone</span><span>{order.phone}</span></div>
                <div className="review__row"><span>Email</span><span style={{ wordBreak: "break-all" }}>{order.email}</span></div>
                {totals.needsDelivery && (
                  <div className="review__row">
                    <span>{order.method === "pickup" ? "Pickup" : "Deliver to"}</span>
                    <span>{order.method === "pickup" ? store.location : order.address}</span>
                  </div>
                )}
                <button className="btn btn--ghost btn--sm" type="button" style={{ marginTop: 10 }} onClick={() => setCheckoutStep(1)}>Edit details</button>
              </div>
              {payError && <p style={{ margin: "0 16px", color: "var(--danger-ink)", fontSize: 13.5, fontWeight: 600 }}>{payError}</p>}
              <div className="pay-note" style={{ marginTop: 12 }}>
                <svg className="i"><use href="#dl-i-shield" /></svg>You&apos;ll pay on Paystack&apos;s secure page. Card, bank transfer or USSD.
              </div>
            </>
          )}
        </div>
        <div className="drawer__foot">
          {checkoutStep < 3 ? (
            <button className="btn btn--accent btn--block" type="button" onClick={goNext}>
              {checkoutStep === 1 ? "Continue" : "Continue to payment"}
            </button>
          ) : (
            <button className="btn btn--accent btn--block" type="button" disabled={paying} onClick={pay}>
              {paying ? "Opening secure payment…" : `Pay ${formatNaira(totals.total)}`}
            </button>
          )}
        </div>
      </aside>

      <div className={`toast${toast ? " is-on" : ""}`} role="status" aria-live="polite">
        <svg className="i"><use href="#dl-i-check" /></svg>
        <span>{toast}</span>
      </div>
    </div>
  )
}

function ItemCard({ item, index, onOpen }: { item: DaylightItem; index: number; onOpen: () => void }) {
  const t = DAYLIGHT_TYPE_META[item.type]
  const soldOut = item.type === "physical" && item.stock === 0
  const lowStock = item.type === "physical" && item.stock != null && item.stock > 0 && item.stock <= 3
  const sub =
    item.type === "event" && item.eventDate
      ? { icon: "dl-i-cal", text: item.eventDate }
      : item.type === "appointment" && item.durationLabel
        ? { icon: "dl-i-clock", text: item.durationLabel }
        : item.type === "digital" && item.fileLabel
          ? { icon: "dl-i-dl", text: item.fileLabel }
          : lowStock
            ? { icon: "dl-i-alert", text: `Only ${item.stock} left` }
            : null

  return (
    <button className={`card${soldOut ? " is-out" : ""}`} type="button" style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }} onClick={onOpen}>
      <span className="card__media">
        <img src={item.images[0]} alt={item.name} loading="lazy" decoding="async" />
        <span className="card__tags">
          <span className={`pill pill--${t.cls}`}>{t.label}</span>
          {soldOut ? <span className="pill pill--out">Sold out</span> : lowStock ? <span className="pill pill--low">{item.stock} left</span> : null}
        </span>
        {!soldOut && (
          <span className="card__quick" aria-hidden="true">
            <svg className="i"><use href="#dl-i-plus" /></svg>
          </span>
        )}
      </span>
      <span className="card__body">
        <span className="card__name">{item.name}</span>
        <span className="card__meta">
          <span className="card__price money">{formatNaira(item.price)}</span>
          {item.compareAtPrice != null && <span className="card__was money">{formatNaira(item.compareAtPrice)}</span>}
        </span>
        {sub && (
          <span className="card__sub">
            <svg className="i"><use href={`#${sub.icon}`} /></svg>{sub.text}
          </span>
        )}
      </span>
    </button>
  )
}

export function ItemSheet({
  item,
  sel,
  setSel,
  sizes,
  colors,
  unitPrice,
  stepperMax,
  selectedDay,
  bookingReady,
  isSoldOut,
  waHref,
  storeName,
  onAdd,
}: {
  item: DaylightItem
  sel: DaylightSelection
  setSel: (updater: (s: DaylightSelection) => DaylightSelection) => void
  sizes: string[]
  colors: { colorName: string | null; colorHex: string | null }[]
  unitPrice: number
  stepperMax: number
  selectedDay: DaylightItem["days"][number] | null
  bookingReady: boolean
  isSoldOut: boolean
  waHref: string | null
  storeName: string
  onAdd: () => void
}) {
  const t = DAYLIGHT_TYPE_META[item.type]
  const images = item.images.length ? item.images : ["/placeholder.svg"]
  const [dotIndex, setDotIndex] = useState(0)
  const selectedTier = item.tiers.find((tier) => tier.id === sel.tierId) ?? null

  return (
    <div className="pd">
      <div className="gallery">
        <div
          className="gallery__track"
          onScroll={(e) => {
            const el = e.currentTarget
            setDotIndex(Math.round(el.scrollLeft / el.clientWidth))
          }}
        >
          {images.map((src, i) => (
            <img key={i} src={src} alt={`${item.name} photo ${i + 1}`} />
          ))}
        </div>
        {images.length > 1 && (
          <div className="dots">
            {images.map((_, i) => (
              <i key={i} className={i === dotIndex ? "on" : ""} />
            ))}
          </div>
        )}
      </div>
      <div className="pd__body">
        <span className={`pd__cat pd__cat--${t.cls}`}>
          <svg className="i" style={{ width: 15, height: 15 }}><use href={`#${t.icon}`} /></svg>
          {t.label}
        </span>
        <h2 className="pd__name">{item.name}</h2>
        <div className="pd__price">
          <b className="money">{formatNaira(item.type === "event" && selectedTier ? selectedTier.price : unitPrice)}</b>
          {item.compareAtPrice != null && (
            <>
              <s className="money">{formatNaira(item.compareAtPrice)}</s>
              <span className="pd__save">Save {Math.round((1 - item.price / item.compareAtPrice) * 100)}%</span>
            </>
          )}
        </div>

        {item.type === "physical" &&
          (item.stock == null || item.stock > 3 ? (
            <p className="pd__stock ok"><svg className="i"><use href="#dl-i-check" /></svg>In stock, ready to ship</p>
          ) : item.stock > 0 ? (
            <p className="pd__stock low"><svg className="i"><use href="#dl-i-alert" /></svg>Only {item.stock} left</p>
          ) : (
            <p className="pd__stock low"><svg className="i"><use href="#dl-i-alert" /></svg>Sold out</p>
          ))}
        {item.type === "event" && (
          <p className="pd__stock ok"><svg className="i"><use href="#dl-i-cal" /></svg>{item.eventDate}{item.eventLocation ? ` · ${item.eventLocation}` : ""}</p>
        )}
        {item.type === "appointment" && (
          <p className="pd__stock ok"><svg className="i"><use href="#dl-i-clock" /></svg>{item.durationLabel}{item.venue ? ` · ${item.venue}` : ""}</p>
        )}
        {item.type === "digital" && (
          <p className="pd__stock ok"><svg className="i"><use href="#dl-i-dl" /></svg>{item.fileLabel ?? "Digital file"}, sent to your email</p>
        )}

        <p className="pd__desc">{item.description}</p>

        {colors.length > 0 && (
          <div className="opt">
            <div className="opt__label"><span>Colour</span><em>{sel.colorName}</em></div>
            <div className="opt__row">
              {colors.map((c) => (
                <button
                  key={c.colorName}
                  className="opt__btn sw"
                  type="button"
                  aria-pressed={c.colorName === sel.colorName}
                  style={{ background: c.colorHex ?? "#ccc" }}
                  aria-label={c.colorName ?? ""}
                  onClick={() => setSel((s) => ({ ...s, colorName: c.colorName }))}
                />
              ))}
            </div>
          </div>
        )}

        {sizes.length > 0 && (
          <div className="opt">
            <div className="opt__label"><span>Size</span></div>
            <div className="opt__row">
              {sizes.map((s) => {
                const stock = item.variants.filter((v) => v.size === s).reduce((sum, v) => sum + v.stock, 0)
                return (
                  <button key={s} className="opt__btn" type="button" aria-pressed={s === sel.size} disabled={stock <= 0} onClick={() => setSel((sl) => ({ ...sl, size: s, qty: 1 }))}>
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {item.tiers.length > 0 && (
          <div className="opt">
            <div className="opt__label"><span>Ticket type</span></div>
            <div className="opt__row">
              {item.tiers.map((tier) => (
                <button key={tier.id} className="opt__btn" type="button" aria-pressed={tier.id === sel.tierId} disabled={tier.left === 0} onClick={() => setSel((s) => ({ ...s, tierId: tier.id }))}>
                  {tier.name} · {formatNaira(tier.price)}
                </button>
              ))}
            </div>
          </div>
        )}

        {item.type === "appointment" && (
          <>
            <div className="opt">
              <div className="opt__label"><span>Pick a date</span></div>
              <div className="days">
                {item.days.map((d) => (
                  <button
                    key={d.date}
                    className="day"
                    type="button"
                    aria-pressed={d.date === sel.dayDate}
                    disabled={!d.free}
                    onClick={() => setSel((s) => ({ ...s, dayDate: d.date, slotTime: null }))}
                  >
                    <span>{d.dow}</span><b>{d.dateNum}</b>
                  </button>
                ))}
              </div>
            </div>
            {selectedDay && (
              <div className="opt">
                <div className="opt__label"><span>Pick a time</span></div>
                <div className="slots">
                  {selectedDay.slots.map((s) => (
                    <button key={s.time} className="slot" type="button" aria-pressed={s.time === sel.slotTime} disabled={!s.free} onClick={() => setSel((sl) => ({ ...sl, slotTime: s.time }))}>
                      {s.time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {item.type !== "digital" && (
          <div className="opt">
            <div className="opt__label"><span>Quantity</span></div>
            <div className="qty">
              <button type="button" aria-label="Reduce quantity" disabled={sel.qty <= 1} onClick={() => setSel((s) => ({ ...s, qty: Math.max(1, s.qty - 1) }))}>
                <svg className="i"><use href="#dl-i-minus" /></svg>
              </button>
              <output aria-live="polite">{sel.qty}</output>
              <button type="button" aria-label="Increase quantity" disabled={sel.qty >= stepperMax} onClick={() => setSel((s) => ({ ...s, qty: Math.min(stepperMax, s.qty + 1) }))}>
                <svg className="i"><use href="#dl-i-plus" /></svg>
              </button>
            </div>
          </div>
        )}

        <div className="strip">
          {item.type === "digital" ? (
            <div><svg className="i"><use href="#dl-i-dl" /></svg><span><b>Instant delivery.</b> The file is emailed to you as soon as payment goes through.</span></div>
          ) : item.type === "event" ? (
            <div><svg className="i"><use href="#dl-i-ticket" /></svg><span><b>QR ticket.</b> Yours arrives by email. Show it at the gate.</span></div>
          ) : item.type === "appointment" ? (
            <div><svg className="i"><use href="#dl-i-cal" /></svg><span><b>Your slot is held</b> once you pay, and {storeName} confirms it.</span></div>
          ) : (
            <div><svg className="i"><use href="#dl-i-truck" /></svg><span><b>Delivery</b> available at checkout.</span></div>
          )}
          <div><svg className="i"><use href="#dl-i-shield" /></svg><span><b>Secure payment.</b> Card, transfer or USSD through Paystack.</span></div>
          {waHref && (
            <div><svg className="i"><use href="#dl-i-wa" /></svg><span><b>Questions?</b> Message {storeName} on WhatsApp before you pay.</span></div>
          )}
        </div>
      </div>
      <div className="actionbar">
        <div className="actionbar__total">
          <small>Total</small>
          <b className="money">{formatNaira((item.type === "event" && selectedTier ? selectedTier.price : unitPrice) * sel.qty)}</b>
        </div>
        <button className="btn btn--accent" type="button" disabled={isSoldOut || !bookingReady} onClick={onAdd}>
          {isSoldOut ? "Sold out" : item.type === "appointment" ? "Add booking" : "Add to cart"}
        </button>
      </div>
    </div>
  )
}
