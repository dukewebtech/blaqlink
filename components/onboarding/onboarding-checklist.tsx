"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, ChevronUp, ChevronDown, Package, Palette, ShieldCheck, Banknote, Share2, Store } from "lucide-react"

interface ChecklistState {
  store_created: boolean
  product_added: boolean
  store_customized: boolean
  identity_verified: boolean
  bank_connected: boolean
  store_shared: boolean
}

const ITEMS = [
  {
    key: "store_created",
    label: "Store created",
    sublabel: "Done",
    icon: Store,
    href: null,
    time: null,
  },
  {
    key: "product_added",
    label: "Add your first product",
    sublabel: "~2 mins",
    icon: Package,
    href: "/products/create",
    time: "~2 mins",
  },
  {
    key: "store_customized",
    label: "Customize your store",
    sublabel: "~2 mins",
    icon: Palette,
    href: "/templates",
    time: "~2 mins",
  },
  {
    key: "identity_verified",
    label: "Verify your identity",
    sublabel: "Required for payouts",
    icon: ShieldCheck,
    href: "/settings/verify",
    time: "Required for payouts",
  },
  {
    key: "bank_connected",
    label: "Connect your bank account",
    sublabel: "Required for withdrawals",
    icon: Banknote,
    href: "/settings/payout",
    time: "Required for withdrawals",
  },
  {
    key: "store_shared",
    label: "Share your store link",
    sublabel: "Go live",
    icon: Share2,
    href: null,
    time: "Go live",
  },
] as const

export function OnboardingChecklist({ storeId }: { storeId: string }) {
  const router = useRouter()
  const [checklist, setChecklist] = useState<ChecklistState>({
    store_created: true,
    product_added: false,
    store_customized: false,
    identity_verified: false,
    bank_connected: false,
    store_shared: false,
  })
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [progressRes, productsRes, profileRes] = await Promise.all([
          fetch("/api/onboarding"),
          fetch("/api/products"),
          fetch("/api/users/me"),
        ])

        const progressData = progressRes.ok ? await progressRes.json() : null
        const productsData = productsRes.ok ? await productsRes.json() : null
        const profileData  = profileRes.ok  ? await profileRes.json()  : null

        const p = progressData?.progress ?? {}
        const user = profileData?.data?.user ?? {}

        setChecklist({
          store_created:      true,
          product_added:      (productsData?.products?.length ?? 0) > 0,
          store_customized:   p.checklist_store_customized ?? false,
          identity_verified:  p.kyc_info_completed ?? user.payout_verified ?? false,
          bank_connected:     p.bank_info_completed ?? !!(user.bank_name && user.account_number),
          store_shared:       p.checklist_store_shared ?? false,
        })
      } catch (e) {
        console.error("[checklist] load error", e)
      }
    }
    load()
  }, [])

  const completed = Object.values(checklist).filter(Boolean).length
  const total = Object.values(checklist).length
  const allDone = completed === total

  // Hide once fully complete
  if (allDone) return null

  async function markShared() {
    try {
      const storeUrl = `${window.location.origin}/store/${storeId}`
      await navigator.clipboard.writeText(storeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "checklist_store_shared", data: {} }),
      })
      setChecklist((prev) => ({ ...prev, store_shared: true }))
    } catch (e) {
      console.error("[checklist] share error", e)
    }
  }

  function handleItemClick(item: (typeof ITEMS)[number]) {
    if (item.key === "store_shared") { markShared(); return }
    if (item.href) router.push(item.href)
  }

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">Complete your store setup</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{completed} of {total} complete</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        <Progress value={(completed / total) * 100} className="h-1.5 mt-2" />
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-5 pb-5 pt-1">
          <div className="space-y-1">
            {ITEMS.map((item) => {
              const done = checklist[item.key]
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onClick={() => !done && handleItemClick(item)}
                  disabled={done}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    done
                      ? "opacity-60 cursor-default"
                      : "hover:bg-primary/10 cursor-pointer"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${done ? "line-through text-muted-foreground" : ""}`}>
                      {item.key === "store_shared" && copied ? "Link copied!" : item.label}
                    </p>
                  </div>
                  {!done && item.time && (
                    <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
