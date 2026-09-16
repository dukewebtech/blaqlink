"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Check, ExternalLink, Loader2 } from "lucide-react"
import { DaylightStorefront } from "@/components/store/templates/daylight-storefront"
import { EditorialStorefront } from "@/components/store/templates/editorial-storefront"
import { StudioStorefront } from "@/components/store/templates/studio-storefront"
import { BoutiqueStorefront } from "@/components/store/templates/boutique-storefront"
import { PREVIEW_ITEMS, createPreviewStore } from "@/components/store/templates/preview-mock-data"

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
]

const COLOUR_PRESETS = ["#155DFD", "#C2185B", "#0E9F6E", "#E8B4B8", "#F5C451", "#7A5CFF", "#FF7A5A", "#0A0E27"]

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export default function StoreDesignPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [storeSlug, setStoreSlug] = useState<string | null>(null)

  const [savedTemplate, setSavedTemplate] = useState("daylight")
  const [savedColor, setSavedColor] = useState("#155DFD")
  const [draftTemplate, setDraftTemplate] = useState("daylight")
  const [draftColor, setDraftColor] = useState("#155DFD")
  const [colorInput, setColorInput] = useState("#155DFD")

  useEffect(() => {
    fetch("/api/users/me")
      .then(async (res) => {
        const json = await res.json()
        const user = json.data?.user
        if (!user) return
        setUserId(user.id)
        setStoreSlug(user.store_slug ?? null)
        const template = TEMPLATES.some((t) => t.id === user.store_template && t.available) ? user.store_template : "daylight"
        const color = user.store_brand_color && HEX_RE.test(user.store_brand_color) ? user.store_brand_color : "#155DFD"
        setSavedTemplate(template)
        setSavedColor(color)
        setDraftTemplate(template)
        setDraftColor(color)
        setColorInput(color)
      })
      .catch(() => toast.error("Could not load your store settings"))
      .finally(() => setLoading(false))
  }, [])

  const hasChanges = draftTemplate !== savedTemplate || draftColor !== savedColor

  function pickColor(hex: string) {
    setDraftColor(hex)
    setColorInput(hex)
  }

  function onHexInput(value: string) {
    setColorInput(value)
    const normalized = value.startsWith("#") ? value : `#${value}`
    if (HEX_RE.test(normalized)) setDraftColor(normalized)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_template: draftTemplate, store_brand_color: draftColor }),
      })
      if (!res.ok) throw new Error()
      setSavedTemplate(draftTemplate)
      setSavedColor(draftColor)
      toast.success("Store design saved", { description: "Your live storefront now reflects these changes." })
    } catch {
      toast.error("Failed to save your store design")
    } finally {
      setSaving(false)
    }
  }

  const previewStore = useMemo(() => createPreviewStore({ accent: draftColor }), [draftColor])
  const storeHref = userId ? `/${storeSlug || userId}` : null

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div style={{ display: "grid", gap: 32 }}>
        <div className="bq-head" style={{ marginBottom: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, maxWidth: "none", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--bq-font-display)", fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>Store design</h1>
            <p className="bq-head__text" style={{ marginTop: 8 }}>Choose a template and brand colour for your storefront. Changes go live as soon as you save.</p>
          </div>
          {storeHref && (
            <a className="bq-btn bq-btn--secondary" href={storeHref} target="_blank" rel="noreferrer">
              <ExternalLink /> View my store
            </a>
          )}
        </div>

        <section>
          <h2 className="bq-card__title" style={{ marginBottom: 16 }}>Template</h2>
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {TEMPLATES.map((t) => {
              const isActive = draftTemplate === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`bq-card${t.available ? " bq-card--interactive" : ""}`}
                  style={{
                    textAlign: "left",
                    padding: 0,
                    overflow: "hidden",
                    borderColor: isActive ? "var(--bq-blue)" : undefined,
                    boxShadow: isActive ? "var(--bq-focus-ring)" : undefined,
                    opacity: t.available ? 1 : 0.6,
                    cursor: t.available ? "pointer" : "not-allowed",
                  }}
                  disabled={!t.available}
                  onClick={() => {
                    if (!t.available) {
                      toast("Coming soon", { description: `${t.name} isn't ready to select yet.` })
                      return
                    }
                    setDraftTemplate(t.id)
                  }}
                >
                  <TemplatePreviewThumb templateId={t.id} available={t.available} accent={draftColor} />
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <b style={{ fontSize: 16, fontWeight: 800 }}>{t.name}</b>
                      {!t.available ? (
                        <span className="bq-badge">Coming soon</span>
                      ) : isActive ? (
                        <span className="bq-badge bq-badge--info"><Check style={{ width: 12, height: 12, marginRight: 4 }} />Active</span>
                      ) : null}
                    </div>
                    <p className="bq-hint" style={{ marginTop: 4 }}>{t.tagline}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="bq-card" style={{ display: "grid", gap: 28, gridTemplateColumns: "1fr" }}>
          <div>
            <h2 className="bq-card__title">Brand colour</h2>
            <p className="bq-card__text">Applied across buttons, badges and accents on your storefront.</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
              {COLOUR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={hex}
                  aria-pressed={draftColor.toLowerCase() === hex.toLowerCase()}
                  onClick={() => pickColor(hex)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: hex,
                    border: 0,
                    boxShadow:
                      draftColor.toLowerCase() === hex.toLowerCase()
                        ? "0 0 0 2px #fff, 0 0 0 4px var(--bq-ink)"
                        : "0 0 0 2px #fff, 0 0 0 3px var(--bq-line-2)",
                    cursor: "pointer",
                    transition: "transform .15s ease",
                  }}
                />
              ))}
              <label
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "0 0 0 2px #fff, 0 0 0 3px var(--bq-line-2)",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  background: "conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)",
                }}
              >
                <input
                  type="color"
                  value={HEX_RE.test(draftColor) ? draftColor : "#155DFD"}
                  onChange={(e) => pickColor(e.target.value)}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  aria-label="Choose a custom colour"
                />
              </label>
            </div>

            <div className="bq-field" style={{ marginTop: 20, maxWidth: 220 }}>
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
          </div>

          <div>
            <p className="bq-label" style={{ marginBottom: 12 }}>Live preview</p>
            <LivePreviewFrame templateId={draftTemplate} store={previewStore} />
          </div>
        </section>

        <div
          style={{
            position: "sticky",
            bottom: 16,
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            padding: 16,
            background: "#fff",
            border: "1px solid var(--bq-line)",
            borderRadius: "var(--bq-radius-lg)",
            boxShadow: "var(--bq-shadow-2)",
          }}
        >
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
    </DashboardLayout>
  )
}

function TemplatePreviewThumb({ templateId, available, accent }: { templateId: string; available: boolean; accent: string }) {
  if (!available) {
    return (
      <div style={{ height: 130, background: "var(--bq-bg-soft)", display: "grid", placeItems: "center" }}>
        <span className="bq-hint">Preview coming soon</span>
      </div>
    )
  }
  if (templateId === "editorial") {
    return (
      <div style={{ height: 130, background: "#08090F", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: accent }} />
          <div style={{ height: 6, width: 60, borderRadius: 3, background: "rgba(255,255,255,.3)" }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: 1, height: 56, borderRadius: 8, background: i === 0 ? accent : "rgba(255,255,255,.08)" }} />
          ))}
        </div>
      </div>
    )
  }
  if (templateId === "studio") {
    return (
      <div style={{ height: 130, background: "#fff", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: accent }} />
          <div style={{ height: 6, width: 70, borderRadius: 3, background: "#E7E9F2" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 40, borderRadius: 10, background: "#F5F7FC", display: "flex", alignItems: "center", gap: 6, padding: "0 8px" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: i === 0 ? accent : "#D9DDEA" }} />
              <div style={{ height: 5, width: 24, borderRadius: 3, background: "#D9DDEA" }} />
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (templateId === "boutique") {
    return (
      <div style={{ height: 130, background: "#F7F5F6", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 6, width: 50, borderRadius: 3, background: "#8A7C80" }} />
        <div
          style={{
            height: 70,
            borderRadius: 14,
            background: `linear-gradient(120deg, ${accent}55, ${accent})`,
            display: "flex",
            alignItems: "flex-end",
            padding: 8,
          }}
        >
          <div style={{ height: 6, width: 60, borderRadius: 3, background: "rgba(58,18,6,.5)" }} />
        </div>
      </div>
    )
  }
  // daylight
  return (
    <div style={{ height: 130, background: "#F5F7FC", padding: 0 }}>
      <div style={{ height: 40, background: accent }} />
      <div style={{ display: "flex", gap: 6, padding: 10 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: 1, height: 56, borderRadius: 8, background: "#fff", border: "1px solid var(--bq-line)" }} />
        ))}
      </div>
    </div>
  )
}

function LivePreviewFrame({ templateId, store }: { templateId: string; store: ReturnType<typeof createPreviewStore> }) {
  const width = 390
  const height = 760
  const scale = 0.68

  return (
    <div
      style={{
        width: width * scale,
        height: height * scale,
        overflow: "hidden",
        borderRadius: 24,
        border: "8px solid var(--bq-ink)",
        boxShadow: "var(--bq-shadow-3)",
        pointerEvents: "none",
      }}
    >
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {templateId === "editorial" ? (
          <EditorialStorefront store={store} items={PREVIEW_ITEMS} />
        ) : templateId === "studio" ? (
          <StudioStorefront store={store} items={PREVIEW_ITEMS} />
        ) : templateId === "boutique" ? (
          <BoutiqueStorefront store={store} items={PREVIEW_ITEMS} />
        ) : (
          <DaylightStorefront store={store} items={PREVIEW_ITEMS} />
        )}
      </div>
    </div>
  )
}
