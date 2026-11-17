import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/utils/api-helpers"
import { refundOrder } from "@/lib/orders/refund"

// A vendor refunding one of their own orders (also how a booking or order is cancelled).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedUser()
  if (!auth.success) return auth.error
  const { id } = await params
  const result = await refundOrder(id, auth.user.userId)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true })
}
