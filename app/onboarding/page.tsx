"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Store } from "lucide-react"
import { StoreSetupStep } from "@/components/onboarding/store-setup-step"

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/onboarding")
        if (!res.ok) { router.push("/login"); return }

        const data = await res.json()

        // Already completed store setup — go straight to dashboard
        if (data.progress?.onboarding_completed) {
          router.push("/dashboard")
          return
        }

        // Pre-fill the name from the user profile
        const profileRes = await fetch("/api/users/me")
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setUserName(profileData.data?.user?.full_name || "")
        }
      } catch {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    checkStatus()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-10 max-w-lg">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Store className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold">Blaqora</span>
        </div>

        {/* Single step */}
        <StoreSetupStep
          prefillName={userName}
          onComplete={() => router.push("/dashboard")}
        />
      </div>
    </div>
  )
}
