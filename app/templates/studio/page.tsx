"use client"

import { StudioStorefront } from "@/components/store/templates/studio-storefront"
import { PREVIEW_ITEMS, createPreviewStore } from "@/components/store/templates/preview-mock-data"

// Renders the real StudioStorefront component with sample data, so the
// preview can never drift from what a vendor's live store actually looks like.
const store = createPreviewStore({ accent: "#0B7A3E" })

export default function StudioTemplatePreview() {
  return <StudioStorefront store={store} items={PREVIEW_ITEMS} />
}
