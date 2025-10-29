"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, Shield } from "lucide-react"

interface UserData {
  id: string
  full_name: string
  business_name: string
  email: string
  phone: string
  role: string
  is_admin: boolean
  created_at: string
  total_products: number
  total_orders: number
  total_revenue: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/admin/users")
        if (!response.ok) throw new Error("Failed to fetch users")
        const data = await response.json()
        setUsers(data.users || [])
      } catch (error) {
        console.error("[v0] Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading users...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users & Accounts</h1>
          <p className="text-muted-foreground">Manage all platform users and their accounts</p>
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {user.full_name || user.business_name || "Unnamed User"}
                      {user.is_admin && (
                        <Badge variant="destructive" className="ml-2">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>{user.role || "vendor"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium">{user.total_products}</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(user.total_revenue)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Joined {formatDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
