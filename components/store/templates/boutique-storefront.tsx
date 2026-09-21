"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createCartStore, type CartItem } from "@/lib/cart-store"
import { validateDetailsStep, validateDeliveryStep } from "@/lib/storefront/validation"
import { computeTotals, type CheckoutState } from "@/lib/storefront/checkout"
import { getStatesList, getCitiesByState, type NigerianState } from "@/lib/nigerian-locations"
import { DaylightIconSprite } from "./daylight-icons"
import { BoutiqueIconSprite } from "./boutique-icons"
import { ItemSheet, type DaylightSelection } from "./daylight-storefront"
import {
  DAYLIGHT_TYPE_META,
  formatNaira,
  type DaylightItem,
  type DaylightStore,
  type DaylightItemType,
  type LiveDeliveryRate,
} from "./daylight-types"
import "./boutique-storefront.css"
import { fontCssVars } from "@/lib/storefront/fonts"

const EMPTY_SELECTION: DaylightSelection = { qty: 1, size: null, colorName: null, tierId: null, dayDate: null, slotTime: null }

type Cat = "all" | DaylightItemType
type Seg = "all" | "sale" | "new"

const CATS: { id: Cat; label: string; icon: string }[] = [
  { id: "physical", label: "Shop", icon: "bt-i-box" },
  { id: "event", label: "Events", icon: "bt-i-ticket" },
  { id: "appointment", label: "Book me", icon: "bt-i-cal" },
  { id: "digital", label: "Downloads", icon: "bt-i-dl" },
]

export function BoutiqueStorefront({ store, items }: { store: DaylightStore; items: DaylightItem[] }) {
  const cartStore = useMemo(() => createCartStore(store.id), [store.id])

  const [cart, setCart] = useState(() => cartStore.getCart())
  const [cat, setCat] = useState<Cat>("all")
  const [seg, setSeg] = useState<Seg>("all")
  const [query, setQuery] = useState("")
  const [savedView, setSavedView] = useState(false)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [heroIndex, setHeroIndex] = useState(0)
  const [nav, setNav] = useState<"home" | "search" | "saved">("home")
  const searchRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

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
    quoteId: null as string | null,
    address: "",
    addressState: "",
    addressCity: "",
    addressPostalCode: "",
    note: "",
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [liveRates, setLiveRates] = useState<LiveDeliveryRate[] | null>(null)
  const [fetchingRates, setFetchingRates] = useState(false)
  const [rateError, setRateError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const onUpdate = () => setCart(cartStore.getCart())
    window.addEventListener("cartUpdated", onUpdate)
    return () => window.removeEventListener("cartUpdated", onUpdate)
  }, [cartStore])

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

  const closeAll = useCallback(() => setPanel("none"), [])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"
  }, [])

  // ---------- Hero rotation ----------
  const heroItems = useMemo(() => items.filter((i) => i.stock !== 0).slice(0, 4), [items])

  useEffect(() => {
    if (heroItems.length < 2) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % heroItems.length), 5200)
    return () => clearInterval(id)
  }, [heroItems.length])

  useEffect(() => {
    if (heroIndex >= heroItems.length) setHeroIndex(0)
  }, [heroItems.length, heroIndex])

  const heroItem = heroItems[heroIndex] ?? null

  // ---------- Category counts + filtering ----------
  const counts = useMemo(() => {
    const c: Record<DaylightItemType, number> = { physical: 0, event: 0, appointment: 0, digital: 0 }
    for (const it of items) c[it.type]++
    return c
  }, [items])

  const visibleCats = CATS.filter((c) => counts[c.id as DaylightItemType] > 0)

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (cat !== "all" && it.type !== cat) return false
      if (seg === "sale" && it.compareAtPrice == null) return false
      if (seg === "new" && it.compareAtPrice != null) return false
      if (savedView && !saved[it.id]) return false
      if (q) {
        const hay = `${it.name} ${it.description} ${DAYLIGHT_TYPE_META[it.type].label}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, cat, seg, savedView, saved, query])

  const gridTitle = savedView ? "Saved items" : query ? "Results" : cat === "all" && seg === "all" ? "Featured" : CATS.find((c) => c.id === cat)?.label ?? "Featured"
  const showClear = cat !== "all" || seg !== "all" || !!query || savedView

  function clearFilters() {
    setCat("all")
    setSeg("all")
    setQuery("")
    setSavedView(false)
    setNav("home")
    if (searchRef.current) searchRef.current.value = ""
  }

  function toggleSave(id: string, name: string) {
    setSaved((s) => {
      const next = { ...s, [id]: !s[id] }
      say(next[id] ? "Saved" : "Removed from saved")
      return next
    })
  }

  function surpriseMe() {
    const pool = items.filter((i) => i.stock !== 0)
    if (pool.length === 0) return
    const pick = pool[Math.floor(Math.random() * pool.length)]
    say("How about this one?")
    setTimeout(() => openItem(pick), 400)
  }

  function goNav(v: "home" | "search" | "saved") {
    setNav(v)
    if (v === "search") {
      searchRef.current?.focus()
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setSavedView(v === "saved")
    gridRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }

  // ---------- Item sheet (identical logic to Daylight/Studio) ----------
  function variantStock(it: DaylightItem, size: string | null, colorName: string | null): number {
    const matches = it.variants.filter((v) => (size == null || v.size === size) && (colorName == null || v.colorName === colorName))
    return matches.reduce((sum, v) => sum + v.stock, 0)
  }

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
      { id: sheetItem.id, title: sheetItem.name, price: unitPrice, product_type: sheetItem.type, images: sheetItem.images },
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

  // ---------- Cart / checkout (identical logic to Daylight/Studio) ----------
  const isLiveRateMode = store.shippingMode !== "manual"
  const selectedLiveRate = liveRates?.find((r) => r.id === order.areaId) ?? null
  const selectedManualArea = store.deliveryAreas.find((a) => a.id === order.areaId)
  const currentAreaName = isLiveRateMode ? (selectedLiveRate?.carrierName ?? null) : (selectedManualArea?.name ?? null)
  const currentAreaFee =
    order.method === "pickup" ? 0 : isLiveRateMode ? (selectedLiveRate?.amount ?? null) : (selectedManualArea?.fee ?? null)

  const totals = computeTotals(cart.items, {
    name: order.name,
    phone: order.phone,
    email: order.email,
    method: order.method,
    areaId: order.areaId,
    areaName: currentAreaName,
    areaFee: currentAreaFee,
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

  function clearStaleQuote() {
    if (isLiveRateMode) {
      setLiveRates(null)
      setRateError(null)
      setOrder((o) => ({ ...o, areaId: null, quoteId: null }))
    }
  }

  function selectAddressState(nextState: string) {
    setOrder((o) => ({ ...o, addressState: nextState, addressCity: "" }))
    clearStaleQuote()
  }

  // A delivery area can carry its own state/city — when it does, checkout
  // auto-fills and locks those fields instead of asking twice. Only applies
  // to manual zones; live rates always ask for the address up front.
  const isAddressStateLocked = !isLiveRateMode && order.method === "delivery" && !!selectedManualArea?.state
  const isAddressCityLocked = isAddressStateLocked && !!selectedManualArea?.city

  function selectDeliveryArea(area: DaylightStore["deliveryAreas"][number]) {
    setOrder((o) => ({
      ...o,
      areaId: area.id,
      ...(area.state ? { addressState: area.state, addressCity: area.city || "" } : {}),
    }))
  }

  async function fetchLiveRates() {
    if (!order.address.trim() || !order.addressState || !order.addressCity) return
    setFetchingRates(true)
    setRateError(null)
    setLiveRates(null)
    setOrder((o) => ({ ...o, areaId: null, quoteId: null }))
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          items: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          dropoff: {
            name: order.name.trim() || "Customer",
            phone: order.phone.trim(),
            email: order.email.trim(),
            address: order.address.trim(),
            state: order.addressState,
            city: order.addressCity,
            postalCode: order.addressPostalCode.trim() || undefined,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not fetch delivery options")
      setLiveRates(data.rates)
      setOrder((o) => ({ ...o, quoteId: data.quoteId }))
    } catch (err: any) {
      setRateError(err.message || "Could not fetch delivery options")
    } finally {
      setFetchingRates(false)
    }
  }

  function selectLiveRate(rate: LiveDeliveryRate) {
    setOrder((o) => ({ ...o, areaId: rate.id }))
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

  function validateStep(step: 1 | 2): boolean {
    const errs: Record<string, string> = {}
    if (step === 1) {
      for (const e of validateDetailsStep(order, store.name)) errs[e.field] = e.message
    } else {
      for (const e of validateDeliveryStep({
        needsDelivery: totals.needsDelivery,
        method: order.method,
        areaFee: currentAreaFee,
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
            areaId: !isLiveRateMode ? (order.areaId ?? undefined) : undefined,
            quoteId: isLiveRateMode ? (order.quoteId ?? undefined) : undefined,
            rateId: isLiveRateMode ? (order.areaId ?? undefined) : undefined,
            address: order.address.trim(),
            state: order.addressState,
            city: order.addressCity,
            postalCode: order.addressPostalCode.trim(),
            note: order.note.trim(),
          },
          callbackUrl: `${window.location.origin}/${store.slug}/order/confirmed?store=${store.id}&template=boutique`,
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
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0)
  const savedCount = Object.values(saved).filter(Boolean).length

  function onSearchInput(value: string) {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setQuery(value)
      setSavedView(false)
      setNav("home")
    }, 170)
  }

  return (
    <div className="boutique-store" style={{ ["--accent" as any]: store.accent, ...fontCssVars(store.fontPairing) }}>
      <DaylightIconSprite />
      <BoutiqueIconSprite />
      <span className="sky" aria-hidden="true" />

      <div className="shell">
        <header className="top4">
          <div className="top4__t">
            <small>{greeting}</small>
            <h1>{store.name}, yours</h1>
          </div>
          <button className="round" type="button" aria-label="Open your bag" onClick={() => setPanel("cart")}>
            <svg className="i"><use href="#bt-i-cart" /></svg>
            <i hidden={cartCount === 0}>{cartCount}</i>
          </button>
        </header>

        <div className="seek">
          <div className="seek__bar">
            <svg className="i"><use href="#bt-i-search" /></svg>
            <input
              ref={searchRef}
              type="search"
              placeholder="Search styles, sessions…"
              aria-label="Search this store"
              defaultValue={query}
              onChange={(e) => onSearchInput(e.target.value)}
            />
          </div>
          <button className="seek__orb" type="button" aria-label="Show me something good" onClick={surpriseMe}>
            <svg className="i"><use href="#bt-i-spark" /></svg>
          </button>
        </div>

        {heroItem && (
          <section className="hero4">
            <div className="hero4__t">
              <span className="hero4__k">
                {heroItem.compareAtPrice ? "On sale now" : DAYLIGHT_TYPE_META[heroItem.type].label === "Shop" ? "New arrival" : DAYLIGHT_TYPE_META[heroItem.type].label}
              </span>
              <span className="hero4__n">{heroItem.name}</span>
              <span className="hero4__p money">{formatNaira(heroItem.price)}</span>
              <button className="hero4__b" type="button" onClick={() => openItem(heroItem)}>
                <svg className="i"><use href="#bt-i-spark" /></svg>See the details
              </button>
            </div>
            <img className="hero4__img" src={heroItem.images[0]} alt={heroItem.name} />
            <div className="hero4__dots">
              {heroItems.map((_, i) => (
                <i key={i} className={i === heroIndex ? "on" : ""} />
              ))}
            </div>
          </section>
        )}

        {visibleCats.length > 0 && (
          <>
            <div className="cathead">
              <h2>Categories</h2>
              <div className="seg" role="group" aria-label="Filter by kind">
                {(["all", "sale", "new"] as Seg[]).map((s) => (
                  <button key={s} type="button" aria-pressed={seg === s} onClick={() => setSeg(s)}>
                    {s === "all" ? "All" : s === "sale" ? "Sale" : "New"}
                  </button>
                ))}
              </div>
            </div>
            <div className="catrow" role="group" aria-label="Browse categories">
              {visibleCats.map((c) => (
                <button key={c.id} className="cat4" type="button" aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? "all" : c.id)}>
                  <span className="cat4__t"><svg className="i"><use href={`#${c.icon}`} /></svg></span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="fhead" ref={gridRef}>
          <h2>{gridTitle}</h2>
          {showClear && (
            <button type="button" onClick={clearFilters}>Clear</button>
          )}
        </div>
        {filteredItems.length > 0 ? (
          <div className="fgrid" aria-live="polite">
            {filteredItems.map((it, i) => (
              <BoutiqueCard
                key={it.id}
                item={it}
                index={i}
                isSaved={!!saved[it.id]}
                onOpen={() => openItem(it)}
                onToggleSave={() => toggleSave(it.id, it.name)}
              />
            ))}
          </div>
        ) : (
          <div className="fgrid">
            <div className="no4">
              <span className="no4__a"><i /><i /><i /></span>
              <b>{savedView ? "Nothing saved yet" : "Nothing here"}</b>
              <p>{savedView ? "Tap the heart on anything you like and it lands here." : `Try another category, or message ${store.name} to ask.`}</p>
              <button className="btn btn--ghost btn--sm" type="button" onClick={clearFilters}>Show everything</button>
            </div>
          </div>
        )}

        <footer className="foot4">
          {waHref && (
            <div className="socs">
              <a href={waHref} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <svg className="i"><use href="#bt-i-wa" /></svg>
              </a>
            </div>
          )}
          <p>
            {store.name}{store.location ? ` · ${store.location}` : ""}
            {store.email && <><br />{store.email}</>}
          </p>
          <a className="by4" href="https://blaqora.store">
            <img src="/blaqora-icon.png" alt="" />Powered by <b>Blaqora</b>
          </a>
        </footer>
      </div>

      <nav className="nav4" role="tablist" aria-label="Store sections">
        <button className="n4" role="tab" aria-selected={nav === "home"} onClick={() => goNav("home")}>
          <svg className="i"><use href="#bt-i-home" /></svg>Home
        </button>
        <button className="n4" role="tab" aria-selected={nav === "search"} onClick={() => goNav("search")}>
          <svg className="i"><use href="#bt-i-search" /></svg>Search
        </button>
        <button className="n4" type="button" onClick={() => setPanel("cart")}>
          <svg className="i"><use href="#bt-i-cart" /></svg>Bag
          <i hidden={cartCount === 0}>{cartCount}</i>
        </button>
        <button className="n4" role="tab" aria-selected={nav === "saved"} onClick={() => goNav("saved")}>
          <svg className="i"><use href="#bt-i-heart" /></svg>Saved
          <i hidden={savedCount === 0}>{savedCount}</i>
        </button>
      </nav>

      <div className={`scrim${panel !== "none" ? " is-on" : ""}`} onClick={closeAll} />

      {/* Item sheet — shared with Daylight/Studio */}
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
      <aside className={`drawer${panel === "cart" ? " is-on" : ""}`} aria-hidden={panel !== "cart"} role="dialog" aria-modal="true" aria-label="Your bag">
        <div className="drawer__head">
          <b>Your bag</b>
          <button className="icon-btn" type="button" aria-label="Close bag" onClick={closeAll}>
            <svg className="i"><use href="#dl-i-close" /></svg>
          </button>
        </div>
        <div className="drawer__body">
          {cart.items.length === 0 ? (
            <div className="nothing">
              <span className="nothing__a"><i /><i /><i /></span>
              <b>Your bag is empty</b>
              <p>Add something from the store and it will show up here.</p>
              <button className="btn btn--ghost btn--sm" type="button" onClick={closeAll}>Keep looking</button>
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
                          <button type="button" aria-label="Increase quantity" disabled={line.max != null && line.quantity >= line.max} onClick={() => updateQty(line.id, 1)}>
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
                <label htmlFor="bt-c-name">Full name</label>
                <input id="bt-c-name" autoComplete="name" placeholder="Your name" value={order.name} onChange={(e) => setOrder((o) => ({ ...o, name: e.target.value }))} />
                <span className="err">{fieldErrors.name}</span>
              </div>
              <div className={`field${fieldErrors.phone ? " is-bad" : ""}`}>
                <label htmlFor="bt-c-phone">WhatsApp number</label>
                <input id="bt-c-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" value={order.phone} onChange={(e) => setOrder((o) => ({ ...o, phone: e.target.value }))} />
                <span className="hint">{store.name} uses this to confirm your order.</span>
                <span className="err">{fieldErrors.phone}</span>
              </div>
              <div className={`field${fieldErrors.email ? " is-bad" : ""}`}>
                <label htmlFor="bt-c-email">Email</label>
                <input id="bt-c-email" type="email" inputMode="email" autoComplete="email" placeholder="you@email.com" value={order.email} onChange={(e) => setOrder((o) => ({ ...o, email: e.target.value }))} />
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
                  {order.method === "delivery" && !isLiveRateMode && (
                    <>
                      <p className="opts__label">Where are we delivering to?</p>
                      <div className="opts" role="group" aria-label="Delivery area">
                        {store.deliveryAreas.map((a) => (
                          <button key={a.id} className="opt-card" type="button" aria-pressed={order.areaId === a.id} onClick={() => selectDeliveryArea(a)}>
                            <span className="opt-card__tick" />
                            <span className="opt-card__main"><b>{a.name}</b>{a.note && <small>{a.note}</small>}</span>
                            <span className="opt-card__price money">{formatNaira(a.fee)}</span>
                          </button>
                        ))}
                      </div>
                      <div className={`field${fieldErrors.address ? " is-bad" : ""}`}>
                        <label htmlFor="bt-c-addr">Delivery address</label>
                        <textarea id="bt-c-addr" autoComplete="street-address" placeholder="House number, street, area, landmark" value={order.address} onChange={(e) => setOrder((o) => ({ ...o, address: e.target.value }))} />
                        <span className="err">{fieldErrors.address}</span>
                      </div>
                      <p className="opts__label">Shipping Address</p>
                      <div className="field-row">
                        <div className={`field${fieldErrors.state ? " is-bad" : ""}`}>
                          <label htmlFor="bt-c-state">State *</label>
                          <select id="bt-c-state" autoComplete="address-level1" value={order.addressState} disabled={isAddressStateLocked} onChange={(e) => selectAddressState(e.target.value)}>
                            <option value="">Select state</option>
                            {getStatesList().map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <span className="err">{fieldErrors.state}</span>
                          {isAddressStateLocked && <span className="hint">Set from your delivery area.</span>}
                        </div>
                        <div className={`field${fieldErrors.city ? " is-bad" : ""}`}>
                          <label htmlFor="bt-c-city">City *</label>
                          <select id="bt-c-city" autoComplete="address-level2" value={order.addressCity} disabled={!order.addressState || isAddressCityLocked} onChange={(e) => setOrder((o) => ({ ...o, addressCity: e.target.value }))}>
                            <option value="">{order.addressState ? "Select city" : "Select a state first"}</option>
                            {citiesForState.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <span className="err">{fieldErrors.city}</span>
                          {isAddressCityLocked && <span className="hint">Set from your delivery area.</span>}
                        </div>
                      </div>
                      <div className="field">
                        <label htmlFor="bt-c-zip">Postal Code</label>
                        <input id="bt-c-zip" autoComplete="postal-code" inputMode="numeric" placeholder="100001" value={order.addressPostalCode} onChange={(e) => setOrder((o) => ({ ...o, addressPostalCode: e.target.value }))} />
                      </div>
                    </>
                  )}
                  {order.method === "delivery" && isLiveRateMode && (
                    <>
                      <div className={`field${fieldErrors.address ? " is-bad" : ""}`}>
                        <label htmlFor="bt-c-addr">Delivery address</label>
                        <textarea id="bt-c-addr" autoComplete="street-address" placeholder="House number, street, area, landmark" value={order.address} onChange={(e) => { setOrder((o) => ({ ...o, address: e.target.value })); clearStaleQuote() }} />
                        <span className="err">{fieldErrors.address}</span>
                      </div>
                      <p className="opts__label">Shipping Address</p>
                      <div className="field-row">
                        <div className={`field${fieldErrors.state ? " is-bad" : ""}`}>
                          <label htmlFor="bt-c-state">State *</label>
                          <select id="bt-c-state" autoComplete="address-level1" value={order.addressState} onChange={(e) => selectAddressState(e.target.value)}>
                            <option value="">Select state</option>
                            {getStatesList().map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <span className="err">{fieldErrors.state}</span>
                        </div>
                        <div className={`field${fieldErrors.city ? " is-bad" : ""}`}>
                          <label htmlFor="bt-c-city">City *</label>
                          <select id="bt-c-city" autoComplete="address-level2" value={order.addressCity} disabled={!order.addressState} onChange={(e) => { setOrder((o) => ({ ...o, addressCity: e.target.value })); clearStaleQuote() }}>
                            <option value="">{order.addressState ? "Select city" : "Select a state first"}</option>
                            {citiesForState.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <span className="err">{fieldErrors.city}</span>
                        </div>
                      </div>
                      <div className="field">
                        <label htmlFor="bt-c-zip">Postal Code</label>
                        <input id="bt-c-zip" autoComplete="postal-code" inputMode="numeric" placeholder="100001" value={order.addressPostalCode} onChange={(e) => setOrder((o) => ({ ...o, addressPostalCode: e.target.value }))} />
                      </div>

                      {!liveRates && (
                        <button
                          type="button"
                          className="btn btn--accent btn--block"
                          disabled={!order.address.trim() || !order.addressState || !order.addressCity || fetchingRates}
                          onClick={fetchLiveRates}
                        >
                          {fetchingRates ? "Finding delivery options…" : "See delivery options"}
                        </button>
                      )}
                      {rateError && (
                        <div className="field is-bad" style={{ marginTop: 8 }}>
                          <span className="err" style={{ display: "block" }}>{rateError}</span>
                        </div>
                      )}
                      {liveRates && (
                        <>
                          <p className="opts__label">Choose a delivery option</p>
                          <div className="opts" role="group" aria-label="Delivery area">
                            {liveRates.map((r) => (
                              <button key={r.id} className="opt-card" type="button" aria-pressed={order.areaId === r.id} onClick={() => selectLiveRate(r)}>
                                <span className="opt-card__tick" />
                                {r.carrierLogo && (
                                  <img
                                    src={r.carrierLogo}
                                    alt=""
                                    style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain", flex: "none" }}
                                    onError={(e) => { e.currentTarget.style.display = "none" }}
                                  />
                                )}
                                <span className="opt-card__main"><b>{r.carrierName}</b>{r.etaLabel && <small>{r.etaLabel}</small>}</span>
                                <span className="opt-card__price money">{formatNaira(r.amount)}</span>
                              </button>
                            ))}
                          </div>
                          <button type="button" className="btn btn--ghost btn--sm" style={{ marginTop: 10 }} onClick={fetchLiveRates} disabled={fetchingRates}>
                            {fetchingRates ? "Refreshing…" : "Refresh options"}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
              <div className="field">
                <label htmlFor="bt-c-note">Note for {store.name} <span style={{ fontWeight: 500, color: "var(--soft)" }}>(optional)</span></label>
                <textarea id="bt-c-note" placeholder="Anything they should know?" value={order.note} onChange={(e) => setOrder((o) => ({ ...o, note: e.target.value }))} />
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

function BoutiqueCard({
  item,
  index,
  isSaved,
  onOpen,
  onToggleSave,
}: {
  item: DaylightItem
  index: number
  isSaved: boolean
  onOpen: () => void
  onToggleSave: () => void
}) {
  const meta = DAYLIGHT_TYPE_META[item.type]
  const soldOut = item.type === "physical" && item.stock === 0
  const lowStock = item.type === "physical" && item.stock != null && item.stock > 0 && item.stock <= 3
  const onSale = item.compareAtPrice != null

  return (
    <button className={`f4${soldOut ? " out" : ""}`} type="button" style={{ animationDelay: `${Math.min(index * 45, 380)}ms` }} onClick={onOpen}>
      <span className="f4__m">
        <img src={item.images[0]} alt={item.name} loading="lazy" decoding="async" />
        {soldOut ? (
          <span className="f4__tag">Sold out</span>
        ) : lowStock ? (
          <span className="f4__tag f4__tag--low">{item.stock} left</span>
        ) : onSale ? (
          <span className="f4__tag f4__tag--low">Sale</span>
        ) : (
          <span className="f4__tag">{meta.label}</span>
        )}
        <span
          className="f4__h"
          role="button"
          tabIndex={0}
          aria-pressed={isSaved}
          aria-label={`Save ${item.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleSave()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              e.stopPropagation()
              onToggleSave()
            }
          }}
        >
          <svg className="i"><use href="#bt-i-heart" /></svg>
        </span>
      </span>
      <span className="f4__b">
        <span className="f4__n">{item.name}</span>
        <span className="f4__r">
          <span className="f4__p money">
            {formatNaira(item.price)}
            {item.compareAtPrice != null && <s className="money">{formatNaira(item.compareAtPrice)}</s>}
          </span>
          {!soldOut && (
            <span className="f4__add" aria-hidden="true">
              <svg className="i"><use href="#dl-i-plus" /></svg>
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
