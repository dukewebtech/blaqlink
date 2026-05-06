"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Package,
  Receipt,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  ShoppingBag,
  Menu,
  X,
  Wallet,
  Palette,
  FolderTree,
} from "lucide-react"
import { Logo } from "@/components/logo"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Product", href: "/products-list", icon: Package },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Transaction", href: "/transactions", icon: Receipt },
  { name: "Payouts", href: "/payouts", icon: Wallet },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Sales Report", href: "/sales", icon: BarChart3 },
]

const tools = [
  {
    name: "Account & Settings",
    href: "/settings/account",
    icon: Settings,
    children: [
      { name: "Account Settings", href: "/settings/account" },
      { name: "Payout Settings", href: "/settings/payout" },
      { name: "Store Settings", href: "/settings/store" },
    ],
  },
  { name: "Templates", href: "/templates", icon: Palette },
  { name: "Help", href: "/help", icon: HelpCircle },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const [userData, setUserData] = useState<{
    full_name: string
    business_name: string
    role: string
    email: string
    profile_image?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/users/me")
        const result = await response.json()
        if (result.ok && result.data?.user) {
          setUserData(result.data.user)
        }
      } catch (error) {
        console.error("[v0] Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

  const getUserInitials = () => {
    if (!userData?.full_name) return "U"
    const names = userData.full_name.split(" ")
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase()
    return userData.full_name.substring(0, 2).toUpperCase()
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/logout")
    } catch {
      router.push("/logout")
    }
  }

  const closeSidebar = () => setSidebarOpen(false)

  const isSettingsActive = tools[0].children?.some(
    (child) => pathname === child.href || pathname?.startsWith(child.href + "/"),
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-72 sm:w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-5 border-b border-sidebar-border">
            <Logo />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10"
              onClick={closeSidebar}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Store switcher */}
          <div className="p-3 border-b border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between hover:bg-sidebar-accent h-12">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs text-muted-foreground">Company</p>
                      <p className="text-sm font-semibold truncate">
                        {loading ? "Loading..." : userData?.business_name || "My Store"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Store</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>{userData?.business_name || "My Store"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="space-y-0.5">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-1">
                General
              </p>
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                return (
                  <Link key={item.name} href={item.href} onClick={closeSidebar}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-11 transition-all duration-200",
                        isActive && "bg-sidebar-accent font-medium",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">{item.name}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>

            <div className="pt-4 space-y-0.5">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tools</p>

              {/* Settings with children */}
              <div className="space-y-0.5">
                <Button
                  variant={isSettingsActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11 transition-all duration-200",
                    isSettingsActive && "bg-sidebar-accent font-medium",
                  )}
                  onClick={() => setSettingsOpen(!settingsOpen)}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left">Account & Settings</span>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform duration-200 shrink-0", settingsOpen && "rotate-180")}
                  />
                </Button>
                {settingsOpen && (
                  <div className="ml-4 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                    {tools[0].children!.map((child) => {
                      const isChildActive = pathname === child.href || pathname?.startsWith(child.href + "/")
                      return (
                        <Link key={child.name} href={child.href} onClick={closeSidebar}>
                          <Button
                            variant={isChildActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start gap-3 text-sm h-10 transition-all duration-200",
                              isChildActive && "bg-sidebar-accent/50 font-medium text-primary",
                            )}
                          >
                            <span className="w-5 flex justify-center shrink-0">—</span>
                            <span className="flex-1 text-left">{child.name}</span>
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Templates & Help */}
              {tools.slice(1).map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                return (
                  <Link key={item.name} href={item.href} onClick={closeSidebar}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-11 transition-all duration-200",
                        isActive && "bg-sidebar-accent font-medium",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* User profile */}
          <div className="p-3 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between hover:bg-sidebar-accent h-14">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={userData?.profile_image || "/placeholder.svg?height=36&width=36"} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {loading ? "Loading..." : userData?.full_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {loading ? "..." : userData?.role || "User"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/account">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/account">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Brand on mobile */}
            <div className="flex-1 lg:hidden">
              <Logo />
            </div>

            {/* Spacer on desktop */}
            <div className="hidden lg:flex flex-1" />

            {/* User info — desktop only */}
            <div className="hidden md:flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                <AvatarImage src={userData?.profile_image || "/placeholder.svg?height=36&width=36"} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold leading-none">
                  {loading ? "Loading..." : userData?.full_name || "User"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {loading ? "..." : userData?.role || "User"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
