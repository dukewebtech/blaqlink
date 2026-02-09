"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Users,
  Wallet,
  ShoppingBag,
  BarChart3,
  Settings,
  ChevronDown,
  Search,
  Bell,
  Menu,
  X,
  Shield,
  Package,
  Megaphone,
} from "lucide-react"
import { Logo } from "@/components/logo"

const navigation = [
  { name: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Withdrawal Requests", href: "/admin/withdrawals", icon: Wallet },
  { name: "Users & Stores", href: "/admin/users", icon: Users },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Financial Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Announcement", href: "/admin/announcement", icon: Megaphone }, // Renamed to Announcement
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const [userData, setUserData] = useState<{
    full_name: string
    email: string
    profile_image?: string
    is_admin: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/users/me")

        if (!response.ok) {
          if (response.status === 503) {
            console.log("[v0] Auth service temporarily unavailable, retrying...")
            // Retry after a short delay
            setTimeout(() => {
              fetchUserData()
            }, 2000)
            return
          }

          if (response.status === 401) {
            console.log("[v0] User not authenticated, redirecting to login")
            router.push("/login")
            return
          }
        }

        const result = await response.json()

        if (result.ok && result.data?.user) {
          setUserData(result.data.user)

          if (!result.data.user.is_admin) {
            console.log("[v0] User is not admin, redirecting to setup page")
            router.push("/admin/setup")
          }
        } else {
          console.log("[v0] Invalid response, redirecting to login")
          router.push("/login")
        }
      } catch (error) {
        console.error("[v0] Error fetching user data:", error)
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const getUserInitials = () => {
    if (!userData?.full_name) return "A"
    const names = userData.full_name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return userData.full_name.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading admin panel...</div>
        </div>
      </div>
    )
  }

  if (!userData?.is_admin) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-red-50 via-white to-red-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-gradient-to-b from-red-900 to-red-950 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-red-800 px-6">
            <Link href="/admin" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-white" />
              <Badge variant="destructive" className="bg-red-600">
                ADMIN
              </Badge>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-6 rounded-lg bg-red-800/50 p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-red-200" />
                <div>
                  <p className="text-sm font-semibold text-white">Admin Panel</p>
                  <p className="text-xs text-red-200">Platform Control</p>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-red-800 text-white shadow-lg"
                        : "text-red-100 hover:bg-red-800/50 hover:text-white",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="border-t border-red-800 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 text-white hover:bg-red-800/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userData?.profile_image || "/placeholder.svg"} />
                    <AvatarFallback className="bg-red-700 text-white">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{userData?.full_name || "Admin"}</p>
                    <p className="text-xs text-red-200">Administrator</p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>Switch to Store View</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-3 md:px-6 shadow-sm gap-2">
          <Button variant="ghost" size="icon" className="lg:hidden flex-shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 items-center gap-2 md:gap-4 min-w-0">
            <div className="relative flex-1 max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground flex-shrink-0" />
              <Input placeholder="Search..." className="pl-10 text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                12
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 md:px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userData?.profile_image || "/placeholder.svg"} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-medium">{userData?.full_name || "Admin"}</p>
                    <p className="text-xs text-muted-foreground">Administrator</p>
                  </div>
                  <ChevronDown className="h-4 w-4 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
