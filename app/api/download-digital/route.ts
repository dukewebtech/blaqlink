import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const filePath = url.searchParams.get("path")
    const orderId = url.searchParams.get("orderId")

    console.log("[v0] Download request - path:", filePath, "orderId:", orderId)

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 })
    }

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the order exists and is paid
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_status, status")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      console.log("[v0] Order not found:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.payment_status !== "success" && order.status !== "confirmed") {
      console.log("[v0] Order not paid:", order.payment_status, order.status)
      return NextResponse.json({ error: "Order not paid" }, { status: 403 })
    }

    // Extract the storage path and bucket
    let bucket = "digital-files"
    let storagePath = filePath

    // Handle new format: "digital-files:path/to/file"
    if (filePath.startsWith("digital-files:")) {
      storagePath = filePath.replace("digital-files:", "")
    }
    // Handle old URL format
    else if (filePath.includes("/digital-files/")) {
      storagePath = filePath.split("/digital-files/")[1]
    }
    // Handle product-images bucket fallback
    else if (filePath.includes("/product-images/")) {
      bucket = "product-images"
      storagePath = filePath.split("/product-images/")[1]
    }

    console.log("[v0] Generating signed URL for bucket:", bucket, "path:", storagePath)

    // Generate a signed URL for download (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600, {
        download: true,
      })

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.log("[v0] Error generating signed URL:", signedUrlError)
      return NextResponse.json({ error: "Failed to generate download link" }, { status: 500 })
    }

    console.log("[v0] Signed URL generated successfully")

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrlData.signedUrl)
  } catch (error) {
    console.error("[v0] Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
