"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createCartStore, type CartItem } from "@/lib/cart-store"
import { validateDetailsStep, validateDeliveryStep } from "@/lib/storefront/validation"
import { computeTotals, type CheckoutState } from "@/lib/storefront/checkout"
import { getStatesList, getCitiesByState, type NigerianState } from "@/lib/nigerian-locations"
import { EditorialIconSprite } from "./editorial-icons"
import {
  DAYLIGHT_TYPE_META as TYPE_META,
  formatNaira,
  type DaylightItem as EditorialItem,
  type DaylightStore as EditorialStore,
  type DaylightItemType as EditorialItemType,
} from "./daylight-types"
import "./editorial-storefront.css"

// Editorial computes --on-accent and --accent-soft dynamically from the vendor's
// colour (contrast-based ink, not a fixed shade like Daylight) — copied exactly
// from the template's own contrastInk() function.
function contrastInk(hex: string): string {
  const n = Number.parseInt(hex.replace("#", ""), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#0A0A12" : "#FFFFFF"
}

type Tab = "home" | EditorialItemType
const ORDER: EditorialItemType[] = ["physical", "event", "appointment", "digital"]
const NAV_TABS: Tab[] = ["home", "physical", "event", "appointment", "digital"]

interface Selection {
  qty: number
  size: string | null
  colorName: string | null
  tierId: string | null
  dayDate: string | null
  slotTime: string | null
}
const EMPTY_SELECTION: Selection = { qty: 1, size: null, colorName: null, tierId: null, dayDate: null, slotTime: null }

export function EditorialStorefront({ store, items }: { store: EditorialStore; items: EditorialItem[] }) {
  const cartStore = useMemo(() => createCartStore(store.id), [store.id])
  const onAccent = useMemo(() => contrastInk(store.accent), [store.accent])
  const accentSoft = useMemo(() => `${store.accent}24`, [store.accent])

  const [cart, setCart] = useState(() => cartStore.getCart())
  const [tab, setTabState] = useState<Tab>("home")
  const [findOpen, setFindOpen] = useState(false)
  const [findQuery, setFindQuery] = useState("")
  const [pageItem, setPageItem] = useState<EditorialItem | null>(null)
  const [sel, setSel] = useState<Selection>(EMPTY_SELECTION)
  const [heroIndex, setHeroIndex] = useState(0)
  const [bagOpen, setBagOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
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
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const navRef = useRef<HTMLElement | null>(null)
  const [glider, setGlider] = useState({ width: 0, left: 0 })

  const anyOverlayOpen = !!pageItem || bagOpen || checkoutOpen || findOpen

  useEffect(() => {
    const onUpdate = () => setCart(cartStore.getCart())
    window.addEventListener("cartUpdated", onUpdate)
    return () => window.removeEventListener("cartUpdated", onUpdate)
  }, [cartStore])

  useEffect(() => {
    document.body.style.overflow = anyOverlayOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [anyOverlayOpen])

  const measureGlider = useCallback(() => {
    const nav = navRef.current
    if (!nav) return
    const btn = nav.querySelector<HTMLElement>(`[data-tab="${tab}"]`)
    if (!btn) {
      setGlider({ width: 0, left: 0 })
      return
    }
    setGlider({ width: btn.offsetWidth, left: btn.offsetLeft })
  }, [tab])

  useLayoutEffect(() => {
    measureGlider()
  }, [measureGlider])

  useEffect(() => {
    window.addEventListener("resize", measureGlider)
    return () => window.removeEventListener("resize", measureGlider)
  }, [measureGlider])

  const say = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  function setTab(t: Tab) {
    setTabState(t)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function closeAll() {
    setPageItem(null)
    setBagOpen(false)
    setCheckoutOpen(false)
    setFindOpen(false)
  }

  function shareStore() {
    const shareData = { title: store.name, text: `Shop ${store.name} on Blaqora`, url: window.location.href }
    const nav = navigator as Navigator & { share?: (d: typeof shareData) => Promise<void> }
    if (nav.share) nav.share(shareData).catch(() => {})
    else if (navigator.clipboard) navigator.clipboard.writeText(window.location.href).then(() => say("Store link copied"))
  }

  // ---------- Catalogue ----------
  const byType = useCallback((t: EditorialItemType) => items.filter((i) => i.type === t), [items])
  const featured = useMemo(() => items.find((i) => i.compareAtPrice != null && i.stock !== 0) ?? items[0] ?? null, [items])
  const searchChips = useMemo(() => {
    const words = new Set<string>()
    for (const it of items) {
      const first = it.name.split(" ")[0]
      if (first && first.length > 2) words.add(first)
      if (words.size >= 6) break
    }
    return [...words]
  }, [items])

  function variantStock(it: EditorialItem, size: string | null, colorName: string | null): number {
    const matches = it.variants.filter((v) => (size == null || v.size === size) && (colorName == null || v.colorName === colorName))
    return matches.reduce((sum, v) => sum + v.stock, 0)
  }

  // ---------- Item page ----------
  function openItem(it: EditorialItem) {
    const sizes = [...new Set(it.variants.map((v) => v.size).filter(Boolean))] as string[]
    const colors = [...new Map(it.variants.filter((v) => v.colorName).map((v) => [v.colorName as string, v])).values()]
    setPageItem(it)
    setHeroIndex(0)
    setSel({
      qty: 1,
      size: sizes.find((s) => variantStock(it, s, null) > 0) ?? sizes[0] ?? null,
      colorName: colors[0]?.colorName ?? null,
      tierId: it.tiers.find((t) => t.left !== 0)?.id ?? it.tiers[0]?.id ?? null,
      dayDate: null,
      slotTime: null,
    })
  }

  const sizes = pageItem ? ([...new Set(pageItem.variants.map((v) => v.size).filter(Boolean))] as string[]) : []
  const colors = pageItem
    ? [...new Map(pageItem.variants.filter((v) => v.colorName).map((v) => [v.colorName as string, v])).values()]
    : []
  const selectedTier = pageItem?.tiers.find((t) => t.id === sel.tierId) ?? null
  const unitPrice = pageItem ? (pageItem.type === "event" && selectedTier ? selectedTier.price : pageItem.price) : 0
  const stepperMax = pageItem ? (sizes.length > 0 ? variantStock(pageItem, sel.size, null) : pageItem.stock ?? 99) : 99
  const selectedDay = pageItem?.days.find((d) => d.date === sel.dayDate) ?? null
  const bookingReady = pageItem?.type !== "appointment" || (!!sel.dayDate && !!sel.slotTime)
  const isSoldOut = pageItem ? (pageItem.type === "physical" ? stepperMax <= 0 : false) : false

  function addCurrentToBag() {
    if (!pageItem) return
    if (pageItem.type === "appointment" && !bookingReady) return
    const variant =
      pageItem.variants.find((v) => (sizes.length === 0 || v.size === sel.size) && (colors.length === 0 || v.colorName === sel.colorName)) ??
      pageItem.variants.find((v) => v.size === sel.size) ??
      pageItem.variants.find((v) => v.colorName === sel.colorName)
    const variantLabel = [sel.size, sel.colorName].filter(Boolean).join(" / ") || undefined

    const result = cartStore.addItem(
      { id: pageItem.id, title: pageItem.name, price: unitPrice, product_type: pageItem.type, images: pageItem.images },
      sel.qty,
      {
        ...(variant && { product_variant_id: variant.id, variant_label: variantLabel }),
        ...(selectedTier && { ticket_tier_id: selectedTier.id, ticket_tier_name: selectedTier.name }),
        ...(pageItem.type === "appointment" && sel.dayDate && { appointment_date: sel.dayDate }),
        ...(pageItem.type === "appointment" && sel.slotTime && { appointment_time: sel.slotTime }),
        max: sizes.length > 0 ? variantStock(pageItem, sel.size, null) : pageItem.stock ?? undefined,
      },
    )
    setCart(cartStore.getCart())
    if (!result.ok) {
      say("That slot is already in your bag")
      return
    }
    setPageItem(null)
    say(`${pageItem.name} added to bag`)
  }

  // ---------- Bag ----------
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
    setBagOpen(false)
    setCheckoutOpen(true)
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
        if (e.field === "area") say(e.message)
        errs[e.field] = e.message
      }
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  function goNext(fromStep: 1 | 2) {
    if (!validateStep(fromStep)) return
    setCheckoutStep((fromStep + 1) as 1 | 2 | 3)
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
          callbackUrl: `${window.location.origin}/${store.slug}/order/confirmed?store=${store.id}&template=editorial`,
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

  const waHref = store.whatsappNumber ? `https://wa.me/${store.whatsappNumber}` : null
  const bagCount = cart.items.reduce((s, i) => s + i.quantity, 0)

  const rootStyle = {
    ["--accent" as any]: store.accent,
    ["--on-accent" as any]: onAccent,
    ["--accent-soft" as any]: accentSoft,
  }

  return (
    <div className="editorial-store" style={rootStyle}>
      <EditorialIconSprite />

      <div className="wrap">
        <header className="mast">
          <div className="mast__row">
            {store.avatarUrl ? (
              <img className="mast__logo" src={store.avatarUrl} alt="" />
            ) : (
              <div className="mast__logo" style={{ display: "grid", placeItems: "center", background: store.accent, color: onAccent, fontWeight: 800 }}>
                {store.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="mast__id">
              <h1 className="mast__name">
                {store.name}
                {store.verified && (
                  <>
                    <svg><use href="#ed-i-verified" /></svg>
                    <span className="sr">Verified vendor</span>
                  </>
                )}
              </h1>
              <p className="mast__sub">
                <i />
                Member since {store.memberSinceYear}
              </p>
            </div>
            <button className="ghost-btn" type="button" aria-label="Search this store" onClick={() => setFindOpen(true)}>
              <svg className="i"><use href="#ed-i-search" /></svg>
            </button>
            <button className="ghost-btn" type="button" aria-label="Share this store" onClick={shareStore}>
              <svg className="i"><use href="#ed-i-share" /></svg>
            </button>
          </div>
          {store.bio && <p className="mast__bio">{store.bio}</p>}
          <div className="mast__tags">
            {store.location && <span className="tagline"><svg className="i"><use href="#ed-i-pin" /></svg>{store.location}</span>}
            {store.ordersDelivered > 0 && <span className="tagline"><svg className="i"><use href="#ed-i-box" /></svg>{store.ordersDelivered} orders delivered</span>}
          </div>
          <div className="mast__cta">
            {waHref && (
              <a className="btn btn--wa" href={waHref} target="_blank" rel="noreferrer">
                <svg className="i"><use href="#ed-i-wa" /></svg>Message {store.name}
              </a>
            )}
            <button className="btn btn--line" type="button" onClick={shareStore}>
              <svg className="i"><use href="#ed-i-share" /></svg>Share
            </button>
          </div>
        </header>

        {items.length === 0 ? (
          <div className="none" style={{ marginTop: 30 }}>
            <span className="none__a"><i /><i /><i /></span>
            <b>Nothing here yet</b>
            <p>{store.name} hasn&apos;t listed anything yet. Check back soon.</p>
            {waHref && (
              <a className="btn btn--line btn--sm" href={waHref} target="_blank" rel="noreferrer">
                Message on WhatsApp
              </a>
            )}
          </div>
        ) : (
          <>
            {tab === "home" && featured && (
              <section className="spot">
                <div className="spot__media">
                  <img src={featured.images[0]} alt={featured.name} />
                  <span className="spot__scrim" />
                </div>
                <div className="spot__body">
                  <span className="spot__kicker">
                    <svg className="i" style={{ width: 14, height: 14 }}><use href="#ed-i-spark" /></svg>Featured
                  </span>
                  <h2 className="spot__name">{featured.name}</h2>
                  <p className="spot__desc">{featured.description.split("\n")[0]}</p>
                  <div className="spot__foot">
                    <span className="spot__price money">
                      {formatNaira(featured.price)}
                      {featured.compareAtPrice != null && <s className="money">{formatNaira(featured.compareAtPrice)}</s>}
                    </span>
                    <button className="btn btn--accent" type="button" onClick={() => openItem(featured)}>See it</button>
                  </div>
                </div>
              </section>
            )}

            {tab === "home" ? (
              ORDER.map((t) => {
                const list = byType(t)
                if (!list.length) return null
                const meta = TYPE_META[t]
                return (
                  <section className="rail" key={t}>
                    <div className="rail__head">
                      <h2 className="rail__title">
                        <i style={{ background: `var(--${meta.cls})` }} />
                        {t === "physical" ? "The shop" : t === "event" ? "Events" : t === "appointment" ? "Book a session" : "Downloads"} <small>{list.length}</small>
                      </h2>
                      <button className="rail__see" type="button" onClick={() => setTab(t)}>See all</button>
                    </div>
                    <p className="rail__note">
                      {t === "physical"
                        ? "Made in Lagos, shipped nationwide"
                        : t === "event"
                          ? "Pay once, your QR ticket arrives by email"
                          : t === "appointment"
                            ? "Pick a day and time that suits you"
                            : "Sent to your inbox the moment you pay"}
                    </p>
                    <div className="rail__track">
                      {list.map((it, i) => (
                        <Tile key={it.id} item={it} index={i} onOpen={() => openItem(it)} />
                      ))}
                    </div>
                  </section>
                )
              })
            ) : (
              <section className="rail is-grid" style={{ marginTop: 26 }}>
                <div className="rail__head">
                  <h2 className="rail__title">
                    {TYPE_META[tab].label} <small>{byType(tab).length}</small>
                  </h2>
                </div>
                {byType(tab).length > 0 ? (
                  <div className="rail__track">
                    {byType(tab).map((it, i) => (
                      <Tile key={it.id} item={it} index={i} onOpen={() => openItem(it)} />
                    ))}
                  </div>
                ) : (
                  <div className="none">
                    <span className="none__a"><i /><i /><i /></span>
                    <b>Nothing here yet</b>
                    <p>{store.name} has not added anything to this section.</p>
                    <button className="btn btn--line btn--sm" type="button" onClick={() => setTab("home")}>Back to the store</button>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        <footer className="foot">
          {waHref && (
            <div className="foot__s">
              <a href={waHref} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <svg className="i"><use href="#ed-i-wa" /></svg>
              </a>
            </div>
          )}
          <p>
            {store.name}{store.location ? ` · ${store.location}` : ""}
            {store.email && <><br />{store.email}</>}
          </p>
          <a className="by" href="https://blaqora.store">
            <img src="/blaqora-icon.png" alt="" />Powered by <b>Blaqora</b>
          </a>
        </footer>
      </div>

      {/* Bottom navigation */}
      <nav className="nav" role="tablist" aria-label="Browse this store" ref={navRef}>
        <span className="nav__glider" style={{ width: glider.width, transform: `translateX(${glider.left}px)` }} aria-hidden="true" />
        {NAV_TABS.map((t) => (
          <button
            key={t}
            className="nav__btn"
            role="tab"
            aria-selected={tab === t}
            tabIndex={tab === t ? 0 : -1}
            data-tab={t}
            onClick={() => setTab(t)}
          >
            <svg className="i"><use href={`#ed-i-${t === "home" ? "home" : t === "physical" ? "box" : t === "event" ? "ticket" : t === "appointment" ? "cal" : "dl"}`} /></svg>
            {t === "home" ? "Store" : t === "physical" ? "Shop" : t === "event" ? "Events" : t === "appointment" ? "Book" : "Files"}
          </button>
        ))}
        <button className="nav__btn" type="button" onClick={() => setBagOpen(true)}>
          <svg className="i"><use href="#ed-i-bag" /></svg>Bag
          <span className="nav__dot" hidden={bagCount === 0}>{bagCount}</span>
        </button>
      </nav>

      {/* Search overlay */}
      <div className={`find${findOpen ? " on" : ""}`} role="dialog" aria-modal="true" aria-label="Search this store">
        <div className="find__bar">
          <svg className="i"><use href="#ed-i-search" /></svg>
          <input
            type="search"
            placeholder="What are you looking for?"
            aria-label="Search items"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            autoFocus={findOpen}
          />
          <button className="ghost-btn" type="button" aria-label="Close search" onClick={() => setFindOpen(false)}>
            <svg className="i"><use href="#ed-i-close" /></svg>
          </button>
        </div>
        {(() => {
          const q = findQuery.trim().toLowerCase()
          if (!q) {
            return (
              <>
                <p className="find__hint">Popular right now</p>
                <div className="find__chips">
                  {searchChips.map((c) => (
                    <button key={c} type="button" onClick={() => setFindQuery(c)}>{c}</button>
                  ))}
                </div>
              </>
            )
          }
          const list = items.filter((i) => `${i.name} ${i.description} ${TYPE_META[i.type].label}`.toLowerCase().includes(q))
          return (
            <>
              <p className="find__hint">{list.length ? `${list.length} match${list.length === 1 ? "" : "es"}` : "No match"}</p>
              <div className="find__res">
                {list.length > 0 ? (
                  list.map((i) => (
                    <button
                      key={i.id}
                      className="res"
                      type="button"
                      onClick={() => {
                        setFindOpen(false)
                        openItem(i)
                      }}
                    >
                      <img src={i.images[0]} alt="" />
                      <span className="res__m">
                        <b>{i.name}</b>
                        <small>{TYPE_META[i.type].label}{i.stock === 0 ? " · Sold out" : ""}</small>
                      </span>
                      <span className="res__p money">{formatNaira(i.price)}</span>
                    </button>
                  ))
                ) : (
                  <div className="none">
                    <span className="none__a"><i /><i /><i /></span>
                    <b>Nothing matched &quot;{findQuery}&quot;</b>
                    <p>Try a shorter word, or message {store.name} to ask.</p>
                    {waHref && (
                      <a className="btn btn--wa btn--sm" href={waHref} target="_blank" rel="noreferrer">
                        <svg className="i"><use href="#ed-i-wa" /></svg>Ask {store.name}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </>
          )
        })()}
      </div>

      {/* Item page */}
      <div className={`page${pageItem ? " on" : ""}`} role="dialog" aria-modal="true" aria-label="Item details" onClick={(e) => { if (e.target === e.currentTarget) setPageItem(null) }}>
        <div className="page__inner">
          {pageItem && (
            <ItemPage
              item={pageItem}
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
              heroIndex={heroIndex}
              setHeroIndex={setHeroIndex}
              onClose={() => setPageItem(null)}
              onAdd={addCurrentToBag}
            />
          )}
        </div>
      </div>

      {/* Bag */}
      <section className={`panel${bagOpen ? " on" : ""}`} role="dialog" aria-modal="true" aria-label="Your bag">
        <div className="panel__top">
          <b>Your bag</b>
          <button className="ghost-btn" type="button" aria-label="Close bag" onClick={() => setBagOpen(false)}>
            <svg className="i"><use href="#ed-i-close" /></svg>
          </button>
        </div>
        <div className="panel__scroll">
          {cart.items.length === 0 ? (
            <div className="none">
              <span className="none__a"><i /><i /><i /></span>
              <b>Your bag is empty</b>
              <p>Add something from the store and it will show up here.</p>
              <button className="btn btn--line btn--sm" type="button" onClick={() => setBagOpen(false)}>Keep looking</button>
            </div>
          ) : (
            cart.items.map((line) => {
              const opt = lineOptionText(line)
              return (
                <div className="bagline" key={line.id}>
                  <img src={line.image} alt="" />
                  <div className="bagline__m">
                    <p className="bagline__n">{line.title}</p>
                    {opt && <p className="bagline__o">{opt}</p>}
                    <div className="bagline__r">
                      {line.unique ? (
                        <span className="bagline__o">1 session</span>
                      ) : (
                        <span className="stepper stepper--sm">
                          <button type="button" aria-label="Reduce quantity" onClick={() => updateQty(line.id, -1)}>
                            <svg className="i"><use href="#ed-i-minus" /></svg>
                          </button>
                          <output>{line.quantity}</output>
                          <button type="button" aria-label="Increase quantity" disabled={line.max != null && line.quantity >= line.max} onClick={() => updateQty(line.id, 1)}>
                            <svg className="i"><use href="#ed-i-plus" /></svg>
                          </button>
                        </span>
                      )}
                      <span className="bagline__p money">{formatNaira(line.price * line.quantity)}</span>
                    </div>
                    <button className="rm" type="button" onClick={() => removeLine(line.id)}>Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        {cart.items.length > 0 && (
          <div className="panel__foot">
            <div className="sum">
              <div><span>Subtotal</span><b className="money">{formatNaira(totals.subtotal)}</b></div>
              {totals.needsDelivery && <div><span>Delivery</span><b>Chosen next</b></div>}
              <div className="big"><span>Total</span><b className="money">{formatNaira(totals.subtotal)}</b></div>
            </div>
            <button className="btn btn--accent btn--block" type="button" onClick={startCheckout}>Checkout</button>
          </div>
        )}
      </section>

      {/* Checkout */}
      <section className={`panel${checkoutOpen ? " on" : ""}`} role="dialog" aria-modal="true" aria-label="Checkout">
        <div className="panel__top">
          <button
            className="ghost-btn"
            type="button"
            aria-label="Back to bag"
            onClick={() => {
              setCheckoutOpen(false)
              setBagOpen(true)
            }}
          >
            <svg className="i"><use href="#ed-i-back" /></svg>
          </button>
          <b>Checkout</b>
          <button className="ghost-btn" type="button" aria-label="Close checkout" onClick={() => setCheckoutOpen(false)}>
            <svg className="i"><use href="#ed-i-close" /></svg>
          </button>
        </div>
        <div className="panel__scroll">
              <div className={`step${checkoutStep === 1 ? " on" : order.name ? " done" : ""}`}>
                <button
                  className="step__h"
                  type="button"
                  onClick={() => {
                    if (1 < checkoutStep) setCheckoutStep(1)
                  }}
                >
                  <span className="step__n">
                    {checkoutStep > 1 && order.name ? <svg className="i" style={{ width: 15, height: 15 }}><use href="#ed-i-check" /></svg> : 1}
                  </span>
                  <span className="step__t">
                    <b>Your details</b>
                    {checkoutStep > 1 && order.name && <small>{order.name} · {order.phone}</small>}
                  </span>
                  {checkoutStep > 1 && order.name && <span className="step__edit">Edit</span>}
                </button>
                <div className="step__c">
                  <div className={`f${fieldErrors.name ? " err" : ""}`}>
                    <label htmlFor="ed-k-name">Full name</label>
                    <input id="ed-k-name" autoComplete="name" placeholder="Your name" value={order.name} onChange={(e) => setOrder((o) => ({ ...o, name: e.target.value }))} />
                    <span className="bad">{fieldErrors.name}</span>
                  </div>
                  <div className={`f${fieldErrors.phone ? " err" : ""}`}>
                    <label htmlFor="ed-k-phone">WhatsApp number</label>
                    <input id="ed-k-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" value={order.phone} onChange={(e) => setOrder((o) => ({ ...o, phone: e.target.value }))} />
                    <span className="hint">Used to confirm your order.</span>
                    <span className="bad">{fieldErrors.phone}</span>
                  </div>
                  <div className={`f${fieldErrors.email ? " err" : ""}`}>
                    <label htmlFor="ed-k-email">Email</label>
                    <input id="ed-k-email" type="email" inputMode="email" autoComplete="email" placeholder="you@email.com" value={order.email} onChange={(e) => setOrder((o) => ({ ...o, email: e.target.value }))} />
                    <span className="hint">Receipt{cart.items.some((l) => l.product_type !== "physical") ? ", tickets and files" : ""} go here.</span>
                    <span className="bad">{fieldErrors.email}</span>
                  </div>
                  <button className="btn btn--accent btn--block" type="button" onClick={() => goNext(1)}>Continue</button>
                </div>
              </div>

              <div className={`step${checkoutStep === 2 ? " on" : checkoutStep > 2 ? " done" : ""}`}>
                <button
                  className="step__h"
                  type="button"
                  onClick={() => {
                    if (2 < checkoutStep) setCheckoutStep(2)
                  }}
                >
                  <span className="step__n">
                    {checkoutStep > 2 ? <svg className="i" style={{ width: 15, height: 15 }}><use href="#ed-i-check" /></svg> : 2}
                  </span>
                  <span className="step__t">
                    <b>{totals.needsDelivery ? "Delivery" : "How you get it"}</b>
                    {checkoutStep > 2 && (
                      <small>{!totals.needsDelivery ? "By email" : order.method === "pickup" ? "Pick up in store" : order.address.slice(0, 38)}</small>
                    )}
                  </span>
                  {checkoutStep > 2 && <span className="step__edit">Edit</span>}
                </button>
                <div className="step__c">
                  {!totals.needsDelivery ? (
                    <div className="safe">
                      <svg className="i"><use href="#ed-i-check" /></svg>Nothing to deliver. Everything goes to {order.email || "your email"} after payment.
                    </div>
                  ) : (
                    <>
                      <p className="pick__l" style={{ marginBottom: 9 }}>How would you like to get it?</p>
                      <div className="pick">
                        <button className="pk" type="button" aria-pressed={order.method === "delivery"} onClick={() => setOrder((o) => ({ ...o, method: "delivery" }))}>
                          <span className="pk__t" />
                          <span className="pk__m"><b>Deliver to me</b><small>A dispatch rider brings it to your address.</small></span>
                        </button>
                        <button className="pk" type="button" aria-pressed={order.method === "pickup"} onClick={() => setOrder((o) => ({ ...o, method: "pickup", areaId: null }))}>
                          <span className="pk__t" />
                          <span className="pk__m"><b>Pick up from the store</b>{store.location && <small>{store.location}</small>}</span>
                          <span className="pk__p">Free</span>
                        </button>
                      </div>
                      {order.method === "delivery" && (
                        <>
                          <p className="pick__l" style={{ marginBottom: 9 }}>Where are we delivering to?</p>
                          <div className="pick">
                            {store.deliveryAreas.map((a) => (
                              <button key={a.id} className="pk" type="button" aria-pressed={order.areaId === a.id} onClick={() => setOrder((o) => ({ ...o, areaId: a.id }))}>
                                <span className="pk__t" />
                                <span className="pk__m"><b>{a.name}</b>{a.note && <small>{a.note}</small>}</span>
                                <span className="pk__p money">{formatNaira(a.fee)}</span>
                              </button>
                            ))}
                          </div>
                          <div className={`f${fieldErrors.address ? " err" : ""}`}>
                            <label htmlFor="ed-k-addr">Delivery address</label>
                            <textarea id="ed-k-addr" autoComplete="street-address" placeholder="House number, street, area, landmark" value={order.address} onChange={(e) => setOrder((o) => ({ ...o, address: e.target.value }))} />
                            <span className="bad">{fieldErrors.address}</span>
                          </div>
                          <p className="pick__l" style={{ marginBottom: 9 }}>Shipping Address</p>
                          <div className="f-row">
                            <div className={`f${fieldErrors.state ? " err" : ""}`}>
                              <label htmlFor="ed-k-state">State *</label>
                              <select id="ed-k-state" autoComplete="address-level1" value={order.addressState} onChange={(e) => selectAddressState(e.target.value)}>
                                <option value="">Select state</option>
                                {getStatesList().map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <span className="bad">{fieldErrors.state}</span>
                            </div>
                            <div className={`f${fieldErrors.city ? " err" : ""}`}>
                              <label htmlFor="ed-k-city">City *</label>
                              <select id="ed-k-city" autoComplete="address-level2" value={order.addressCity} disabled={!order.addressState} onChange={(e) => setOrder((o) => ({ ...o, addressCity: e.target.value }))}>
                                <option value="">{order.addressState ? "Select city" : "Select a state first"}</option>
                                {citiesForState.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <span className="bad">{fieldErrors.city}</span>
                            </div>
                          </div>
                          <div className="f">
                            <label htmlFor="ed-k-zip">Postal Code</label>
                            <input id="ed-k-zip" autoComplete="postal-code" inputMode="numeric" placeholder="100001" value={order.addressPostalCode} onChange={(e) => setOrder((o) => ({ ...o, addressPostalCode: e.target.value }))} />
                          </div>
                        </>
                      )}
                    </>
                  )}
                  <div className="f">
                    <label htmlFor="ed-k-note">Note for {store.name} <span style={{ fontWeight: 500, color: "var(--soft)" }}>(optional)</span></label>
                    <textarea id="ed-k-note" placeholder="Anything they should know?" value={order.note} onChange={(e) => setOrder((o) => ({ ...o, note: e.target.value }))} />
                  </div>
                  <button className="btn btn--accent btn--block" type="button" onClick={() => goNext(2)}>Continue</button>
                </div>
              </div>

              <div className={`step${checkoutStep === 3 ? " on" : ""}`}>
                <button className="step__h" type="button" disabled>
                  <span className="step__n">3</span>
                  <span className="step__t"><b>Review and pay</b></span>
                </button>
                <div className="step__c">
                  {cart.items.map((line) => {
                    const opt = lineOptionText(line)
                    return (
                      <div className="sum" key={line.id}>
                        <div>
                          <span>
                            {line.quantity}× {line.title}
                            {opt && <><br /><span style={{ fontSize: 12.5, color: "var(--soft)" }}>{opt}</span></>}
                          </span>
                          <b className="money">{formatNaira(line.price * line.quantity)}</b>
                        </div>
                      </div>
                    )
                  })}
                  <div className="sum">
                    <div><span>Subtotal</span><b className="money">{formatNaira(totals.subtotal)}</b></div>
                    {totals.needsDelivery && (
                      <div><span>{order.method === "pickup" ? "Pickup" : "Delivery"}</span><b className="money">{totals.deliveryFee ? formatNaira(totals.deliveryFee) : "Free"}</b></div>
                    )}
                    <div className="big"><span>Total</span><b className="money">{formatNaira(totals.total)}</b></div>
                  </div>
                  {payError && <p style={{ color: "var(--danger)", fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>{payError}</p>}
                  <div className="safe">
                    <svg className="i"><use href="#ed-i-shield" /></svg>You pay on Paystack&apos;s secure page. Card, transfer or USSD.
                  </div>
                  <button className="btn btn--accent btn--block" type="button" disabled={paying} onClick={pay}>
                    {paying ? "Opening secure payment…" : `Pay ${formatNaira(totals.total)}`}
                  </button>
                </div>
              </div>
        </div>
        <div className="panel__foot">
          <div className="sum" style={{ margin: 0 }}>
            <div className="big" style={{ border: 0, padding: 0 }}>
              <span>{cart.items.reduce((a, l) => a + l.quantity, 0)} item{cart.items.reduce((a, l) => a + l.quantity, 0) === 1 ? "" : "s"}</span>
              <b className="money">{formatNaira(totals.total)}</b>
            </div>
          </div>
        </div>
      </section>

      <div className={`toast${toast ? " on" : ""}`} role="status" aria-live="polite">
        <svg className="i"><use href="#ed-i-check" /></svg>
        <span>{toast}</span>
      </div>
    </div>
  )
}

function Tile({ item, index, onOpen }: { item: EditorialItem; index: number; onOpen: () => void }) {
  const meta = TYPE_META[item.type]
  const soldOut = item.type === "physical" && item.stock === 0
  const lowStock = item.type === "physical" && item.stock != null && item.stock > 0 && item.stock <= 3
  const badge = soldOut ? "Sold out" : lowStock ? `${item.stock} left` : item.compareAtPrice != null ? `Save ${Math.round((1 - item.price / item.compareAtPrice) * 100)}%` : meta.label
  const metaLine =
    item.type === "event" && item.eventDate
      ? { icon: "ed-i-cal", text: item.eventDate }
      : item.type === "appointment" && item.durationLabel
        ? { icon: "ed-i-clock", text: item.durationLabel }
        : item.type === "digital" && item.fileLabel
          ? { icon: "ed-i-dl", text: item.fileLabel }
          : lowStock
            ? { icon: "ed-i-alert", text: `Only ${item.stock} left` }
            : null

  return (
    <button className={`tile${soldOut ? " out" : ""}`} type="button" style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }} onClick={onOpen}>
      <span className="tile__media">
        <img src={item.images[0]} alt={item.name} loading="lazy" decoding="async" />
        <span className={`tile__badge${soldOut ? " tile__badge--out" : lowStock ? " tile__badge--low" : ""}`}>{badge}</span>
        {!soldOut && (
          <span className="tile__add" aria-hidden="true">
            <svg className="i"><use href="#ed-i-plus" /></svg>
          </span>
        )}
      </span>
      <span className="tile__body">
        <span className="tile__name">{item.name}</span>
        <span className="tile__foot">
          <span className="tile__price money">{formatNaira(item.price)}</span>
          {item.compareAtPrice != null && <span className="tile__was money">{formatNaira(item.compareAtPrice)}</span>}
        </span>
        {metaLine && (
          <span className="tile__meta">
            <svg className="i"><use href={`#${metaLine.icon}`} /></svg>{metaLine.text}
          </span>
        )}
      </span>
    </button>
  )
}

function ItemPage({
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
  heroIndex,
  setHeroIndex,
  onClose,
  onAdd,
}: {
  item: EditorialItem
  sel: Selection
  setSel: (updater: (s: Selection) => Selection) => void
  sizes: string[]
  colors: { colorName: string | null; colorHex: string | null }[]
  unitPrice: number
  stepperMax: number
  selectedDay: EditorialItem["days"][number] | null
  bookingReady: boolean
  isSoldOut: boolean
  waHref: string | null
  storeName: string
  heroIndex: number
  setHeroIndex: (i: number) => void
  onClose: () => void
  onAdd: () => void
}) {
  const meta = TYPE_META[item.type]
  const images = item.images.length ? item.images : ["/placeholder.svg"]
  const selectedTier = item.tiers.find((t) => t.id === sel.tierId) ?? null
  const price = item.type === "event" && selectedTier ? selectedTier.price : unitPrice

  function shareItem() {
    const shareData = { title: item.name, text: `${item.name} at ${storeName}`, url: window.location.href }
    const nav = navigator as Navigator & { share?: (d: typeof shareData) => Promise<void> }
    if (nav.share) nav.share(shareData).catch(() => {})
  }

  const buyLabel = item.type === "appointment" ? (bookingReady ? `${sel.dayDate}, ${sel.slotTime}` : "From") : "Total"
  const buyText = item.type === "appointment" ? (bookingReady ? "Add booking" : sel.dayDate ? "Pick a time" : "Pick a date") : "Add to bag"

  return (
    <div className="pdp">
      <div className="hero">
        <div className="page__tools">
          <button className="ghost-btn" type="button" aria-label="Close" onClick={onClose}>
            <svg className="i"><use href="#ed-i-back" /></svg>
          </button>
          <button className="ghost-btn" type="button" aria-label="Share this item" onClick={shareItem}>
            <svg className="i"><use href="#ed-i-share" /></svg>
          </button>
        </div>
        <div
          className="hero__track"
          onScroll={(e) => {
            const el = e.currentTarget
            setHeroIndex(Math.round(el.scrollLeft / el.clientWidth))
          }}
        >
          {images.map((src, i) => (
            <img key={i} src={src} alt={`${item.name} photo ${i + 1}`} />
          ))}
        </div>
        {images.length > 1 && (
          <div className="hero__dots">
            {images.map((_, i) => (
              <i key={i} className={i === heroIndex ? "on" : ""} />
            ))}
          </div>
        )}
        <span className="hero__fade" />
      </div>
      <div className="pdp__body">
        <span className="pdp__kicker" style={{ background: `var(--${meta.cls})`, color: "#0A0A12" }}>
          <svg className="i" style={{ width: 14, height: 14 }}><use href={`#${meta.icon.replace("dl-i-", "ed-i-")}`} /></svg>
          {meta.label}
        </span>
        <h2 className="pdp__name">{item.name}</h2>
        <div className="pdp__price">
          <b className="money">{formatNaira(price)}</b>
          {item.compareAtPrice != null && (
            <>
              <s className="money">{formatNaira(item.compareAtPrice)}</s>
              <em>Save {Math.round((1 - item.price / item.compareAtPrice) * 100)}%</em>
            </>
          )}
        </div>

        {item.type === "physical" &&
          (item.stock == null || item.stock > 3 ? (
            <p className="pdp__fact"><svg className="i"><use href="#ed-i-check" /></svg>In stock, ships in 24 hours</p>
          ) : item.stock > 0 ? (
            <p className="pdp__fact warn"><svg className="i"><use href="#ed-i-alert" /></svg>Only {item.stock} left</p>
          ) : (
            <p className="pdp__fact warn"><svg className="i"><use href="#ed-i-alert" /></svg>Sold out{waHref ? `. Message ${storeName} to restock.` : "."}</p>
          ))}
        {item.type === "event" && (
          <p className="pdp__fact"><svg className="i"><use href="#ed-i-cal" /></svg>{item.eventDate}{item.eventLocation ? ` · ${item.eventLocation}` : ""}</p>
        )}
        {item.type === "appointment" && (
          <p className="pdp__fact"><svg className="i"><use href="#ed-i-clock" /></svg>{item.durationLabel}{item.venue ? ` · ${item.venue}` : ""}</p>
        )}
        {item.type === "digital" && (
          <p className="pdp__fact"><svg className="i"><use href="#ed-i-dl" /></svg>{item.fileLabel ?? "Digital file"}, sent to your email</p>
        )}

        <p className="pdp__desc">{item.description}</p>

        {colors.length > 0 && (
          <div className="set">
            <div className="set__top"><b>Colour</b><em>{sel.colorName}</em></div>
            <div className="set__row">
              {colors.map((c) => (
                <button key={c.colorName} className="dotc" type="button" aria-pressed={c.colorName === sel.colorName} style={{ background: c.colorHex ?? "#ccc" }} aria-label={c.colorName ?? ""} onClick={() => setSel((s) => ({ ...s, colorName: c.colorName }))} />
              ))}
            </div>
          </div>
        )}

        {sizes.length > 0 && (
          <div className="set">
            <div className="set__top"><b>Size</b></div>
            <div className="set__row">
              {sizes.map((s) => {
                const stock = item.variants.filter((v) => v.size === s).reduce((sum, v) => sum + v.stock, 0)
                return (
                  <button key={s} className="chip" type="button" aria-pressed={s === sel.size} disabled={stock <= 0} onClick={() => setSel((sl) => ({ ...sl, size: s, qty: 1 }))}>
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {item.tiers.length > 0 && (
          <div className="set">
            <div className="set__top"><b>Ticket type</b></div>
            <div className="set__row">
              {item.tiers.map((tier) => (
                <button key={tier.id} className="chip" type="button" aria-pressed={tier.id === sel.tierId} disabled={tier.left === 0} onClick={() => setSel((s) => ({ ...s, tierId: tier.id }))}>
                  {tier.name} · {formatNaira(tier.price)}
                </button>
              ))}
            </div>
          </div>
        )}

        {item.type === "appointment" && (
          <>
            <div className="set">
              <div className="set__top"><b>Pick a date</b></div>
              <div className="cal">
                {item.days.map((d) => (
                  <button key={d.date} className="calday" type="button" aria-pressed={d.date === sel.dayDate} disabled={!d.free} onClick={() => setSel((s) => ({ ...s, dayDate: d.date, slotTime: null }))}>
                    <span>{d.dow}</span><b>{d.dateNum}</b>
                  </button>
                ))}
              </div>
            </div>
            {selectedDay && (
              <div className="set">
                <div className="set__top"><b>Pick a time</b></div>
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
          <div className="set">
            <div className="set__top"><b>Quantity</b></div>
            <div className="stepper">
              <button type="button" aria-label="Reduce quantity" disabled={sel.qty <= 1} onClick={() => setSel((s) => ({ ...s, qty: Math.max(1, s.qty - 1) }))}>
                <svg className="i"><use href="#ed-i-minus" /></svg>
              </button>
              <output>{sel.qty}</output>
              <button type="button" aria-label="Increase quantity" disabled={sel.qty >= stepperMax} onClick={() => setSel((s) => ({ ...s, qty: Math.min(stepperMax, s.qty + 1) }))}>
                <svg className="i"><use href="#ed-i-plus" /></svg>
              </button>
            </div>
          </div>
        )}

        <div className="facts">
          {item.type === "digital" ? (
            <div><svg className="i"><use href="#ed-i-dl" /></svg><span><b>Instant delivery.</b> The file reaches your inbox as soon as payment clears.</span></div>
          ) : item.type === "event" ? (
            <div><svg className="i"><use href="#ed-i-ticket" /></svg><span><b>QR ticket by email.</b> Show it at the gate, no printing needed.</span></div>
          ) : item.type === "appointment" ? (
            <div><svg className="i"><use href="#ed-i-cal" /></svg><span><b>Your slot is held</b> once you pay, and {storeName} confirms it.</span></div>
          ) : (
            <div><svg className="i"><use href="#ed-i-truck" /></svg><span><b>Delivery</b> available at checkout.</span></div>
          )}
          <div><svg className="i"><use href="#ed-i-shield" /></svg><span><b>Secure payment.</b> Card, bank transfer or USSD through Paystack.</span></div>
          {waHref && <div><svg className="i"><use href="#ed-i-wa" /></svg><span><b>Not sure?</b> Message {storeName} before you pay.</span></div>}
        </div>

        <div className="buybar on">
          <span className="buybar__t">
            <small>{buyLabel}</small>
            <b className="money">{formatNaira(price * sel.qty)}</b>
          </span>
          <button className="btn btn--accent" type="button" disabled={isSoldOut || !bookingReady} onClick={onAdd}>
            {isSoldOut ? "Sold out" : buyText}
          </button>
        </div>
      </div>
    </div>
  )
}

