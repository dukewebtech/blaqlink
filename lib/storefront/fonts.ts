export type StoreFontPairing = "modern" | "classic" | "minimal" | "elegant"

export interface FontPairingInfo {
  id: StoreFontPairing
  label: string
  description: string
  display: string
  body: string
}

// Font faces are loaded once, app-wide, via next/font/google in app/layout.tsx
// (each exposes a --font-* CSS variable on <body>) — this just picks which
// pair a given storefront uses. 'modern' is today's fixed pairing, kept as
// the default so every existing vendor's storefront is unaffected.
export const STORE_FONT_PAIRINGS: Record<StoreFontPairing, FontPairingInfo> = {
  modern: {
    id: "modern",
    label: "Modern",
    description: "Bold and friendly — the default.",
    display: "var(--font-bricolage), 'Plus Jakarta Sans', system-ui, sans-serif",
    body: "var(--font-jakarta), system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  classic: {
    id: "classic",
    label: "Classic",
    description: "Warm editorial serif.",
    display: "var(--font-fraunces), Georgia, serif",
    body: "var(--font-inter), system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    description: "Clean and geometric.",
    display: "var(--font-space-grotesk), system-ui, sans-serif",
    body: "var(--font-inter), system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  elegant: {
    id: "elegant",
    label: "Elegant",
    description: "Fashion and luxury serif.",
    display: "var(--font-playfair), Georgia, serif",
    body: "var(--font-work-sans), system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
}

export const STORE_FONT_PAIRING_IDS = Object.keys(STORE_FONT_PAIRINGS) as StoreFontPairing[]

export function isStoreFontPairing(value: string | null | undefined): value is StoreFontPairing {
  return !!value && value in STORE_FONT_PAIRINGS
}

/** CSS custom properties for a storefront's root element, overriding each template's own --font-display/--font-body default. */
export function fontCssVars(pairing: StoreFontPairing): Record<string, string> {
  const { display, body } = STORE_FONT_PAIRINGS[pairing] ?? STORE_FONT_PAIRINGS.modern
  return { "--font-display": display, "--font-body": body }
}
