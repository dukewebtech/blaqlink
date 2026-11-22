import { redirect } from "next/navigation"

// Templates are chosen on Store Design now (with colour, font and a live preview).
export default function TemplatesPage() {
  redirect("/store-design")
}
