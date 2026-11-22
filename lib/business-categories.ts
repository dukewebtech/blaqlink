// What kind of business a vendor runs (shown in setup and Store Settings).
// "Other" lets the vendor type their own; that text is stored as-is.
export const BUSINESS_CATEGORIES = [
  "Fashion & Clothing",
  "Shoes & Bags",
  "Jewellery & Accessories",
  "Beauty & Skincare",
  "Hair & Wigs",
  "Perfumes & Fragrances",
  "Beauty Services (salon, nails, makeup)",
  "Food & Drinks",
  "Cakes & Pastries",
  "Catering & Small Chops",
  "Groceries & Farm Produce",
  "Health & Wellness",
  "Fitness & Sports",
  "Home & Living",
  "Furniture & Decor",
  "Electronics & Gadgets",
  "Phones & Accessories",
  "Baby & Kids",
  "Gifts & Hampers",
  "Books & Stationery",
  "Education & Courses",
  "Coaching & Consulting",
  "Digital Products & Templates",
  "Events & Entertainment",
  "Event Planning & Rentals",
  "Photography & Video",
  "Music & Arts",
  "Arts & Crafts",
  "Printing & Branding",
  "Cleaning & Laundry",
  "Repairs & Maintenance",
  "Automotive",
  "Travel & Tours",
  "Real Estate",
  "Pets",
  "Software & Tech Services",
] as const

export const OTHER_CATEGORY = "Other"
export const MAX_CUSTOM_CATEGORY_LENGTH = 40

export function isListedCategory(value: string | null | undefined) {
  return !!value && (BUSINESS_CATEGORIES as readonly string[]).includes(value)
}
