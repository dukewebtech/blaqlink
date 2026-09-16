"use client"

import { BoutiqueStorefront } from "@/components/store/templates/boutique-storefront"
import { PREVIEW_ITEMS, createPreviewStore } from "@/components/store/templates/preview-mock-data"

// Renders the real BoutiqueStorefront component with sample data, so the
// preview can never drift from what a vendor's live store actually looks like.
const store = createPreviewStore({ accent: "#F2542D" })

export default function BoutiqueTemplatePreview() {
  return <BoutiqueStorefront store={store} items={PREVIEW_ITEMS} />
}
