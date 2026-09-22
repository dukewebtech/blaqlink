import type React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { VendorUserProvider } from "@/components/dashboard/vendor-user-context"

// Shared across every vendor dashboard route (route groups don't affect the
// URL — /dashboard, /products-list, /orders etc. are unchanged). Next.js
// keeps this mounted across client-side navigations between these routes,
// so the sidebar/header — and the one /api/users/me fetch VendorUserProvider
// makes — no longer unmounts and re-fetches on every single tab click. Pages
// that used to fetch /api/users/me themselves read it via useVendorUser().
export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <VendorUserProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </VendorUserProvider>
  )
}
