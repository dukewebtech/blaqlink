"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createCartStore, type CartItem } from "@/lib/cart-store"
import { validateDetailsStep, validateDeliveryStep } from "@/lib/storefront/validation"
import { computeTotals, type CheckoutState } from "@/lib/storefront/checkout"
import { getStatesList, getCitiesByState, type NigerianState } from "@/lib/nigerian-locations"
import { OraIconSprite } from "./ora-icons"
import { ItemSheet, type DaylightSelection } from "./daylight-storefront"
import {
  DAYLIGHT_TYPE_META,
  formatNaira,
  type DaylightItem,
  type DaylightStore,
  type DaylightItemType,
  type LiveDeliveryRate,
} from "./daylight-types"
import "./ora-storefront.css"
import { fontCssVars } from "@/lib/storefront/fonts"

type CategoryFilter = "all" | DaylightItemType
type NavKey = "home" | "categories" | "search" | "saved"

const EMPTY_SELECTION: DaylightSelection = { qty: 1, size: null, colorName: null, tierId: null, dayDate: null, slotTime: null }

const CATEGORY_LABEL: Record<CategoryFilter, string> = {
  all: "All",
  physical: "Shop",
  event: "Events",
  appointment: "Book me",
  digital: "Downloads",
}

export function OraStorefront({ store, items }: { store: DaylightStore; items: DaylightItem[] }) {
  const cartStore = useMemo(() => createCartStore(store.id), [store.id])

  const [cart, setCart] = useState(() => cartStore.getCart())
  // null = home. Set once a shopper drills into one store type (via "See all",
  // the filter sheet, or the nav categories directory).
  const [viewType, setViewType] = useState<DaylightItemType | null>(null)
  const [subCategory, setSubCategory] = useState<string | null>(null)
  // Which type is showing its categories inside the filter sheet's second step.
  const [filterStep, setFilterStep] = useState<DaylightItemType | null>(null)
  const [queryInput, setQueryInput] = useState("")
  const [query, setQuery] = useState("")
  const [nav, setNav] = useState<NavKey>("home")
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [savedView, setSavedView] = useState(false)

  const [sheetItem, setSheetItem] = useState<DaylightItem | null>(null)
  const [sel, setSel] = useState<DaylightSelection>(EMPTY_SELECTION)
  const [panel, setPanel] = useState<"none" | "sheet" | "cart" | "checkout" | "filter" | "categories">("none")
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
  const [isTopOn, setIsTopOn] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onUpdate = () => setCart(cartStore.getCart())
    window.addEventListener("cartUpdated", onUpdate)
    return () => window.removeEventListener("cartUpdated", onUpdate)
  }, [cartStore])

  useEffect(() => {
    const onScroll = () => setIsTopOn(window.scrollY > 8)
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

  const counts = useMemo(() => {
    const c: Record<CategoryFilter, number> = { all: items.length, physical: 0, event: 0, appointment: 0, digital: 0 }
    for (const it of items) c[it.type]++
    return c
  }, [items])

  // Only types that actually have at least one item are ever shown anywhere.
  const activeTypes = useMemo(
    () => (["physical", "event", "appointment", "digital"] as DaylightItemType[]).filter((k) => counts[k] > 0),
    [counts],
  )
  const isMultiType = activeTypes.length > 1
  const singleType: DaylightItemType | null = activeTypes.length === 1 ? activeTypes[0] : null
  // The type whose vendor categories should show as pills right now: whichever
  // type a shopper has drilled into, or — when the store only sells one type
  // to begin with — that type itself.
  const effectiveType = viewType ?? singleType

  function itemsOfType(type: DaylightItemType): DaylightItem[] {
    return items.filter((it) => it.type === type)
  }

  function categoriesForType(type: DaylightItemType): { name: string; count: number }[] {
    const byName = new Map<string, number>()
    for (const it of items) {
      if (it.type !== type || !it.categoryName) continue
      byName.set(it.categoryName, (byName.get(it.categoryName) ?? 0) + 1)
    }
    return [...byName.entries()].map(([name, count]) => ({ name, count }))
  }

  // Same as categoriesForType, but with a tile image per category — the
  // vendor's own category photo if they set one, else the first item's photo
  // in that category. Only used by the nav categories directory.
  function categoryTilesForType(type: DaylightItemType): { name: string; count: number; image: string }[] {
    const byName = new Map<string, { count: number; image: string | null }>()
    for (const it of items) {
      if (it.type !== type || !it.categoryName) continue
      const existing = byName.get(it.categoryName)
      if (existing) {
        existing.count++
        if (!existing.image) existing.image = it.categoryImageUrl || it.images[0] || null
      } else {
        byName.set(it.categoryName, { count: 1, image: it.categoryImageUrl || it.images[0] || null })
      }
    }
    return [...byName.entries()].map(([name, v]) => ({ name, count: v.count, image: v.image || "/placeholder.svg" }))
  }

  const categoriesForEffectiveType = effectiveType ? categoriesForType(effectiveType) : []
  const showCategoryPills = categoriesForEffectiveType.length > 1
  const categoriesForFilterStep = filterStep ? categoriesForType(filterStep) : []
  const typesWithCategories = activeTypes.filter((t) => categoriesForType(t).length > 0)

  function matchesQuery(it: DaylightItem, q: string): boolean {
    if (!q) return true
    const label = DAYLIGHT_TYPE_META[it.type].label
    return `${it.name} ${it.description} ${label}`.toLowerCase().includes(q)
  }

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return items.filter((it) => matchesQuery(it, q))
  }, [items, query])

  const savedItemsList = useMemo(() => items.filter((it) => saved[it.id]), [items, saved])

  // Items for the current drill-in (a specific type via "See all", the filter
  // sheet, or the nav directory) or — when there's only one type — the home view.
  const scopedItems = useMemo(() => {
    if (!effectiveType) return []
    return items.filter((it) => it.type === effectiveType && (!subCategory || it.categoryName === subCategory))
  }, [items, effectiveType, subCategory])

  function openType(type: DaylightItemType) {
    setViewType(type)
    setSubCategory(null)
    setSavedView(false)
    setNav("home")
    setPanel("none")
    setFilterStep(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function backToHome() {
    setViewType(null)
    setSubCategory(null)
  }

  function resetFilters() {
    setViewType(null)
    setSubCategory(null)
    setSavedView(false)
    setNav("home")
  }

  function openFilterSheet() {
    setFilterStep(null)
    setPanel("filter")
  }

  function applyFilterCategory(type: DaylightItemType, categoryName: string | null) {
    setViewType(type)
    setSubCategory(categoryName)
    setSavedView(false)
    setNav("home")
    setPanel("none")
    setFilterStep(null)
  }

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
    say("Added to bag")
  }

  // ---------- Bag ----------
  const isLiveRateMode = store.shippingMode !== "manual"
  const selectedLiveRate = liveRates?.find((r) => r.id === order.areaId) ?? null
  const selectedDeliveryArea = store.deliveryAreas.find((a) => a.id === order.areaId)
  const currentAreaName = isLiveRateMode ? (selectedLiveRate?.carrierName ?? null) : (selectedDeliveryArea?.name ?? null)
  const currentAreaFee =
    order.method === "pickup" ? 0 : isLiveRateMode ? (selectedLiveRate?.amount ?? null) : (selectedDeliveryArea?.fee ?? null)

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
  const isAddressStateLocked = !isLiveRateMode && order.method === "delivery" && !!selectedDeliveryArea?.state
  const isAddressCityLocked = isAddressStateLocked && !!selectedDeliveryArea?.city

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
    if (line) say("Removed from bag")
  }

  function toggleSave(id: string) {
    setSaved((s) => {
      const next = { ...s, [id]: !s[id] }
      say(next[id] ? "Saved" : "Removed from saved")
      return next
    })
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
          callbackUrl: `${window.location.origin}/${store.slug}/order/confirmed?store=${store.id}&template=ora`,
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

  // ---------- Nav ----------
  function goHome() {
    setNav("home")
    setSavedView(false)
    setViewType(null)
    setSubCategory(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function goCategories() {
    setPanel("categories")
  }

  function goSearch() {
    setNav("search")
    setSavedView(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
    setTimeout(() => searchRef.current?.focus(), 380)
  }

  function goSaved() {
    setNav("saved")
    setSavedView(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0)
  const savedCount = Object.values(saved).filter(Boolean).length

  return (
    <div className="ora-store" style={{ ["--accent" as any]: store.accent, ...fontCssVars(store.fontPairing) }}>
      <OraIconSprite />

      <header className={`top${isTopOn ? " is-on" : ""}`}>
        <div className="top__inner">
          <div className="top__brand">
            {store.avatarUrl ? (
              <img className="top__logo" src={store.avatarUrl} alt="" />
            ) : (
              <div className="top__logo top__logo--fallback" style={{ background: store.accent }}>
                {store.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="top__brand-text">
              <span className="top__name">{store.name}</span>
              {store.location && <span className="top__meta">{store.location}</span>}
            </div>
          </div>
          <div className="top__actions">
            <button className={`icon-btn${savedCount > 0 ? " is-saved" : ""}`} type="button" aria-label="Saved items" onClick={goSaved}>
              <svg className="i"><use href="#or-i-heart" /></svg>
            </button>
            <button className="icon-btn" type="button" aria-label="Your bag" onClick={() => setPanel("cart")}>
              <svg className="i"><use href="#or-i-cart" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          {store.location && <div className="eyebrow">{store.location}</div>}
          <h1>{store.name}</h1>
          <p className="hero-copy">{store.bio || `Everything from ${store.name}, all in one place.`}</p>
        </section>

        {items.length === 0 ? (
          <div className="section">
            <div className="empty-state">
              <span className="empty-state__art"><i /><i /><i /></span>
              <strong>Nothing here yet</strong>
              {store.name} hasn&apos;t listed anything yet. Check back soon.
            </div>
          </div>
        ) : (
          <>
            <section className="search">
              <label className="search-box">
                <svg className="i"><use href="#or-i-search" /></svg>
                <input
                  ref={searchRef}
                  type="search"
                  placeholder={`Search ${store.name}`}
                  aria-label="Search items"
                  autoComplete="off"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                />
              </label>
            </section>

            {query.trim() ? (
              <section className="section">
                <div className="section-heading">
                  <h2>Results</h2>
                  <span>{(searchResults ?? []).length} {(searchResults ?? []).length === 1 ? "item" : "items"}</span>
                </div>
                {searchResults && searchResults.length > 0 ? (
                  <div className="product-grid" aria-live="polite">
                    {searchResults.map((it, i) => (
                      <OraCard key={it.id} item={it} index={i} isSaved={!!saved[it.id]} onOpen={() => openItem(it)} onToggleSave={() => toggleSave(it.id)} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-state__art"><i /><i /><i /></span>
                    <strong>No match for &quot;{query}&quot;</strong>
                    Check the spelling, or browse everything in the store.
                    <div>
                      <button className="btn btn--outline btn--sm" type="button" onClick={() => { setQueryInput(""); setQuery("") }}>
                        Show all items
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : savedView ? (
              <section className="section">
                <div className="section-heading">
                  <h2>Saved</h2>
                </div>
                {savedItemsList.length > 0 ? (
                  <div className="product-grid" aria-live="polite">
                    {savedItemsList.map((it, i) => (
                      <OraCard key={it.id} item={it} index={i} isSaved onOpen={() => openItem(it)} onToggleSave={() => toggleSave(it.id)} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-state__art"><i /><i /><i /></span>
                    <strong>Nothing saved yet</strong>
                    Tap the heart on anything you like and it lands here.
                    <div>
                      <button className="btn btn--outline btn--sm" type="button" onClick={goHome}>
                        Show all items
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : effectiveType ? (
              <section className="section">
                {viewType && (
                  <button className="back-link" type="button" onClick={backToHome}>
                    <svg className="i" style={{ width: 16, height: 16 }}><use href="#or-i-back" /></svg> Back
                  </button>
                )}
                <div className="section-heading" style={viewType ? { marginTop: 10 } : undefined}>
                  <h2>{viewType ? CATEGORY_LABEL[viewType] : "Featured"}</h2>
                  <span>{scopedItems.length} {scopedItems.length === 1 ? "item" : "items"}</span>
                </div>
                {showCategoryPills && (
                  <div className="category-row" role="group" aria-label="Filter by category">
                    <button className={`category${!subCategory ? " active" : ""}`} type="button" aria-pressed={!subCategory} onClick={() => setSubCategory(null)}>
                      All <b>{itemsOfType(effectiveType).length}</b>
                    </button>
                    {categoriesForEffectiveType.map((c) => (
                      <button key={c.name} className={`category${subCategory === c.name ? " active" : ""}`} type="button" aria-pressed={subCategory === c.name} onClick={() => setSubCategory(c.name)}>
                        {c.name} <b>{c.count}</b>
                      </button>
                    ))}
                  </div>
                )}
                {scopedItems.length > 0 ? (
                  <div className="product-grid" aria-live="polite" style={showCategoryPills ? { marginTop: 18 } : undefined}>
                    {scopedItems.map((it, i) => (
                      <OraCard key={it.id} item={it} index={i} isSaved={!!saved[it.id]} onOpen={() => openItem(it)} onToggleSave={() => toggleSave(it.id)} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-state__art"><i /><i /><i /></span>
                    <strong>Nothing in this category yet</strong>
                    {store.name} has other items you might like.
                    <div>
                      <button className="btn btn--outline btn--sm" type="button" onClick={() => setSubCategory(null)}>
                        Show all {CATEGORY_LABEL[effectiveType]}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <>
                <section className="section browse-row">
                  <button
                    className={`icon-btn filter-btn${subCategory ? " is-active" : ""}`}
                    type="button"
                    aria-label="Filter by store type and category"
                    onClick={openFilterSheet}
                  >
                    <svg className="i" style={{ width: 18, height: 18 }}><use href="#or-i-filter" /></svg>
                    {subCategory && <span className="filter-btn__dot" />}
                  </button>
                </section>
                {activeTypes.map((type) => {
                  const list = itemsOfType(type)
                  const preview = list.slice(0, 6)
                  return (
                    <section className="section" key={type}>
                      <div className="section-heading">
                        <h2>{CATEGORY_LABEL[type]}</h2>
                        {list.length > 6 && (
                          <button className="section-link" type="button" onClick={() => openType(type)}>
                            See all →
                          </button>
                        )}
                      </div>
                      <div className="product-grid" aria-live="polite">
                        {preview.map((it, i) => (
                          <OraCard key={it.id} item={it} index={i} isSaved={!!saved[it.id]} onOpen={() => openItem(it)} onToggleSave={() => toggleSave(it.id)} />
                        ))}
                      </div>
                    </section>
                  )
                })}
              </>
            )}
          </>
        )}
      </main>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          <button className={`nav-item${nav === "home" ? " active" : ""}`} type="button" onClick={goHome}>
            <svg className="i"><use href="#or-i-home" /></svg>
            Home
          </button>
          <button className="nav-item" type="button" onClick={goCategories}>
            <svg className="i"><use href="#or-i-grid" /></svg>
            Categories
          </button>
          <button className={`nav-item${nav === "search" ? " active" : ""}`} type="button" onClick={goSearch}>
            <svg className="i"><use href="#or-i-search" /></svg>
            Search
          </button>
          <button className={`nav-item${nav === "saved" ? " active" : ""}`} type="button" onClick={goSaved}>
            <svg className="i"><use href="#or-i-heart" /></svg>
            <span className="nav-badge" hidden={savedCount === 0}>{savedCount}</span>
            Saved
          </button>
          <button className="nav-item" type="button" onClick={() => setPanel("cart")}>
            <svg className="i"><use href="#or-i-cart" /></svg>
            <span className="nav-badge" hidden={cartCount === 0}>{cartCount}</span>
            Bag
          </button>
        </div>
      </nav>

      <div className={`scrim${panel !== "none" ? " is-on" : ""}`} onClick={closeAll} />

      {/* Filter: pick a store type, then (optionally) a category within it */}
      <div className={`cart-sheet${panel === "filter" ? " is-on" : ""}`} role="dialog" aria-modal="true" aria-hidden={panel !== "filter"} aria-label="Filter">
        <div className="cart-handle" />
        <div className="cart-title">
          {filterStep && (
            <button className="icon-btn" type="button" aria-label="Back" style={{ marginLeft: -8, marginRight: 4 }} onClick={() => setFilterStep(null)}>
              <svg className="i"><use href="#or-i-back" /></svg>
            </button>
          )}
          <h2 style={{ flex: 1 }}>{filterStep ? CATEGORY_LABEL[filterStep] : "Filter"}</h2>
          <button type="button" onClick={closeAll}>Close</button>
        </div>
        <div className="cart-sheet__scroll">
          {!filterStep ? (
            <div className="category-row category-row--wrap" role="group" aria-label="Choose a store type">
              {activeTypes.map((type) => (
                <button
                  key={type}
                  className="category"
                  type="button"
                  onClick={() => {
                    const cats = categoriesForType(type)
                    if (cats.length > 1) setFilterStep(type)
                    else applyFilterCategory(type, null)
                  }}
                >
                  {CATEGORY_LABEL[type]} <b>{counts[type]}</b>
                </button>
              ))}
            </div>
          ) : (
            <div className="category-row category-row--wrap" role="group" aria-label="Choose a category">
              <button className="category" type="button" onClick={() => applyFilterCategory(filterStep, null)}>
                All {CATEGORY_LABEL[filterStep]} <b>{counts[filterStep]}</b>
              </button>
              {categoriesForFilterStep.map((c) => (
                <button key={c.name} className="category" type="button" onClick={() => applyFilterCategory(filterStep, c.name)}>
                  {c.name} <b>{c.count}</b>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Categories directory (nav) */}
      <div className={`cart-sheet${panel === "categories" ? " is-on" : ""}`} role="dialog" aria-modal="true" aria-hidden={panel !== "categories"} aria-label="Categories">
        <div className="cart-handle" />
        <div className="cart-title">
          <h2>Categories</h2>
          <button type="button" onClick={closeAll}>Close</button>
        </div>
        <div className="cart-sheet__scroll">
          {typesWithCategories.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <strong>No categories yet</strong>
              {store.name} hasn&apos;t organised items into categories yet.
            </div>
          ) : (
            typesWithCategories.map((type) => {
              const cats = categoryTilesForType(type)
              const total = itemsOfType(type).length
              return (
                <div className="cat-group" key={type}>
                  <div className="cat-group__head">
                    <b>{CATEGORY_LABEL[type]}</b>
                    <button className="section-link" type="button" onClick={() => openType(type)}>
                      See all ({total})
                    </button>
                  </div>
                  <div className="cat-tile-grid">
                    {cats.map((c) => (
                      <button key={c.name} className="cat-tile" type="button" onClick={() => applyFilterCategory(type, c.name)}>
                        <span className="cat-tile__image">
                          <img src={c.image} alt="" loading="lazy" decoding="async" />
                        </span>
                        <span className="cat-tile__name">{c.name}</span>
                        <span className="cat-tile__count">{c.count} {c.count === 1 ? "item" : "items"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Item sheet */}
      <div className={`item-sheet${panel === "sheet" ? " is-on" : ""}`} role="dialog" aria-modal="true" aria-hidden={panel !== "sheet"} aria-label="Item details">
        <div className="cart-handle" />
        <button className="icon-btn item-sheet__close" type="button" aria-label="Close" onClick={closeAll}>
          <svg className="i"><use href="#or-i-close" /></svg>
        </button>
        <div className="item-sheet__scroll">
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
              waHref={store.whatsappNumber ? `https://wa.me/${store.whatsappNumber}` : null}
              storeName={store.name}
              onAdd={addCurrentToCart}
            />
          )}
        </div>
      </div>

      {/* Bag */}
      <div className={`cart-sheet${panel === "cart" ? " is-on" : ""}`} role="dialog" aria-modal="true" aria-hidden={panel !== "cart"} aria-label="Your bag">
        <div className="cart-handle" />
        <div className="cart-title">
          <h2>Your bag</h2>
          <button type="button" onClick={closeAll}>Close</button>
        </div>
        <div className="cart-sheet__scroll">
          <div className="cart-items">
            {cart.items.length === 0 ? (
              <p className="cart-empty">
                <strong>Your bag is empty.</strong>
                Browse {store.name} and add something you like.
              </p>
            ) : (
              cart.items.map((line) => {
                const opt = lineOptionText(line)
                return (
                  <div className="cart-line" key={line.id}>
                    <img src={line.image} alt="" />
                    <div className="cart-line-main">
                      <p className="cart-line-name">{line.title}</p>
                      {opt && <p className="cart-line-opt">{opt}</p>}
                      <div className="cart-line-row">
                        {line.unique ? (
                          <span className="cart-line-opt">1 booking</span>
                        ) : (
                          <span className="quantity">
                            <button type="button" aria-label="Reduce quantity" onClick={() => updateQty(line.id, -1)}>
                              <svg className="i" style={{ width: 14, height: 14 }}><use href="#or-i-minus" /></svg>
                            </button>
                            <span>{line.quantity}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={line.max != null && line.quantity >= line.max}
                              onClick={() => updateQty(line.id, 1)}
                            >
                              <svg className="i" style={{ width: 14, height: 14 }}><use href="#or-i-plus" /></svg>
                            </button>
                          </span>
                        )}
                        <span className="cart-line-price money">{formatNaira(line.price * line.quantity)}</span>
                      </div>
                      <button className="cart-line-remove" type="button" onClick={() => removeLine(line.id)}>Remove</button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {cart.items.length > 0 && (
            <>
              <div className="cart-total">
                <span>Subtotal</span>
                <strong className="money">{formatNaira(totals.subtotal)}</strong>
              </div>
              <button className="checkout-button" type="button" onClick={startCheckout}>
                Continue to checkout · {formatNaira(totals.subtotal)}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Checkout */}
      <div className={`cart-sheet${panel === "checkout" ? " is-on" : ""}`} role="dialog" aria-modal="true" aria-hidden={panel !== "checkout"} aria-label="Checkout">
        <div className="cart-handle" />
        <div className="checkout-head">
          <button
            className="icon-btn"
            type="button"
            aria-label="Go back"
            style={{ visibility: checkoutStep === 1 ? "hidden" : "visible" }}
            onClick={() => setCheckoutStep((s) => (s === 3 ? 2 : 1))}
          >
            <svg className="i"><use href="#or-i-back" /></svg>
          </button>
          <b>{checkoutStep === 1 ? "Your details" : checkoutStep === 2 ? (totals.needsDelivery ? "Delivery" : "How to receive it") : "Review and pay"}</b>
          <button className="icon-btn" type="button" aria-label="Close checkout" onClick={closeAll}>
            <svg className="i"><use href="#or-i-close" /></svg>
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
        <div className="cart-sheet__scroll" style={{ paddingTop: 0 }}>
          {checkoutStep === 1 && (
            <div className="form">
              <div className={`field${fieldErrors.name ? " is-bad" : ""}`}>
                <label htmlFor="or-c-name">Full name</label>
                <input id="or-c-name" autoComplete="name" placeholder="Your name" value={order.name} onChange={(e) => setOrder((o) => ({ ...o, name: e.target.value }))} />
                <span className="err">{fieldErrors.name}</span>
              </div>
              <div className={`field${fieldErrors.phone ? " is-bad" : ""}`}>
                <label htmlFor="or-c-phone">WhatsApp number</label>
                <input id="or-c-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" value={order.phone} onChange={(e) => setOrder((o) => ({ ...o, phone: e.target.value }))} />
                <span className="hint">{store.name} uses this to confirm your order.</span>
                <span className="err">{fieldErrors.phone}</span>
              </div>
              <div className={`field${fieldErrors.email ? " is-bad" : ""}`}>
                <label htmlFor="or-c-email">Email</label>
                <input id="or-c-email" type="email" inputMode="email" autoComplete="email" placeholder="you@email.com" value={order.email} onChange={(e) => setOrder((o) => ({ ...o, email: e.target.value }))} />
                <span className="hint">Your receipt{cart.items.some((l) => l.product_type !== "physical") ? ", tickets and files" : ""} go here.</span>
                <span className="err">{fieldErrors.email}</span>
              </div>
            </div>
          )}
          {checkoutStep === 2 && (
            <div className="form">
              {!totals.needsDelivery ? (
                <div className="pay-note" style={{ margin: 0 }}>
                  <svg className="i"><use href="#or-i-check" /></svg>
                  <span>
                    Nothing to deliver. Your {cart.items.some((l) => l.product_type === "event") ? "tickets" : cart.items.some((l) => l.product_type === "appointment") ? "booking confirmation" : "files"} will be sent to <b>{order.email || "your email"}</b> right after payment.
                  </span>
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
                        <label htmlFor="or-c-addr">Delivery address</label>
                        <textarea id="or-c-addr" autoComplete="street-address" placeholder="House number, street, area, landmark" value={order.address} onChange={(e) => setOrder((o) => ({ ...o, address: e.target.value }))} />
                        <span className="err">{fieldErrors.address}</span>
                      </div>
                      <p className="opts__label">Shipping Address</p>
                      <div className="field-row">
                        <div className={`field${fieldErrors.state ? " is-bad" : ""}`}>
                          <label htmlFor="or-c-state">State *</label>
                          <select id="or-c-state" autoComplete="address-level1" value={order.addressState} disabled={isAddressStateLocked} onChange={(e) => selectAddressState(e.target.value)}>
                            <option value="">Select state</option>
                            {getStatesList().map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <span className="err">{fieldErrors.state}</span>
                          {isAddressStateLocked && <span className="hint">Set from your delivery area.</span>}
                        </div>
                        <div className={`field${fieldErrors.city ? " is-bad" : ""}`}>
                          <label htmlFor="or-c-city">City *</label>
                          <select id="or-c-city" autoComplete="address-level2" value={order.addressCity} disabled={!order.addressState || isAddressCityLocked} onChange={(e) => setOrder((o) => ({ ...o, addressCity: e.target.value }))}>
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
                        <label htmlFor="or-c-zip">Postal Code</label>
                        <input id="or-c-zip" autoComplete="postal-code" inputMode="numeric" placeholder="100001" value={order.addressPostalCode} onChange={(e) => setOrder((o) => ({ ...o, addressPostalCode: e.target.value }))} />
                      </div>
                    </>
                  )}
                  {order.method === "delivery" && isLiveRateMode && (
                    <>
                      <div className={`field${fieldErrors.address ? " is-bad" : ""}`}>
                        <label htmlFor="or-c-addr">Delivery address</label>
                        <textarea id="or-c-addr" autoComplete="street-address" placeholder="House number, street, area, landmark" value={order.address} onChange={(e) => { setOrder((o) => ({ ...o, address: e.target.value })); clearStaleQuote() }} />
                        <span className="err">{fieldErrors.address}</span>
                      </div>
                      <p className="opts__label">Shipping Address</p>
                      <div className="field-row">
                        <div className={`field${fieldErrors.state ? " is-bad" : ""}`}>
                          <label htmlFor="or-c-state">State *</label>
                          <select id="or-c-state" autoComplete="address-level1" value={order.addressState} onChange={(e) => selectAddressState(e.target.value)}>
                            <option value="">Select state</option>
                            {getStatesList().map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <span className="err">{fieldErrors.state}</span>
                        </div>
                        <div className={`field${fieldErrors.city ? " is-bad" : ""}`}>
                          <label htmlFor="or-c-city">City *</label>
                          <select id="or-c-city" autoComplete="address-level2" value={order.addressCity} disabled={!order.addressState} onChange={(e) => { setOrder((o) => ({ ...o, addressCity: e.target.value })); clearStaleQuote() }}>
                            <option value="">{order.addressState ? "Select city" : "Select a state first"}</option>
                            {citiesForState.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <span className="err">{fieldErrors.city}</span>
                        </div>
                      </div>
                      <div className="field">
                        <label htmlFor="or-c-zip">Postal Code</label>
                        <input id="or-c-zip" autoComplete="postal-code" inputMode="numeric" placeholder="100001" value={order.addressPostalCode} onChange={(e) => setOrder((o) => ({ ...o, addressPostalCode: e.target.value }))} />
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
                <label htmlFor="or-c-note">Note for {store.name} <span style={{ fontWeight: 500, color: "var(--muted)" }}>(optional)</span></label>
                <textarea id="or-c-note" placeholder="Anything they should know?" value={order.note} onChange={(e) => setOrder((o) => ({ ...o, note: e.target.value }))} />
              </div>
            </div>
          )}
          {checkoutStep === 3 && (
            <>
              <div className="review" style={{ marginTop: 4 }}>
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
                <div className="review__row" style={{ borderTop: "1px solid var(--line)", marginTop: 6, paddingTop: 11, fontSize: 16 }}>
                  <span style={{ color: "var(--text)", fontWeight: 800 }}>Total</span>
                  <span className="money" style={{ fontWeight: 800 }}>{formatNaira(totals.total)}</span>
                </div>
              </div>
              <div className="review" style={{ marginTop: 8 }}>
                <div className="review__row"><span>Name</span><span>{order.name}</span></div>
                <div className="review__row"><span>Phone</span><span>{order.phone}</span></div>
                <div className="review__row"><span>Email</span><span style={{ wordBreak: "break-all" }}>{order.email}</span></div>
                {totals.needsDelivery && (
                  <div className="review__row">
                    <span>{order.method === "pickup" ? "Pickup" : "Deliver to"}</span>
                    <span>{order.method === "pickup" ? store.location : order.address}</span>
                  </div>
                )}
                <button className="btn btn--ghost btn--sm" type="button" style={{ marginTop: 10, marginLeft: 16 }} onClick={() => setCheckoutStep(1)}>Edit details</button>
              </div>
              {payError && <p style={{ margin: "0 16px", color: "var(--danger-ink)", fontSize: 13.5, fontWeight: 600 }}>{payError}</p>}
              <div className="pay-note">
                <svg className="i"><use href="#or-i-shield" /></svg>You&apos;ll pay on Paystack&apos;s secure page. Card, bank transfer or USSD.
              </div>
            </>
          )}
        </div>
        <div className="checkout-foot">
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
      </div>

      <footer style={{ padding: "8px var(--page) 32px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)" }}>
          {store.name}{store.email && <> · {store.email}</>}
        </p>
        <a href="https://blaqora.store" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11.5, fontWeight: 650, color: "var(--muted)", textDecoration: "none" }}>
          <img src="/blaqora-icon.png" alt="" style={{ width: 14, height: 14, borderRadius: 4 }} />Powered by <b style={{ color: "var(--text)" }}>Blaqora</b>
        </a>
      </footer>

      <div className={`toast${toast ? " is-on" : ""}`} role="status" aria-live="polite">
        <svg className="i"><use href="#or-i-check" /></svg>
        <span>{toast}</span>
      </div>
    </div>
  )
}

function OraCard({
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
  const t = DAYLIGHT_TYPE_META[item.type]
  const soldOut = item.type === "physical" && item.stock === 0
  const lowStock = item.type === "physical" && item.stock != null && item.stock > 0 && item.stock <= 3
  const [loaded, setLoaded] = useState(false)

  return (
    <article className={`product-card${soldOut ? " is-out" : ""}`} style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}>
      <button type="button" className="product-image-btn" style={{ display: "block", width: "100%", padding: 0 }} onClick={onOpen} aria-label={`View ${item.name}`}>
        <div className={`product-image${loaded ? "" : " skeleton"}`}>
          <img src={item.images[0]} alt={item.name} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} />
        </div>
      </button>
      <span className={`product-tag product-tag--${soldOut ? "out" : lowStock ? "low" : t.cls}`}>
        {soldOut ? "Sold out" : lowStock ? `${item.stock} left` : t.label}
      </span>
      <button
        className={`wishlist${isSaved ? " saved" : ""}`}
        type="button"
        aria-pressed={isSaved}
        aria-label={isSaved ? `Remove ${item.name} from saved` : `Save ${item.name}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleSave()
        }}
      >
        <svg className="i" style={{ width: 17, height: 17 }}><use href="#or-i-heart" /></svg>
      </button>
      <button type="button" className="product-info" style={{ display: "block", width: "100%", textAlign: "left", padding: 0, paddingTop: 11 }} onClick={onOpen}>
        <h3 className="product-name">{item.name}</h3>
        <div className="product-price-row">
          <span className="product-price-group">
            <span className="product-price money">{formatNaira(item.price)}</span>
            {item.compareAtPrice != null && <span className="product-price-was money">{formatNaira(item.compareAtPrice)}</span>}
          </span>
          <span className="add-button" aria-hidden="true">
            <svg className="i" style={{ width: 16, height: 16 }}><use href="#or-i-plus" /></svg>
          </span>
        </div>
      </button>
    </article>
  )
}
