"use client"

import { OraStorefront } from "@/components/store/templates/ora-storefront"
import { PREVIEW_ITEMS, createPreviewStore } from "@/components/store/templates/preview-mock-data"

// Renders the real OraStorefront component with sample data, so the
// preview can never drift from what a vendor's live store actually looks like.
const store = createPreviewStore({ accent: "#171717" })

export default function OraTemplatePreview() {
  return <OraStorefront store={store} items={PREVIEW_ITEMS} />
}
