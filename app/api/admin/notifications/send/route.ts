// API endpoint for admins to send system-wide notifications to vendors
import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { sendEmail, getSystemUpdateEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin access
    const adminClient = createAdminClient()
    const { data: userData } = await adminClient.from("users").select("is_admin, role").eq("auth_id", user.id).single()

    if (!userData?.is_admin && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { title, message, recipientType, recipientIds, ctaText, ctaUrl } = await request.json()

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    // Get recipients based on type
    let recipients: { email: string; full_name: string }[] = []

    if (recipientType === "all_vendors") {
      // Send to all vendors
      const { data: vendors } = await adminClient
        .from("users")
        .select("email, full_name")
        .eq("role", "vendor")
        .not("email", "is", null)

      recipients = vendors || []
    } else if (recipientType === "specific" && recipientIds?.length > 0) {
      // Send to specific users
      const { data: users } = await adminClient
        .from("users")
        .select("email, full_name")
        .in("id", recipientIds)
        .not("email", "is", null)

      recipients = users || []
    } else {
      return NextResponse.json({ error: "Invalid recipient configuration" }, { status: 400 })
    }

    // Send emails in batches
    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const recipient of recipients) {
      if (!recipient.email) continue

      const emailContent = getSystemUpdateEmail({
        recipientName: recipient.full_name || "Valued Vendor",
        title,
        message,
        ctaText,
        ctaUrl,
      })

      const result = await sendEmail({
        to: recipient.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })

      if (result.success) {
        results.sent++
      } else {
        results.failed++
        results.errors.push(`${recipient.email}: ${result.error}`)
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log("[v0] System notification sent:", results)

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${results.sent} recipients`,
      results,
    })
  } catch (error) {
    console.error("[v0] System notification error:", error)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
