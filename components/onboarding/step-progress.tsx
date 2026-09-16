"use client"

import { cn } from "@/lib/utils"

export function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-6">
      <div className="flex gap-1.5 mb-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i <= current ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-xs font-semibold text-primary uppercase tracking-widest">
        Step {current + 1} of {steps.length} — {steps[current]}
      </p>
    </div>
  )
}
