import type React from "react"
import { Logo } from "@/components/logo"

/** Two-panel layout for sign-up, login and password pages. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
          <div className="space-y-2">
            <Logo />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-8">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-base">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-white leading-tight text-balance">
              Easy-to-Use Dashboard for Managing Your Business.
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              Streamline Your Business Management with Our User-Friendly Dashboard. Simplify complex tasks, track key
              metrics, and make informed decisions effortlessly
            </p>
          </div>

          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                <div className="text-white/60 text-sm">Dashboard Preview</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <div className="w-8 h-1 bg-white rounded-full" />
            <div className="w-8 h-1 bg-white/30 rounded-full" />
            <div className="w-8 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
