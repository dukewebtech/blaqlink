"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"logging-out" | "success" | "error">("logging-out")

  useEffect(() => {
    const handleLogout = async () => {
      try {
        console.log("[v0] Starting logout process...")

        const response = await fetch("/api/auth/logout", {
          method: "POST",
        })

        if (!response.ok) {
          throw new Error("Logout failed")
        }

        console.log("[v0] Logout successful, redirecting to login...")
        setStatus("success")

        // Wait a moment before redirecting
        setTimeout(() => {
          router.push("/login")
        }, 1000)
      } catch (error) {
        console.error("[v0] Logout error:", error)
        setStatus("error")
      }
    }

    handleLogout()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === "logging-out" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-lg text-foreground">Logging out...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-8 w-8 mx-auto rounded-full bg-green-500 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg text-foreground">Logged out successfully!</p>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-8 w-8 mx-auto rounded-full bg-red-500 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg text-foreground">Logout failed</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
