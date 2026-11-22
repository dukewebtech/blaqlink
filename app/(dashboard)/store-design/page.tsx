"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Check, ExternalLink, ImageIcon, Loader2, Monitor, Smartphone, Upload } from "lucide-react"
import { createPreviewItems, createPreviewStore } from "@/components/store/templates/preview-mock-data"
import type { DaylightItem } from "@/components/store/templates/daylight-types"
import { STORE_FONT_PAIRINGS, STORE_FONT_PAIRING_IDS, isStoreFontPairing, type StoreFontPairing } from "@/lib/storefront/fonts"
import { useVendorUser } from "@/components/dashboard/vendor-user-context"
import "./store-design.css"

interface StoreTemplate {
  id: string
  name: string
  tagline: string
  available: boolean
}

const TEMPLATES: StoreTemplate[] = [
  { id: "daylight", name: "Daylight", tagline: "Light, friendly, general purpose", available: true },
  { id: "editorial", name: "Editorial", tagline: "Dark, app-like, for fashion and creators", available: true },
  { id: "studio", name: "Studio", tagline: "Light, illustrated tiles, service-led", available: true },
  { id: "boutique", name: "Boutique", tagline: "Warm, gradient hero, saved items", available: true },
  { id: "ora", name: "Ora", tagline: "Light, editorial, neutral palette", available: true },
]

const TEMPLATE_SWATCH_BLOCKS: Record<string, number> = { daylight: 3, editorial: 3, studio: 2, boutique: 2, ora: 2 }
const TEMPLATE_SWATCH_VARIANT: Record<string, string | null> = { daylight: null, editorial: "dark", studio: "studio", boutique: "boutique", ora: null }

const COLOUR_PRESETS = ["#155DFD", "#C2185B", "#0E9F6E", "#E8B4B8", "#F5C451", "#7A5CFF", "#FF7A5A", "#0A0E27"]

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

const DEFAULTS = {
  template: "daylight",
  color: "#155DFD",
  font: "modern" as StoreFontPairing,
}

export default function StoreDesignPage() {
  const { user: vendorUser, loading, refetch: refetchVendorUser } = useVendorUser()
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [storeSlug, setStoreSlug] = useState<string | null>(null)
  const [storeName, setStoreName] = useState("SampleStore")
  const [storeEmail, setStoreEmail] = useState("hello@samplestore.com")

  const [savedTemplate, setSavedTemplate] = useState(DEFAULTS.template)
  const [savedColor, setSavedColor] = useState(DEFAULTS.color)
  const [savedFont, setSavedFont] = useState<StoreFontPairing>(DEFAULTS.font)
  const [savedBanner, setSavedBanner] = useState<string | null>(null)
  const [savedLogo, setSavedLogo] = useState<string | null>(null)

  const [draftTemplate, setDraftTemplate] = useState(DEFAULTS.template)
  const [draftColor, setDraftColor] = useState(DEFAULTS.color)
  const [colorInput, setColorInput] = useState(DEFAULTS.color)
  const [draftFont, setDraftFont] = useState<StoreFontPairing>(DEFAULTS.font)
  const [draftBanner, setDraftBanner] = useState<string | null>(null)
  const [draftLogo, setDraftLogo] = useState<string | null>(null)

  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Populates from the shared vendor user (replaces this page's own fetch to
  // /api/users/me) whenever it loads or changes.
  useEffect(() => {
    if (!vendorUser) return
    const user = vendorUser

    setUserId(user.id)
    setStoreSlug(user.store_slug ?? null)
    setStoreName(user.business_name || user.store_name || "SampleStore")
    setStoreEmail(user.email || "hello@samplestore.com")

    const template = TEMPLATES.some((t) => t.id === user.store_template && t.available) ? user.store_template : DEFAULTS.template
    const color = user.store_brand_color && HEX_RE.test(user.store_brand_color) ? user.store_brand_color : DEFAULTS.color
    const font = isStoreFontPairing(user.store_font) ? user.store_font : DEFAULTS.font
    const banner: string | null = user.store_cover_image_url ?? null
    const logo: string | null = user.store_logo_url ?? null

    setSavedTemplate(template)
    setDraftTemplate(template)
    setSavedColor(color)
    setDraftColor(color)
    setColorInput(color)
    setSavedFont(font)
    setDraftFont(font)
    setSavedBanner(banner)
    setDraftBanner(banner)
    setSavedLogo(logo)
    setDraftLogo(logo)
  }, [vendorUser])

  const hasChanges =
    draftTemplate !== savedTemplate ||
    draftColor !== savedColor ||
    draftFont !== savedFont ||
    draftBanner !== savedBanner ||
    draftLogo !== savedLogo

  function pickColor(hex: string) {
    setDraftColor(hex)
    setColorInput(hex)
  }

  function onHexInput(value: string) {
    setColorInput(value)
    const normalized = value.startsWith("#") ? value : `#${value}`
    if (HEX_RE.test(normalized)) setDraftColor(normalized)
  }

  async function uploadImage(file: File): Promise<string | null> {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    if (!res.ok) return null
    const data = await res.json()
    return (data.url as string) ?? null
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    try {
      const url = await uploadImage(file)
      if (!url) throw new Error()
      setDraftBanner(url)
    } catch {
      toast.error("Banner upload failed")
    } finally {
      setUploadingBanner(false)
      e.target.value = ""
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const url = await uploadImage(file)
      if (!url) throw new Error()
      setDraftLogo(url)
    } catch {
      toast.error("Logo upload failed")
    } finally {
      setUploadingLogo(false)
      e.target.value = ""
    }
  }

  function resetToDefault() {
    setDraftTemplate(DEFAULTS.template)
    setDraftColor(DEFAULTS.color)
    setColorInput(DEFAULTS.color)
    setDraftFont(DEFAULTS.font)
    setDraftBanner(null)
    setDraftLogo(null)
    toast("Reset to platform defaults", { description: "Save to apply, or keep browsing to discard." })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_template: draftTemplate,
          store_brand_color: draftColor,
          store_font: draftFont,
          store_cover_image_url: draftBanner,
          store_logo_url: draftLogo,
        }),
      })
      if (!res.ok) throw new Error()
      setSavedTemplate(draftTemplate)
      setSavedColor(draftColor)
      setSavedFont(draftFont)
      setSavedBanner(draftBanner)
      setSavedLogo(draftLogo)
      // Ticks "Customize your store" on the dashboard checklist (best effort).
      fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "checklist_store_customized" }),
      }).catch(() => {})
      await refetchVendorUser()
      toast.success("Store design saved", { description: "Your live storefront now reflects these changes." })
    } catch {
      toast.error("Failed to save your store design")
    } finally {
      setSaving(false)
    }
  }

  const previewStore = useMemo(
    () =>
      createPreviewStore({
        name: storeName,
        email: storeEmail,
        accent: draftColor,
        fontPairing: draftFont,
        avatarUrl: draftLogo,
        coverUrl: draftBanner,
      }),
    [storeName, storeEmail, draftColor, draftFont, draftLogo, draftBanner],
  )
  const previewItems = useMemo(() => createPreviewItems(storeName), [storeName])
  const storeHref = userId ? `/${storeSlug || userId}` : null

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="sd-root" style={{ display: "grid", gap: 28 }}>
        <div className="sd-head">
          <div>
            <h1>Store design</h1>
            <p>Choose a template and brand colour for your storefront. Changes go live as soon as you save.</p>
          </div>
          {storeHref && (
            <a className="bq-btn bq-btn--secondary" href={storeHref} target="_blank" rel="noreferrer">
              <ExternalLink /> View my store
            </a>
          )}
        </div>

        <section>
          <h2 className="sd-title">Choose a storefront style</h2>
          <div className="sd-templates">
            {TEMPLATES.map((t) => {
              const isActive = draftTemplate === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`sd-tpl${isActive ? " is-active" : ""}`}
                  disabled={!t.available}
                  onClick={() => {
                    if (!t.available) {
                      toast("Coming soon", { description: `${t.name} isn't ready to select yet.` })
                      return
                    }
                    setDraftTemplate(t.id)
                  }}
                >
                  <TemplatePreviewSwatch templateId={t.id} available={t.available} />
                  <span className="sd-check">
                    <Check style={{ width: 13, height: 13 }} />
                  </span>
                  <div className="sd-info">
                    <b>{t.name}</b>
                    <p>{t.tagline}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="sd-editor">
          <div className="sd-editor-head">
            <div>
              <h2>Brand identity</h2>
              <p>Set the visual language customers see across your storefront.</p>
            </div>
            <button type="button" className="bq-btn bq-btn--secondary" onClick={resetToDefault}>
              Reset to default
            </button>
          </div>

          <div className="sd-grid">
            <div>
              <p className="sd-label2">Brand colour</p>
              <p className="sd-copy">Used for primary actions, links, badges and key accents.</p>
              <div className="sd-swatches">
                {COLOUR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={hex}
                    aria-pressed={draftColor.toLowerCase() === hex.toLowerCase()}
                    className={`sd-sw${draftColor.toLowerCase() === hex.toLowerCase() ? " is-sel" : ""}`}
                    style={{ background: hex }}
                    onClick={() => pickColor(hex)}
                  />
                ))}
                <label className="sd-sw sd-sw--custom">
                  <input
                    type="color"
                    value={HEX_RE.test(draftColor) ? draftColor : DEFAULTS.color}
                    onChange={(e) => pickColor(e.target.value)}
                    aria-label="Choose a custom colour"
                  />
                </label>
              </div>
              <div className="bq-field" style={{ maxWidth: 220, marginBottom: 6 }}>
                <label className="bq-label" htmlFor="brand-hex">Hex code</label>
                <div className="bq-input-group">
                  <span className="bq-input-group__addon">#</span>
                  <input
                    id="brand-hex"
                    className="bq-input"
                    value={colorInput.replace(/^#/, "")}
                    onChange={(e) => onHexInput(e.target.value)}
                    maxLength={6}
                    placeholder="155DFD"
                  />
                </div>
              </div>

              <p className="sd-label2">Banner image</p>
              <p className="sd-copy">Shown at the top of your storefront's home page.</p>
              <div className="sd-upload">
                {draftBanner ? (
                  <img src={draftBanner} alt="" className="sd-upload__thumb sd-upload__thumb--banner" />
                ) : (
                  <span className="sd-upload__thumb sd-upload__thumb--banner">
                    <ImageIcon size={18} />
                  </span>
                )}
                <div className="sd-upload__meta">
                  <b>{draftBanner ? "Banner uploaded" : "No banner set"}</b>
                  <span>Recommended 1600×600px</span>
                </div>
                <button
                  type="button"
                  className="bq-btn bq-btn--secondary bq-btn--sm"
                  disabled={uploadingBanner}
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {uploadingBanner ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : <Upload style={{ width: 14, height: 14 }} />}
                  {draftBanner ? "Replace" : "Upload"}
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleBannerChange}
                />
              </div>

              <p className="sd-label2">Logo</p>
              <p className="sd-copy">Shown in your storefront header and browser tab.</p>
              <div className="sd-upload">
                {draftLogo ? (
                  <img src={draftLogo} alt="" className="sd-upload__thumb" />
                ) : (
                  <span className="sd-upload__thumb">
                    <ImageIcon size={16} />
                  </span>
                )}
                <div className="sd-upload__meta">
                  <b>{draftLogo ? "Logo uploaded" : "No logo set"}</b>
                  <span>Square image works best</span>
                </div>
                <button
                  type="button"
                  className="bq-btn bq-btn--secondary bq-btn--sm"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {uploadingLogo ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : <Upload style={{ width: 14, height: 14 }} />}
                  {draftLogo ? "Replace" : "Upload"}
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleLogoChange}
                />
              </div>

              <p className="sd-label2">Font pairing</p>
              <p className="sd-copy">Sets the typeface used across your storefront.</p>
              <div className="sd-fonts">
                {STORE_FONT_PAIRING_IDS.map((id) => {
                  const pairing = STORE_FONT_PAIRINGS[id]
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`sd-font${draftFont === id ? " is-sel" : ""}`}
                      onClick={() => setDraftFont(id)}
                    >
                      <b style={{ fontFamily: pairing.display }}>{pairing.label}</b>
                      <span>{pairing.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <LivePreviewFrame templateId={draftTemplate} store={previewStore} items={previewItems} />
            </div>
          </div>
        </section>

        <div className="sd-savebar">
          {hasChanges && <span className="bq-hint" style={{ alignSelf: "center", marginRight: "auto" }}>You have unsaved changes</span>}
          <button
            type="button"
            className={`bq-btn bq-btn--primary${saving ? " is-loading" : ""}`}
            disabled={!hasChanges || saving}
            onClick={handleSave}
          >
            Save changes
          </button>
        </div>
      </div>
    </>
  )
}

function TemplatePreviewSwatch({ templateId, available }: { templateId: string; available: boolean }) {
  if (!available) {
    return (
      <div className="sd-preview" style={{ display: "grid", placeItems: "center" }}>
        <span className="bq-hint">Coming soon</span>
      </div>
    )
  }
  const variant = TEMPLATE_SWATCH_VARIANT[templateId]
  const blockCount = TEMPLATE_SWATCH_BLOCKS[templateId] ?? 3
  return (
    <div className={`sd-preview${variant ? ` sd-preview--${variant}` : ""}`}>
      <div className="sd-mini">
        <div className="sd-bar" />
        <div className="sd-blocks">
          {Array.from({ length: blockCount }).map((_, i) => (
            <span key={i} className="sd-block" />
          ))}
        </div>
      </div>
    </div>
  )
}

// Fixed device sizes: the store is laid out at exactly these widths, then the
// whole frame is shrunk to fit, so the preview looks the same on any screen.
const PREVIEW_DEVICES = {
  mobile: { width: 390, height: 844, label: "Mobile", icon: Smartphone },
  desktop: { width: 1440, height: 900, label: "Desktop", icon: Monitor },
} as const
type PreviewDevice = keyof typeof PREVIEW_DEVICES
const PREVIEW_MESSAGE = "bq-store-preview"
const MOBILE_MAX_SHOWN_WIDTH = 320

function LivePreviewFrame({
  templateId,
  store,
  items,
}: {
  templateId: string
  store: ReturnType<typeof createPreviewStore>
  items: DaylightItem[]
}) {
  const [device, setDevice] = useState<PreviewDevice>("mobile")
  const [boxWidth, setBoxWidth] = useState(0)
  // Bumped each time a frame (re)loads and says it is listening.
  const [readyTick, setReadyTick] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const { width, height } = PREVIEW_DEVICES[device]

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The frame says when it's listening; send the draft then and on every change.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin === window.location.origin && e.data?.type === `${PREVIEW_MESSAGE}:ready` && e.source === frameRef.current?.contentWindow) {
        setReadyTick((t) => t + 1)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  useEffect(() => {
    if (readyTick === 0) return
    frameRef.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, payload: { templateId, store, items } }, window.location.origin)
  }, [readyTick, templateId, store, items])

  const bezel = device === "mobile" ? 9 : 0
  const chrome = device === "desktop" ? 28 : 0
  const shownWidth = Math.max(0, device === "mobile" ? Math.min(boxWidth, MOBILE_MAX_SHOWN_WIDTH) - bezel * 2 : boxWidth)
  const scale = shownWidth > 0 ? shownWidth / width : 0
  const shownHeight = Math.round(height * scale)

  return (
    <div>
      <div className="sd-previewhead">
        <p className="bq-label">Live preview</p>
        <div className="sd-devices" role="group" aria-label="Preview size">
          {(Object.keys(PREVIEW_DEVICES) as PreviewDevice[]).map((d) => {
            const { label, icon: Icon } = PREVIEW_DEVICES[d]
            return (
              <button key={d} type="button" className={device === d ? "is-sel" : ""} aria-pressed={device === d} onClick={() => setDevice(d)}>
                <Icon aria-hidden="true" /> {label}
              </button>
            )
          })}
        </div>
      </div>

      <div ref={boxRef} className="sd-previewstage">
        {scale > 0 && (
          <div
            className={device === "mobile" ? "sd-phone" : "sd-browser"}
            style={{ width: shownWidth + bezel * 2, height: shownHeight + bezel * 2 + chrome }}
          >
            {device === "mobile" ? (
              <div className="sd-phone__notch" />
            ) : (
              <div className="sd-browser__bar" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            )}
            <div className={device === "mobile" ? "sd-phone__screen" : "sd-browser__screen"} style={{ width: shownWidth, height: shownHeight }}>
              <iframe
                key={device}
                ref={frameRef}
                src="/templates/live-preview"
                title={`${PREVIEW_DEVICES[device].label} preview of your store`}
                style={{ width, height, border: 0, transform: `scale(${scale})`, transformOrigin: "top left", display: "block" }}
              />
            </div>
          </div>
        )}
      </div>
      <p className="bq-hint" style={{ marginTop: 10 }}>
        {device === "mobile" ? "Exactly how your store looks on a phone (390px wide)." : "Exactly how your store looks on a computer (1440px wide)."}
      </p>
    </div>
  )
}
