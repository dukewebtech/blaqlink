import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/utils/api-helpers"
import { refundOrder } from "@/lib/orders/refund"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.success) return auth.error
  const { id } = await params
  const result = await refundOrder(id, null)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true })
}
