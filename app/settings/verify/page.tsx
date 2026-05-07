"use client"

import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { IdentityUploadStep } from "@/components/onboarding/identity-upload-step"

export default function VerifyPage() {
  const router = useRouter()

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Identity Verification</h1>
          <p className="text-muted-foreground text-sm mt-1">Required to activate payouts and withdrawals.</p>
        </div>
        <IdentityUploadStep
          showSkip={true}
          onSkip={() => router.push("/dashboard")}
          onComplete={() => router.push("/dashboard")}
        />
      </div>
    </DashboardLayout>
  )
}
