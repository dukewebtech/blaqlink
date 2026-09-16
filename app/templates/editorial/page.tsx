"use client"

import { EditorialStorefront } from "@/components/store/templates/editorial-storefront"
import { PREVIEW_ITEMS, createPreviewStore } from "@/components/store/templates/preview-mock-data"

// Renders the real EditorialStorefront component with sample data, so the
// preview can never drift from what a vendor's live store actually looks like.
const store = createPreviewStore({ accent: "#E8B4B8" })

export default function EditorialTemplatePreview() {
  return <EditorialStorefront store={store} items={PREVIEW_ITEMS} />
}
