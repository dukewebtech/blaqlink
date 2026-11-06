// Business details shown on /terms, /privacy and /refunds. Anything in
// [brackets] is a placeholder that must be filled in, and the pages reviewed
// by a lawyer, before launch.
export const LEGAL = {
  tradingName: "Blaqora",
  legalEntity: "[Registered company name]",
  rcNumber: "[RC number]",
  registeredAddress: "[Registered office address]",
  courts: "[Lagos State]",
  contactEmail: "hello@blaqora.store",
  privacyEmail: "hello@blaqora.store",
  lastUpdated: "6 November 2026",
} as const

export const LEGAL_DOCS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Refund Policy" },
] as const

export type LegalDocHref = (typeof LEGAL_DOCS)[number]["href"]
