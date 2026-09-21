"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, MessageCircle, Users, Mail } from "lucide-react"

interface HelpLinks {
  tawkto_url: string | null
  whatsapp_community_url: string | null
  support_email: string | null
}

export default function HelpPage() {
  const [links, setLinks] = useState<HelpLinks | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/settings")
      .then(async (res) => {
        const json = await res.json()
        if (json.ok) setLinks(json.settings)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  const hasAnyLink = links?.tawkto_url || links?.whatsapp_community_url || links?.support_email

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help</h1>
          <p className="text-muted-foreground">Get support from the Blaqora team.</p>
        </div>

        {!hasAnyLink ? (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <h3 className="font-semibold">Support links aren't set up yet</h3>
              <p className="text-sm text-muted-foreground">Check back soon, or reach out through the app.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {links?.tawkto_url && (
              <Card>
                <CardHeader>
                  <MessageCircle className="h-6 w-6 text-primary" />
                  <CardTitle className="mt-2 text-base">Live chat</CardTitle>
                  <CardDescription>Chat with us in real time.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <a href={links.tawkto_url} target="_blank" rel="noreferrer">Start chat</a>
                  </Button>
                </CardContent>
              </Card>
            )}
            {links?.whatsapp_community_url && (
              <Card>
                <CardHeader>
                  <Users className="h-6 w-6 text-primary" />
                  <CardTitle className="mt-2 text-base">WhatsApp community</CardTitle>
                  <CardDescription>Connect with other vendors.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <a href={links.whatsapp_community_url} target="_blank" rel="noreferrer">Join community</a>
                  </Button>
                </CardContent>
              </Card>
            )}
            {links?.support_email && (
              <Card>
                <CardHeader>
                  <Mail className="h-6 w-6 text-primary" />
                  <CardTitle className="mt-2 text-base">Email us</CardTitle>
                  <CardDescription>{links.support_email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <a href={`mailto:${links.support_email}`}>Send email</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
