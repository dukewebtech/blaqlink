import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateUniqueSlug, slugify } from "@/lib/utils/slug"

// Update the vendor's store profile (name, URL, bio, category, address).
// Separate from PUT /api/users/me because store_slug needs collision handling —
// users.store_slug has a DB-level unique index (scripts/031), and a blind
// update there fails with a raw postgres error instead of a usable one.
export async function PUT(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { storeName, storeSlug, storeBio, businessCategory, businessAddress, storeCity, storeState } = body

    if (!storeName || !String(storeName).trim()) {
      return NextResponse.json({ error: "Store name is required" }, { status: 400 })
    }

    const requestedSlug = slugify(storeSlug || storeName)
    const resolvedSlug = await generateUniqueSlug(storeSlug || storeName, user.id)
    const slugWasTaken = requestedSlug !== "" && requestedSlug !== resolvedSlug

    const { data: updatedProfile, error: updateError } = await supabase
      .from("users")
      .update({
        business_name: storeName,
        store_name: storeName,
        store_slug: resolvedSlug,
        store_bio: storeBio || null,
        business_category: businessCategory || null,
        business_address: businessAddress || null,
        store_city: storeCity || null,
        store_state: storeState || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("[settings/store PUT] update error:", updateError)
      return NextResponse.json(
        { error: "Failed to save store settings", details: updateError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      data: { user: updatedProfile },
      slugWasTaken,
    })
  } catch (error) {
    console.error("[settings/store PUT] error:", error)
    return NextResponse.json({ error: "Failed to save store settings" }, { status: 500 })
  }
}
