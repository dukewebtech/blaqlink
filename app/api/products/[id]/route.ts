import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/utils/api-helpers"
import { getVendorProduct, saveProduct } from "@/lib/products/service"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  const auth = await getAuthenticatedUser()
  if (!auth.success) return auth.error

  const product = await getVendorProduct(auth.user.userId, id)
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json({ product })
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  const auth = await getAuthenticatedUser()
  if (!auth.success) return auth.error

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  try {
    const result = await saveProduct(auth.user.userId, id, body)
    if (!result.ok) return NextResponse.json({ error: result.message, errors: result.errors }, { status: result.status })
    return NextResponse.json({ product: result.product })
  } catch (error) {
    console.error("[products] update failed:", error)
    return NextResponse.json({ error: "We couldn't save this product. Please try again." }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  const auth = await getAuthenticatedUser()
  if (!auth.success) return auth.error

  // Past orders keep their own copy of title and price (order_items), so
  // deleting a product never changes order history.
  const { data, error } = await createAdminClient()
    .from("products")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.userId)
    .select("id")
  if (error) {
    console.error("[products] delete failed:", error.message)
    return NextResponse.json({ error: "We couldn't delete this product. Please try again." }, { status: 500 })
  }
  if (!data?.length) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
