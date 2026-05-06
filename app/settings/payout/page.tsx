"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Building2, User, CheckCircle2 } from "lucide-react"

export default function PayoutSettingsPage() {
  const [isAutomatic, setIsAutomatic] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBankDetails()
  }, [])

  const fetchBankDetails = async () => {
    try {
      const response = await fetch("/api/users/me")
      if (response.ok) {
        const { data } = await response.json()
        if (data?.user) {
          setBankDetails({
            bankName: data.user.bank_name || "",
            accountNumber: data.user.account_number || "",
            accountHolder: data.user.account_name || "",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching bank details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/users/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: bankDetails.bankName,
          account_number: bankDetails.accountNumber,
          account_name: bankDetails.accountHolder,
        }),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert("Failed to save bank details")
      }
    } catch (error) {
      console.error("Error saving bank details:", error)
      alert("Failed to save bank details")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Settings</h1>
          <p className="text-muted-foreground mt-2">Manage how you receive payments from your store</p>
        </div>

        {/* Payout Mode Card */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payout Mode
            </CardTitle>
            <CardDescription>Choose how you want to receive your payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
              <div className="space-y-1">
                <p className="font-medium">Automatic Payouts</p>
                <p className="text-sm text-muted-foreground">
                  Receive payments automatically after each successful transaction
                </p>
              </div>
              <Switch
                checked={isAutomatic}
                onCheckedChange={setIsAutomatic}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {!isAutomatic && (
              <div className="p-4 rounded-lg border border-border bg-accent/50 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm font-medium mb-1">Manual Payout Mode Active</p>
                <p className="text-sm text-muted-foreground">
                  You'll need to manually request payouts from your dashboard. Funds will be held until you initiate a
                  withdrawal.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Details Card */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Bank Account Details
            </CardTitle>
            <CardDescription>Enter your bank information to receive payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Bank Name */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300 delay-100">
                <Label htmlFor="bankName" className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Bank Name
                </Label>
                <Input
                  id="bankName"
                  placeholder="e.g., Chase Bank, Bank of America"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              {/* Account Number */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300 delay-200">
                <Label htmlFor="accountNumber" className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Account Number
                </Label>
                <Input
                  id="accountNumber"
                  placeholder="Enter your account number"
                  type="text"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Your account number will be encrypted and stored securely
                </p>
              </div>

              {/* Account Holder Name */}
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300 delay-300">
                <Label htmlFor="accountHolder" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Account Holder Name
                </Label>
                <Input
                  id="accountHolder"
                  placeholder="Full name as it appears on your account"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  value={bankDetails.accountHolder}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Separator />

            {/* Security Notice */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-foreground/80">
                <span className="font-semibold">Security Notice:</span> Your banking information is encrypted using
                industry-standard security protocols and will never be shared with third parties.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="min-w-[200px] transition-all duration-200 hover:scale-105"
            onClick={handleSave}
            disabled={isSaving || saved || isLoading}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Saved Successfully
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
          {saved && (
            <p className="text-sm text-success animate-in fade-in slide-in-from-left-2 duration-300">
              Your payout settings have been updated
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
