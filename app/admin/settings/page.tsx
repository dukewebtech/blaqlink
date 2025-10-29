"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function AdminSettingsPage() {
  const [userData, setUserData] = useState<any>(null)
  const [platformSettings, setPlatformSettings] = useState<any>(null)
  const [commission, setCommission] = useState("")
  const [minWithdrawal, setMinWithdrawal] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user data
        const userResponse = await fetch("/api/users/me")
        const userResult = await userResponse.json()
        if (userResult.ok && userResult.data?.user) {
          setUserData(userResult.data.user)
        }

        const settingsResponse = await fetch("/api/admin/settings")
        const settingsResult = await settingsResponse.json()
        if (settingsResult.ok && settingsResult.settings) {
          setPlatformSettings(settingsResult.settings)
          setCommission(settingsResult.settings.commission_percentage?.toString() || "10")
          setMinWithdrawal(settingsResult.settings.minimum_withdrawal_amount?.toString() || "5000")
          console.log("[v0] Platform settings loaded:", settingsResult.settings)
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSavePlatformSettings = async () => {
    try {
      setSaving(true)
      console.log("[v0] Saving platform settings:", { commission, minWithdrawal })

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commission_percentage: Number(commission),
          minimum_withdrawal_amount: Number(minWithdrawal),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setPlatformSettings(result.settings)
        console.log("[v0] Platform settings saved successfully:", result.settings)
        toast({
          title: "Settings Saved",
          description: "Platform settings have been updated successfully.",
        })
      } else {
        console.error("[v0] Failed to save settings:", result.error)
        toast({
          title: "Error",
          description: result.error || "Failed to save settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving platform settings:", error)
      toast({
        title: "Error",
        description: "Failed to save platform settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your admin settings have been updated successfully.",
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading settings...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground">Manage your admin profile and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your admin account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={userData?.full_name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={userData?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue={userData?.phone || ""} />
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>Configure platform-wide settings that affect all vendors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commission">Platform Commission (%)</Label>
              <Input
                id="commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Percentage deducted from vendor revenue. Current: {commission}%
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-withdrawal">Minimum Withdrawal Amount (NGN)</Label>
              <Input
                id="min-withdrawal"
                type="number"
                min="0"
                step="100"
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Minimum amount vendors can withdraw. Current: NGN {Number(minWithdrawal).toLocaleString()}
              </p>
            </div>
            <Button onClick={handleSavePlatformSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Platform Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
