import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/utils/api-helpers"
import { getVendorPlan } from "@/lib/pricing"

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  try {
    const staticRoutes = ["list", "choose-type", "create", "edit"]
    if (staticRoutes.includes(params.id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authResult = await getAuthenticatedUser()
    if (!authResult.success) return authResult.error

    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", authResult.user.userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("[v0] Error in GET /api/products/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  try {
    const staticRoutes = ["list", "choose-type", "create", "edit"]
    if (staticRoutes.includes(params.id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authResult = await getAuthenticatedUser()
    if (!authResult.success) return authResult.error
    const vendorId = authResult.user.userId

    const body = await request.json()

    // Same plan rule as creating a product — otherwise switching an existing
    // item's type would get around it.
    if (body.product_type !== undefined) {
      const plan = await getVendorPlan(vendorId)
      if (!plan.allowed_selling_types.includes(body.product_type)) {
        return NextResponse.json(
          { error: `Your ${plan.name} plan doesn't allow ${body.product_type} products. Upgrade to unlock this selling type.` },
          { status: 403 },
        )
      }
    }

    // Remove fields that shouldn't be updated
    delete body.id
    delete body.user_id
    delete body.created_at
    delete body.updated_at

    const { data: product, error } = await supabase
      .from("products")
      .update(body)
      .eq("id", params.id)
      .eq("user_id", vendorId)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Product updated successfully:", product.id, "Images:", product.images)
    return NextResponse.json({ product })
  } catch (error) {
    console.error("[v0] Error in PUT /api/products/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  try {
    const staticRoutes = ["list", "choose-type", "create", "edit"]
    if (staticRoutes.includes(params.id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authResult = await getAuthenticatedUser()
    if (!authResult.success) return authResult.error

    const { error } = await supabase.from("products").delete().eq("id", params.id).eq("user_id", authResult.user.userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Product deleted successfully:", params.id)
    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/products/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
