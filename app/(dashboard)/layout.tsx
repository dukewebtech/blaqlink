import type React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

// Shared across every vendor dashboard route (route groups don't affect the
// URL — /dashboard, /products-list, /orders etc. are unchanged). Next.js
// keeps this mounted across client-side navigations between these routes,
// so the sidebar/header — and its one /api/users/me fetch — no longer
// unmounts and re-fetches on every single tab click.
export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
