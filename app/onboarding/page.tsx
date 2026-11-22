"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { StoreSetupStep } from "@/components/onboarding/store-setup-step"
import { IdentityUploadStep } from "@/components/onboarding/identity-upload-step"
import { BankAccountStep } from "@/components/onboarding/bank-account-step"
import { WelcomeStep } from "@/components/onboarding/welcome-step"

type Step = "store" | "verify" | "bank" | "welcome"

/**
 * New-vendor setup: store details → verify identity → bank account → welcome.
 * Only the store step is required (it unlocks the dashboard); verification
 * and bank can be done later, and the storefront says so until they are.
 */
export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>("store")
  const [prefillName, setPrefillName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [storeSlug, setStoreSlug] = useState("")
  const [verified, setVerified] = useState(false)
  const [bankConnected, setBankConnected] = useState(false)

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/onboarding")
        if (!res.ok) {
          router.push("/login")
          return
        }
        const data = await res.json()
        if (data.progress?.onboarding_completed) {
          router.push("/dashboard")
          return
        }
        const profileRes = await fetch("/api/users/me")
        if (profileRes.ok) {
          const profile = await profileRes.json()
          const user = profile.data?.user ?? {}
          setPrefillName(profile.data?.signupStoreName || user.business_name || "")
          setFirstName(String(user.full_name ?? "").trim().split(/\s+/)[0] ?? "")
        }
      } catch {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    checkStatus()
  }, [router])

  async function refreshAccount() {
    try {
      const res = await fetch("/api/users/me")
      if (!res.ok) return
      const user = (await res.json()).data?.user ?? {}
      setStoreSlug(user.store_slug ?? storeSlug)
      setVerified(!!user.payout_verified)
      setBankConnected(!!(user.bank_name && user.account_number))
    } catch {
      /* the welcome screen still works without these */
    }
  }

  async function goTo(next: Step) {
    if (next === "welcome" || next === "bank") await refreshAccount()
    setStep(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" aria-busy="true" aria-label="Loading">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto max-w-lg px-4 py-8 sm:py-10">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {step === "store" && <StoreSetupStep prefillName={prefillName} stepLabel="Step 1 of 3" onComplete={() => goTo("verify")} />}

        {step === "verify" && (
          <IdentityUploadStep stepLabel="Step 2 of 3" showSkip onSkip={() => goTo("bank")} onComplete={() => goTo("bank")} />
        )}

        {step === "bank" && <BankAccountStep stepLabel="Step 3 of 3" onNext={() => goTo("welcome")} onSkip={() => goTo("welcome")} />}

        {step === "welcome" && <WelcomeStep firstName={firstName} storeSlug={storeSlug} verified={verified} bankConnected={bankConnected} />}
      </div>
    </div>
  )
}
