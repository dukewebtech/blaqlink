"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  change: string
  changeLabel: string
  trend: "up" | "down"
  icon: LucideIcon
  className?: string
  delay?: number
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  trend,
  icon: Icon,
  className,
  delay = 0,
}: StatsCardProps) {
  const isPositive = trend === "up"

  return (
    <Card
      className={cn(
        "group hover:shadow-lg transition-all duration-500 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4",
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <p
              className={cn(
                "text-sm font-medium",
                className?.includes("text-white") ? "text-white/90" : "text-muted-foreground",
              )}
            >
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3
                className={cn(
                  "text-3xl font-bold tracking-tight",
                  className?.includes("text-white") ? "text-white" : "text-foreground",
                )}
              >
                {value}
              </h3>
            </div>
          </div>
          <div
            className={cn(
              "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
              className?.includes("text-white") ? "bg-white/20" : "bg-primary/10",
            )}
          >
            <Icon className={cn("h-5 w-5", className?.includes("text-white") ? "text-white" : "text-primary")} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              isPositive
                ? className?.includes("text-white")
                  ? "bg-white/20 text-white"
                  : "bg-success/10 text-success"
                : className?.includes("text-white")
                  ? "bg-white/20 text-white"
                  : "bg-destructive/10 text-destructive",
            )}
          >
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {change}
          </div>
          <p className={cn("text-xs", className?.includes("text-white") ? "text-white/70" : "text-muted-foreground")}>
            {changeLabel}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
