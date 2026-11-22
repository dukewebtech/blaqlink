import { redirect } from "next/navigation"

// The real order page lives at /orders/[id]; this old screen showed sample data.
export default async function TransactionRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/orders/${encodeURIComponent(id)}`)
}
