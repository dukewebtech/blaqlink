"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Sparkles, ArrowRight, Store } from "lucide-react"

// Import onboarding steps
import { BusinessInformationStep } from "@/components/onboarding/business-information-step"
import { IdentityUploadStep } from "@/components/onboarding/identity-upload-step"
import { BankAccountStep } from "@/components/onboarding/bank-account-step"
import { StoreSetupStep } from "@/components/onboarding/store-setup-step"
import { KycPendingScreen } from "@/components/onboarding/kyc-pending-screen"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [onboardingProgress, setOnboardingProgress] = useState<any>(null)

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const response = await fetch("/api/onboarding")
        if (!response.ok) {
          router.push("/login")
          return
        }

        const data = await response.json()
        console.log("[v0] Onboarding progress:", data)

        setOnboardingProgress(data)

        // Determine current step based on progress
        if (data.progress.onboarding_completed) {
          if (data.adminKycApproved) {
            // Both onboarding and KYC approved - go to dashboard
            router.push("/dashboard")
          } else {
            // Onboarding complete but KYC pending
            setCurrentStep(6)
          }
        } else if (data.progress.store_setup_completed) {
          setCurrentStep(5)
        } else if (data.progress.bank_info_completed) {
          setCurrentStep(5)
        } else if (data.progress.kyc_info_completed) {
          setCurrentStep(4)
        } else if (data.progress.business_info_completed) {
          setCurrentStep(3)
        } else {
          setCurrentStep(1)
        }
      } catch (error) {
        console.error("[v0] Error checking onboarding status:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [router])

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1)
  }

  const calculateProgress = () => {
    return ((currentStep - 1) / 5) * 100
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading onboarding...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Store className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Blaqora</h1>
          </div>
          <p className="text-muted-foreground">Complete your store setup in a few simple steps</p>
        </div>

        {/* Progress Bar */}
        {currentStep <= 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of 5</span>
              <span className="text-sm text-muted-foreground">{Math.round(calculateProgress())}% complete</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        )}

        {/* Step 1: Welcome Screen */}
        {currentStep === 1 && (
          <Card className="p-8 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to Blaqora!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's set up your online store in just a few minutes. We'll guide you through each step to get your
                business online.
              </p>
            </div>
            <div className="flex flex-col gap-3 max-w-md mx-auto pt-4">
              <div className="flex items-center gap-3 text-left">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm">Business information setup</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm">Identity verification</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm">Bank account connection</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm">Store customization</span>
              </div>
            </div>
            <Button onClick={handleNextStep} size="lg" className="w-full max-w-md mx-auto gap-2">
              Start Onboarding
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Card>
        )}

        {/* Step 2: Business Information */}
        {currentStep === 2 && <BusinessInformationStep onNext={handleNextStep} />}

        {/* Step 3: Identity Upload */}
        {currentStep === 3 && <IdentityUploadStep onNext={handleNextStep} />}

        {/* Step 4: Bank Account Setup */}
        {currentStep === 4 && <BankAccountStep onNext={handleNextStep} />}

        {/* Step 5: Store Setup */}
        {currentStep === 5 && <StoreSetupStep onNext={handleNextStep} />}

        {/* Step 6: KYC Pending Screen */}
        {currentStep === 6 && <KycPendingScreen />}
      </div>
    </div>
  )
}
