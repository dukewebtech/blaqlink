import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const filePath = url.searchParams.get("path")
    const orderId = url.searchParams.get("orderId")

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 })
    }

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Create Supabase client with service role for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify order exists and is paid
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_status, status")
      .eq("id", orderId)
      .maybeSingle()

    if (orderError) {
      return NextResponse.json({ error: "Failed to verify order" }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.payment_status !== "success" && order.status !== "confirmed") {
      return NextResponse.json({ error: "Order not paid" }, { status: 403 })
    }

    // Extract storage path from various URL formats
    let bucket = "digital-files"
    let storagePath = filePath

    // Handle format: "digital-files:path/to/file"
    if (filePath.startsWith("digital-files:")) {
      storagePath = filePath.replace("digital-files:", "")
    }
    // Handle full URL format with /object/public/
    else if (filePath.includes("/object/public/digital-files/")) {
      storagePath = filePath.split("/object/public/digital-files/")[1]
    }
    // Handle full URL format with /digital-files/
    else if (filePath.includes("/digital-files/")) {
      storagePath = filePath.split("/digital-files/")[1]
    }
    // Handle product-images bucket
    else if (filePath.includes("/product-images/")) {
      bucket = "product-images"
      storagePath = filePath.split("/product-images/")[1]
    }

    const { data: fileData, error: downloadError } = await supabase.storage.from(bucket).download(storagePath)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
    }

    // Extract filename from path (remove timestamp prefix if present)
    const pathParts = storagePath.split("/")
    let filename = pathParts[pathParts.length - 1]
    // Remove timestamp prefix (e.g., "1764097450666-filename.pdf" -> "filename.pdf")
    const timestampMatch = filename.match(/^\d+-(.+)$/)
    if (timestampMatch) {
      filename = timestampMatch[1]
    }

    // Determine content type based on file extension
    const extension = filename.split(".").pop()?.toLowerCase() || ""
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      zip: "application/zip",
      mp4: "video/mp4",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      mp3: "audio/mpeg",
      epub: "application/epub+zip",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    const contentType = contentTypes[extension] || "application/octet-stream"

    return new NextResponse(fileData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileData.size.toString(),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
