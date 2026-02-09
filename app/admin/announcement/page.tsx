"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { Send, Users, User, Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Vendor {
  id: string
  email: string
  full_name: string
  business_name: string
}

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [recipientType, setRecipientType] = useState<"all_vendors" | "specific">("all_vendors")
  const [ctaText, setCtaText] = useState("")
  const [ctaUrl, setCtaUrl] = useState("")
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    sent: number
    failed: number
  } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (recipientType === "specific") {
      fetchVendors()
    }
  }, [recipientType])

  const fetchVendors = async () => {
    setLoadingVendors(true)
    try {
      const response = await fetch("/api/admin/vendors")
      const result = await response.json()
      if (result.ok && result.vendors) {
        setVendors(result.vendors)
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error)
    } finally {
      setLoadingVendors(false)
    }
  }

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors((prev) => (prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]))
  }

  const handleSelectAll = () => {
    if (selectedVendors.length === vendors.length) {
      setSelectedVendors([])
    } else {
      setSelectedVendors(vendors.map((v) => v.id))
    }
  }

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both a title and message",
        variant: "destructive",
      })
      return
    }

    if (recipientType === "specific" && selectedVendors.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one vendor",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setLastResult(null)

    try {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          recipientType,
          recipientIds: recipientType === "specific" ? selectedVendors : undefined,
          ctaText: ctaText || undefined,
          ctaUrl: ctaUrl || undefined,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setLastResult({
          success: true,
          sent: result.results?.sent || 0,
          failed: result.results?.failed || 0,
        })
        toast({
          title: "Notifications Sent",
          description: result.message,
        })
        // Reset form
        setTitle("")
        setMessage("")
        setCtaText("")
        setCtaUrl("")
        setSelectedVendors([])
      } else {
        setLastResult({
          success: false,
          sent: 0,
          failed: 0,
        })
        toast({
          title: "Error",
          description: result.error || "Failed to send notifications",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to send notifications:", error)
      toast({
        title: "Error",
        description: "Failed to send notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Send Notifications</h1>
          <p className="text-xs md:text-base text-muted-foreground">Send email announcements to vendors on the platform</p>
        </div>

        {lastResult && (
          <Alert variant={lastResult.success ? "default" : "destructive"}>
            {lastResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{lastResult.success ? "Notifications Sent" : "Failed to Send"}</AlertTitle>
            <AlertDescription>
              {lastResult.success
                ? `Successfully sent to ${lastResult.sent} recipients${lastResult.failed > 0 ? `, ${lastResult.failed} failed` : ""}`
                : "There was an error sending the notifications. Please try again."}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Compose Message
                </CardTitle>
                <CardDescription>Create your notification message to send to vendors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Email Subject / Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Important Platform Update"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message Content</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your announcement message here..."
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Supports plain text. Keep messages clear and concise.</p>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <Label>Call-to-Action Button (Optional)</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ctaText" className="text-sm text-muted-foreground">
                        Button Text
                      </Label>
                      <Input
                        id="ctaText"
                        placeholder="e.g., View Details"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ctaUrl" className="text-sm text-muted-foreground">
                        Button URL
                      </Label>
                      <Input
                        id="ctaUrl"
                        placeholder="https://..."
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Recipients
                </CardTitle>
                <CardDescription>Choose who should receive this notification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={recipientType}
                  onValueChange={(value) => setRecipientType(value as "all_vendors" | "specific")}
                >
                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <RadioGroupItem value="all_vendors" id="all_vendors" />
                    <Label htmlFor="all_vendors" className="flex-1 cursor-pointer">
                      <div className="font-medium">All Vendors</div>
                      <div className="text-sm text-muted-foreground">
                        Send to every vendor registered on the platform
                      </div>
                    </Label>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <RadioGroupItem value="specific" id="specific" />
                    <Label htmlFor="specific" className="flex-1 cursor-pointer">
                      <div className="font-medium">Specific Vendors</div>
                      <div className="text-sm text-muted-foreground">Select individual vendors to notify</div>
                    </Label>
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                </RadioGroup>

                {recipientType === "specific" && (
                  <div className="mt-4 space-y-3">
                    {loadingVendors ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : vendors.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No vendors found</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">
                            {selectedVendors.length} of {vendors.length} selected
                          </Label>
                          <Button variant="outline" size="sm" onClick={handleSelectAll}>
                            {selectedVendors.length === vendors.length ? "Deselect All" : "Select All"}
                          </Button>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border p-2">
                          {vendors.map((vendor) => (
                            <div
                              key={vendor.id}
                              className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted/50"
                            >
                              <Checkbox
                                id={vendor.id}
                                checked={selectedVendors.includes(vendor.id)}
                                onCheckedChange={() => handleVendorToggle(vendor.id)}
                              />
                              <Label htmlFor={vendor.id} className="flex-1 cursor-pointer">
                                <div className="font-medium">{vendor.business_name || vendor.full_name}</div>
                                <div className="text-xs text-muted-foreground">{vendor.email}</div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>How your email will appear</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-white p-4 space-y-3">
                  <div className="text-xs text-muted-foreground">From: noreply@blaqora.store</div>
                  <div className="font-semibold">{title || "Email Subject"}</div>
                  <div className="border-t pt-3">
                    <p className="text-sm whitespace-pre-wrap">
                      {message || "Your message content will appear here..."}
                    </p>
                    {ctaText && ctaUrl && (
                      <Button className="mt-4" size="sm" asChild>
                        <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
                          {ctaText}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send Notification</CardTitle>
                <CardDescription>Review and send your notification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipients:</span>
                    <Badge variant="secondary">
                      {recipientType === "all_vendors" ? "All Vendors" : `${selectedVendors.length} Selected`}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Has CTA:</span>
                    <Badge variant={ctaText && ctaUrl ? "default" : "outline"}>
                      {ctaText && ctaUrl ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSendNotification}
                  disabled={loading || !title.trim() || !message.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Notification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
