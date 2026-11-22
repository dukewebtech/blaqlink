"use client"

import { useEffect, useState } from "react"
import { DaylightStorefront } from "@/components/store/templates/daylight-storefront"
import { EditorialStorefront } from "@/components/store/templates/editorial-storefront"
import { StudioStorefront } from "@/components/store/templates/studio-storefront"
import { BoutiqueStorefront } from "@/components/store/templates/boutique-storefront"
import { OraStorefront } from "@/components/store/templates/ora-storefront"
import type { DaylightItem, DaylightStore } from "@/components/store/templates/daylight-types"

/**
 * Store Design shows this page in a fixed-size frame (390px or 1440px wide),
 * so the template lays itself out exactly as it would on that device, whatever
 * screen the vendor is using. The dashboard sends the draft design by postMessage.
 */
const PREVIEW_MESSAGE = "bq-store-preview"

interface PreviewState {
  templateId: string
  store: DaylightStore
  items: DaylightItem[]
}

export default function LiveStorePreview() {
  const [state, setState] = useState<PreviewState | null>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if (e.data?.type !== PREVIEW_MESSAGE) return
      setState(e.data.payload as PreviewState)
    }
    window.addEventListener("message", onMessage)
    // Tell the dashboard we're ready for the design.
    window.parent?.postMessage({ type: `${PREVIEW_MESSAGE}:ready` }, window.location.origin)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  if (!state) return null
  const { templateId, store, items } = state
  switch (templateId) {
    case "editorial":
      return <EditorialStorefront store={store} items={items} />
    case "studio":
      return <StudioStorefront store={store} items={items} />
    case "boutique":
      return <BoutiqueStorefront store={store} items={items} />
    case "ora":
      return <OraStorefront store={store} items={items} />
    default:
      return <DaylightStorefront store={store} items={items} />
  }
}
