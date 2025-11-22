"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, Calendar, Shield, CheckCircle2, XCircle, Clock, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  kyc_status: string
  admin_kyc_approved: boolean
  kyc_submitted_at: string
}

interface OnboardingData {
  business_name: string
  store_name: string
  business_category: string
  business_address: string
  full_name: string
  date_of_birth: string
  bvn: string
  government_id_url: string
  selfie_url: string
  bank_name: string
  account_number: string
  account_name: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [showKycDialog, setShowKycDialog] = useState(false)
  const [processingKyc, setProcessingKyc] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

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

  async function viewKycDetails(user: UserData) {
    setSelectedUser(user)
    setShowKycDialog(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}/kyc`)
      if (response.ok) {
        const data = await response.json()
        setOnboardingData(data.onboarding)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch KYC details:", error)
    }
  }

  async function handleKycAction(userId: string, approved: boolean) {
    setProcessingKyc(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      })

      if (response.ok) {
        setShowKycDialog(false)
        fetchUsers()
      } else {
        alert("Failed to update KYC status")
      }
    } catch (error) {
      console.error("[v0] Failed to update KYC:", error)
      alert("Failed to update KYC status")
    } finally {
      setProcessingKyc(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getKycBadge = (user: UserData) => {
    if (user.admin_kyc_approved) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    }
    if (user.kyc_status === "pending_review") {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <XCircle className="h-3 w-3 mr-1" />
        Not Submitted
      </Badge>
    )
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
          <h1 className="text-3xl font-bold tracking-tight">Users & KYC Management</h1>
          <p className="text-muted-foreground">Manage all platform users and approve KYC verifications</p>
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
                      {getKycBadge(user)}
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
                  <div className="flex gap-2">
                    {user.kyc_status === "pending_review" && (
                      <Button onClick={() => viewKycDetails(user)} size="sm" variant="outline" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Review KYC
                      </Button>
                    )}
                  </div>
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

      {/* KYC Review Dialog */}
      <Dialog open={showKycDialog} onOpenChange={setShowKycDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Verification Review</DialogTitle>
            <DialogDescription>Review the user's submitted documents and information</DialogDescription>
          </DialogHeader>

          {selectedUser && onboardingData && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-sm">{onboardingData.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p className="text-sm">{formatDate(onboardingData.date_of_birth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">BVN</p>
                  <p className="text-sm font-mono">{onboardingData.bvn}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
              </div>

              {/* Business Info */}
              <div>
                <h3 className="font-semibold mb-3">Business Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                    <p className="text-sm">{onboardingData.business_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Store Name</p>
                    <p className="text-sm">{onboardingData.store_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <p className="text-sm">{onboardingData.business_category}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-sm">{onboardingData.business_address}</p>
                  </div>
                </div>
              </div>

              {/* Bank Info */}
              <div>
                <h3 className="font-semibold mb-3">Bank Account Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                    <p className="text-sm">{onboardingData.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                    <p className="text-sm font-mono">{onboardingData.account_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Name</p>
                    <p className="text-sm">{onboardingData.account_name}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-3">Uploaded Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  {onboardingData.government_id_url && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Government ID</p>
                      <img
                        src={onboardingData.government_id_url || "/placeholder.svg"}
                        alt="Government ID"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  {onboardingData.selfie_url && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Selfie</p>
                      <img
                        src={onboardingData.selfie_url || "/placeholder.svg"}
                        alt="Selfie"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleKycAction(selectedUser.id, true)}
                  disabled={processingKyc}
                  className="flex-1 gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {processingKyc ? "Processing..." : "Approve KYC"}
                </Button>
                <Button
                  onClick={() => handleKycAction(selectedUser.id, false)}
                  disabled={processingKyc}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {processingKyc ? "Processing..." : "Reject KYC"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
