import { NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"

export async function GET(request: Request, { params }: { params: { productId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")
    const { productId } = params

    const supabase = createPublicClient()

    let query = supabase
      .from("products")
      .select(`*, categories (id, name, product_type, image_url)`)
      .eq("id", productId)
      .eq("status", "published")

    if (storeId) {
      query = query.eq("user_id", storeId)
    }

    const { data: product, error } = await query.single()

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("[v0] Error fetching public product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
