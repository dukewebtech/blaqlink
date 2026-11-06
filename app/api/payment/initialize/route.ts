import { NextResponse } from "next/server"

// Retired: this endpoint charged whatever amount the browser sent. All
// storefronts now pay through /api/checkout/initialize, which prices every
// item server-side. Kept as a route so old pages fail before any charge.
export async function POST() {
  return NextResponse.json(
    { error: "This checkout is no longer available. Please return to the store and check out again." },
    { status: 410 },
  )
}
