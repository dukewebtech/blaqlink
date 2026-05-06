"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"

export default function ProductSuccessPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Trigger confetti animation
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-1000">
          {/* Success Icon */}
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-success/20 rounded-full blur-3xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-success to-success/80 rounded-full p-8 animate-in zoom-in-95 duration-700 delay-200">
              <CheckCircle2 className="h-24 w-24 text-white" strokeWidth={2.5} />
            </div>
            <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-success animate-in zoom-in-95 spin-in duration-700 delay-500" />
            <Sparkles className="absolute -bottom-4 -left-4 h-6 w-6 text-success animate-in zoom-in-95 spin-in duration-700 delay-700" />
          </div>

          {/* Success Message */}
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="inline-flex items-center gap-2 text-6xl animate-in zoom-in-95 duration-700 delay-400">
              🎉
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Your first product has been created and is now live!
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Congratulations! Your product is now available for customers to purchase. Start promoting it to drive
              sales.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Button
              size="lg"
              className="gap-2 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onClick={() => router.push("/products/list")}
            >
              View All Products
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 transition-all duration-300 hover:scale-105 bg-transparent"
              onClick={() => router.push("/products/create")}
            >
              Create Another Product
            </Button>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
            <div className="p-4 rounded-lg bg-muted/50 backdrop-blur transition-all duration-300 hover:scale-105">
              <p className="text-2xl font-bold text-primary">1</p>
              <p className="text-xs text-muted-foreground">Product Created</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 backdrop-blur transition-all duration-300 hover:scale-105">
              <p className="text-2xl font-bold text-success">Live</p>
              <p className="text-xs text-muted-foreground">Status</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 backdrop-blur transition-all duration-300 hover:scale-105">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Sales</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
