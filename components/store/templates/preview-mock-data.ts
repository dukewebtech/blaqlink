import type { DaylightItem, DaylightStore } from "./daylight-types"

// Shared sample data for template preview pages and the dashboard's live
// storefront-design preview — kept in one place so all three can never drift
// from each other. Real stores pull from the vendor's actual catalogue
// (see app/[slug]/page.tsx); this is demo content only.

export function previewPlaceholderImage(color: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 880"><rect width="800" height="880" fill="${color}"/><text x="400" y="450" font-family="sans-serif" font-size="40" fill="#fff" text-anchor="middle">${label}</text></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

export function createPreviewStore(overrides: Partial<DaylightStore> = {}): DaylightStore {
  return {
    id: "preview-store",
    slug: "preview",
    name: "SampleStore",
    bio: "Office dresses, jumpsuits, plus-size outfits and casuals. Made and shipped from Lagos.",
    avatarUrl: null,
    coverUrl: null,
    accent: "#155DFD",
    location: "Lekki, Lagos",
    whatsappNumber: "2348000000000",
    email: "hello@samplestore.com",
    ordersDelivered: 412,
    memberSinceYear: 2023,
    verified: true,
    deliveryAreas: [
      { id: "a1", name: "Lagos mainland", note: "2 to 3 working days", fee: 3000, state: "Lagos", city: "Ikeja" },
      { id: "a2", name: "Lagos island", note: "1 to 2 working days", fee: 4000, state: "Lagos", city: "Lagos Island" },
      { id: "a3", name: "Other states", note: "3 to 7 working days", fee: 6500, state: null, city: null },
    ],
    shippingMode: "manual",
    fontPairing: "modern",
    ...overrides,
  }
}

const ph = previewPlaceholderImage

export function createPreviewItems(storeName: string = "SampleStore"): DaylightItem[] {
  return [
  {
    id: "p1", type: "physical", name: "Amara office dress",
    description: "A structured midi dress that moves from morning meetings to dinner. Lined, with hidden side pockets and a back zip.",
    price: 28500, compareAtPrice: 34000, images: [ph("#1B2A63", "Dress")],
    categoryId: "cat-dresses", categoryName: "Dresses", categoryImageUrl: null,
    stock: 7, variants: [
      { id: "v1", size: "S", colorName: "Navy", colorHex: "#1B2A63", stock: 2 },
      { id: "v2", size: "M", colorName: "Navy", colorHex: "#1B2A63", stock: 4 },
      { id: "v3", size: "L", colorName: "Navy", colorHex: "#1B2A63", stock: 1 },
    ],
    eventDate: null, eventLocation: null, tiers: [], durationLabel: null, venue: null, days: [], fileLabel: null,
  },
  {
    id: "p2", type: "physical", name: "Zuri wide-leg jumpsuit",
    description: "Wide-leg jumpsuit with a tie waist and deep pockets.",
    price: 34000, compareAtPrice: null, images: [ph("#0E5C4A", "Jumpsuit")],
    categoryId: "cat-jumpsuits", categoryName: "Jumpsuits", categoryImageUrl: null,
    stock: 12, variants: [], eventDate: null, eventLocation: null, tiers: [], durationLabel: null, venue: null, days: [], fileLabel: null,
  },
  {
    id: "t1", type: "event", name: `${storeName} Style Night`,
    description: "An evening of styling, shopping and small chops.",
    price: 8000, compareAtPrice: null, images: [ph("#F2542D", "Ticket")],
    categoryId: null, categoryName: null, categoryImageUrl: null,
    stock: null, variants: [], eventDate: "Fri 24 Oct, 7:00 PM", eventLocation: "Victoria Island, Lagos",
    tiers: [
      { id: "tier1", name: "Regular", price: 8000, left: 40 },
      { id: "tier2", name: "VIP", price: 25000, left: 6 },
    ],
    durationLabel: null, venue: null, days: [], fileLabel: null,
  },
  {
    id: "b1", type: "appointment", name: "Personal styling session",
    description: "One to one with our stylist to build a wardrobe plan you can shop from.",
    price: 25000, compareAtPrice: null, images: [ph("#7A5CFF", "Booking")],
    categoryId: null, categoryName: null, categoryImageUrl: null,
    stock: null, variants: [], eventDate: null, eventLocation: null, tiers: [],
    durationLabel: "90 minutes", venue: "Lekki studio or video call",
    days: [1, 2, 3].map((n) => ({
      label: `Day ${n}`, dow: ["Mon", "Tue", "Wed"][n - 1], dateNum: 19 + n, date: `2026-10-${19 + n}`,
      free: true, slots: ["9:00 AM", "11:00 AM", "1:00 PM"].map((t, i) => ({ time: t, free: (i + n) % 2 === 0 })),
    })),
    fileLabel: null,
  },
  {
    id: "d1", type: "digital", name: "The Workwear Capsule guide",
    description: "Thirty-eight pages on building a work wardrobe from twelve pieces.",
    price: 4500, compareAtPrice: null, images: [ph("#0B7A55", "PDF")],
    categoryId: null, categoryName: null, categoryImageUrl: null,
    stock: null, variants: [], eventDate: null, eventLocation: null, tiers: [], durationLabel: null, venue: null, days: [],
    fileLabel: "PDF, 38 pages",
  },
  ]
}

/** Static default for callers with no real store context (template preview pages). */
export const PREVIEW_ITEMS: DaylightItem[] = createPreviewItems()
