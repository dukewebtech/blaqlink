"use client"

import { DaylightStorefront } from "@/components/store/templates/daylight-storefront"
import { PREVIEW_ITEMS, createPreviewStore } from "@/components/store/templates/preview-mock-data"

// Renders the real DaylightStorefront component with sample data, so the
// preview can never drift from what a vendor's live store actually looks like.
const store = createPreviewStore({ accent: "#155DFD" })

export default function DaylightTemplatePreview() {
  return <DaylightStorefront store={store} items={PREVIEW_ITEMS} />
}
