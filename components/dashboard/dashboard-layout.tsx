"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Package,
  Receipt,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  Search,
  Bell,
  ShoppingBag,
  ShoppingCart,
  Menu,
  X,
  Wallet,
  Palette,
} from "lucide-react"
import { Logo } from "@/components/logo"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Product",
    href: "/products/list",
    icon: Package,
    count: 119,
    children: [
      { name: "All Products", href: "/products/list" },
      { name: "Create Product", href: "/products/choose-type" },
    ],
  },
  { name: "Transaction", href: "/transactions", icon: Receipt, count: 441 },
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
  const [productOpen, setProductOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <Logo />
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Store Selector */}
          <div className="p-4 border-b border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between hover:bg-sidebar-accent">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">Company</p>
                      <p className="text-sm font-semibold">Kanky Store</p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Store</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Kanky Store</DropdownMenuItem>
                <DropdownMenuItem>Fashion Hub</DropdownMenuItem>
                <DropdownMenuItem>Tech Store</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">General</p>
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

                if (item.children) {
                  const isChildActive = item.children.some(
                    (child) => pathname === child.href || pathname?.startsWith(child.href + "/"),
                  )
                  const isAnyActive = isActive || isChildActive

                  return (
                    <div key={item.name} className="space-y-1">
                      <Link href={item.href}>
                        <Button
                          variant={isAnyActive ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3 transition-all duration-200",
                            isAnyActive && "bg-sidebar-accent font-medium",
                          )}
                          onClick={() => setProductOpen(!productOpen)}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="flex-1 text-left">{item.name}</span>
                          {item.count && <span className="text-xs text-muted-foreground">({item.count})</span>}
                          <ChevronDown
                            className={cn("h-4 w-4 transition-transform duration-200", productOpen && "rotate-180")}
                          />
                        </Button>
                      </Link>
                      {productOpen && (
                        <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {item.children.map((child) => {
                            const isChildItemActive = pathname === child.href || pathname?.startsWith(child.href + "/")
                            return (
                              <Link key={child.name} href={child.href}>
                                <Button
                                  variant={isChildItemActive ? "secondary" : "ghost"}
                                  className={cn(
                                    "w-full justify-start gap-3 text-sm transition-all duration-200",
                                    isChildItemActive && "bg-sidebar-accent/50 font-medium text-primary",
                                  )}
                                >
                                  <span className="w-5 flex justify-center">—</span>
                                  <span className="flex-1 text-left">{child.name}</span>
                                </Button>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

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
                      {item.count && <span className="text-xs text-muted-foreground">({item.count})</span>}
                    </Button>
                  </Link>
                )
              })}
            </div>

            <div className="pt-4 space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tools</p>
              {tools.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

                if (item.children) {
                  const isChildActive = item.children.some(
                    (child) => pathname === child.href || pathname?.startsWith(child.href + "/"),
                  )
                  const isAnyActive = isActive || isChildActive

                  return (
                    <div key={item.name} className="space-y-1">
                      <Link href={item.href}>
                        <Button
                          variant={isAnyActive ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3 transition-all duration-200",
                            isAnyActive && "bg-sidebar-accent font-medium",
                          )}
                          onClick={() => setSettingsOpen(!settingsOpen)}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="flex-1 text-left">{item.name}</span>
                          <ChevronDown
                            className={cn("h-4 w-4 transition-transform duration-200", settingsOpen && "rotate-180")}
                          />
                        </Button>
                      </Link>
                      {settingsOpen && (
                        <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {item.children.map((child) => {
                            const isChildItemActive = pathname === child.href || pathname?.startsWith(child.href + "/")
                            return (
                              <Link key={child.name} href={child.href}>
                                <Button
                                  variant={isChildItemActive ? "secondary" : "ghost"}
                                  className={cn(
                                    "w-full justify-start gap-3 text-sm transition-all duration-200",
                                    isChildItemActive && "bg-sidebar-accent/50 font-medium text-primary",
                                  )}
                                >
                                  <span className="w-5 flex justify-center">—</span>
                                  <span className="flex-1 text-left">{child.name}</span>
                                </Button>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

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
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between hover:bg-sidebar-accent">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/placeholder.svg?height=36&width=36" />
                      <AvatarFallback>GH</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-semibold">Guy Hawkins</p>
                      <p className="text-xs text-muted-foreground">Admin</p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center gap-4 px-6 py-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search product" className="pl-9 bg-muted/50 border-0 focus-visible:ring-1" />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-[10px]">
                  3
                </Badge>
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-[10px]">
                  4
                </Badge>
              </Button>
              <div className="hidden md:flex items-center gap-3 ml-2">
                <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                  <AvatarImage src="/placeholder.svg?height=36&width=36" />
                  <AvatarFallback>GH</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">Guy Hawkins</p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
