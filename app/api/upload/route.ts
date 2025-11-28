import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload request received")

    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Upload auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    let formData: FormData
    try {
      formData = await request.formData()
      console.log("[v0] FormData parsed successfully")
    } catch (error) {
      console.error("[v0] FormData parsing error:", error)
      return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 })
    }

    const fileEntry = formData.get("file")

    if (!fileEntry) {
      console.log("[v0] No file in formData")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!(fileEntry instanceof File)) {
      console.log("[v0] File entry is not a File object:", typeof fileEntry)
      return NextResponse.json({ error: "Invalid file format" }, { status: 400 })
    }

    const file = fileEntry as File
    console.log("[v0] File received:", file.name, file.type, file.size)

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml", "image/webp", "image/avif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, SVG, WebP, and AVIF are allowed" },
        { status: 400 },
      )
    }

    // Validate file size (4MB max)
    const maxSize = 4 * 1024 * 1024 // 4MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 4MB limit" }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    console.log("[v0] Uploading file:", fileName)

    const arrayBuffer = await file.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: file.type })

    console.log("[v0] File converted to Blob, size:", blob.size)

    const { data, error } = await supabase.storage.from("product-images").upload(fileName, blob, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("[v0] Supabase upload error details:", {
        message: error.message,
        name: error.name,
        cause: error.cause,
      })
      return NextResponse.json(
        {
          error: "Failed to upload image to storage",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] File uploaded successfully:", data.path)

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(fileName)

    console.log("[v0] Public URL:", publicUrl)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    })
  } catch (error: any) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 })
  }
}
