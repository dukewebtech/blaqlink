"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Settings, CreditCard, Mail, Shield } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure platform-wide settings and policies</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>General Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input id="platform-name" placeholder="Your E-commerce Platform" defaultValue="E-commerce Platform" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input id="support-email" type="email" placeholder="support@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                <Input id="commission-rate" type="number" placeholder="0" defaultValue="0" />
                <p className="text-sm text-muted-foreground">Percentage of each transaction taken as platform fee</p>
              </div>
              <Button>Save General Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Payment Gateway</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paystack-public">Paystack Public Key</Label>
                <Input id="paystack-public" placeholder="pk_test_..." type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paystack-secret">Paystack Secret Key</Label>
                <Input id="paystack-secret" placeholder="sk_test_..." type="password" />
              </div>
              <p className="text-sm text-muted-foreground">These keys are configured via environment variables</p>
              <Button variant="outline">Test Connection</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Email Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Order Confirmations</div>
                  <div className="text-sm text-muted-foreground">Send email when orders are placed</div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Withdrawal Notifications</div>
                  <div className="text-sm text-muted-foreground">Notify admins of new withdrawal requests</div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">New Store Registrations</div>
                  <div className="text-sm text-muted-foreground">Alert when new stores register</div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Security & Policies</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-withdrawal">Minimum Withdrawal Amount (₦)</Label>
                <Input id="min-withdrawal" type="number" placeholder="5000" defaultValue="5000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-withdrawal">Maximum Withdrawal Amount (₦)</Label>
                <Input id="max-withdrawal" type="number" placeholder="1000000" defaultValue="1000000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-key">Admin Setup Key</Label>
                <Input id="admin-key" type="password" placeholder="Current: admin123" />
                <p className="text-sm text-muted-foreground">Change the key required to create new admin accounts</p>
              </div>
              <Button>Save Security Settings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
