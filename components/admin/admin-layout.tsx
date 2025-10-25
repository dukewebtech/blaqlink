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
} from "lucide-react"
import { Logo } from "@/components/logo"

const navigation = [
  { name: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Withdrawal Requests", href: "/admin/withdrawals", icon: Wallet },
  { name: "Users & Stores", href: "/admin/users", icon: Users },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Financial Reports", href: "/admin/reports", icon: BarChart3 },
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
        const result = await response.json()

        if (result.ok && result.data?.user) {
          setUserData(result.data.user)

          if (!result.data.user.is_admin) {
            console.log("[v0] User is not admin, redirecting to setup page")
            router.push("/admin/setup")
          }
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("[v0] Error fetching user data:", error)
        router.push("/login")
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!userData?.is_admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <Logo />
              <Badge variant="destructive" className="text-xs">
                ADMIN
              </Badge>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 border-b border-sidebar-border">
            <div className="w-full p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-destructive/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-destructive" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
                  <p className="text-sm font-semibold text-destructive">Platform Control</p>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 transition-all duration-200",
                      isActive && "bg-sidebar-accent font-medium",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.name}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between hover:bg-sidebar-accent">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 ring-2 ring-destructive/20">
                      <AvatarImage src={userData?.profile_image || "/placeholder.svg?height=36&width=36"} />
                      <AvatarFallback className="bg-destructive/10 text-destructive">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{userData?.full_name || "Admin"}</p>
                      <p className="text-xs text-destructive">Administrator</p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
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

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center gap-4 px-6 py-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users, stores, orders..."
                  className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-[10px]">
                  12
                </Badge>
              </Button>
              <div className="hidden md:flex items-center gap-3 ml-2">
                <Avatar className="h-9 w-9 ring-2 ring-destructive/20">
                  <AvatarImage src={userData?.profile_image || "/placeholder.svg?height=36&width=36"} />
                  <AvatarFallback className="bg-destructive/10 text-destructive">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{userData?.full_name || "Admin"}</p>
                  <p className="text-xs text-destructive">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
