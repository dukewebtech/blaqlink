"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function KycPendingScreen() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  const checkKycStatus = async () => {
    setChecking(true)
    try {
      const response = await fetch("/api/onboarding")
      if (response.ok) {
        const data = await response.json()
        if (data.adminKycApproved) {
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("[v0] Error checking KYC status:", error)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    // Check status every 30 seconds
    const interval = setInterval(checkKycStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="p-8 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 mb-4">
        <Clock className="h-10 w-10 text-amber-600" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Verification in Progress</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thank you for completing your onboarding! Your identity verification is currently being reviewed by our team.
        </p>
      </div>

      <div className="rounded-lg bg-muted/50 p-6 border max-w-md mx-auto text-left space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Onboarding Complete</p>
            <p className="text-xs text-muted-foreground mt-1">All information has been submitted successfully</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">KYC Under Review</p>
            <p className="text-xs text-muted-foreground mt-1">Usually takes 1-2 business days</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-muted-foreground">Dashboard Access</p>
            <p className="text-xs text-muted-foreground mt-1">Will be unlocked after approval</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          <Mail className="inline h-4 w-4 mr-1" />
          We'll notify you via email once your account is approved
        </p>

        <div className="flex gap-2 max-w-md mx-auto">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={checkKycStatus} disabled={checking}>
            {checking ? "Checking..." : "Check Status"}
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.push("/logout")}>
            Logout
          </Button>
        </div>
      </div>

      <div className="pt-4">
        <p className="text-xs text-muted-foreground">
          Need help? Contact support at{" "}
          <a href="mailto:support@blaqora.com" className="text-primary hover:underline">
            support@blaqora.com
          </a>
        </p>
      </div>
    </Card>
  )
}
