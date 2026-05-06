import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Digital file upload request received")

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
    console.log("[v0] Digital file received:", file.name, file.type, file.size)

    // Validate file type for digital products
    const allowedTypes = [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "audio/mpeg",
      "audio/mp3",
      "application/epub+zip",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    // Also allow by extension for edge cases
    const allowedExtensions = [".pdf", ".zip", ".mp4", ".mov", ".avi", ".mp3", ".epub", ".doc", ".docx"]
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase()

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, ZIP, MP4, MOV, AVI, MP3, EPUB, DOC, DOCX" },
        { status: 400 },
      )
    }

    // Validate file size (100MB max for digital products)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 100MB limit" }, { status: 400 })
    }

    // Generate unique filename preserving original name for display
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${user.id}/digital/${Date.now()}-${originalName}`

    console.log("[v0] Uploading digital file:", fileName)

    const arrayBuffer = await file.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: file.type })

    console.log("[v0] File converted to Blob, size:", blob.size)

    // Upload to digital-files bucket (or product-images if that bucket doesn't exist)
    const { data, error } = await supabase.storage.from("digital-files").upload(fileName, blob, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("[v0] Supabase upload error:", error.message)
      // Try fallback to product-images bucket with digital subfolder
      const { data: fallbackData, error: fallbackError } = await supabase.storage
        .from("product-images")
        .upload(fileName, blob, {
          contentType: file.type,
          upsert: false,
        })

      if (fallbackError) {
        console.error("[v0] Fallback upload error:", fallbackError.message)
        return NextResponse.json(
          {
            error: "Failed to upload file to storage",
            details: fallbackError.message,
          },
          { status: 500 },
        )
      }

      const storagePath = `product-images:${fallbackData.path}`
      console.log("[v0] Digital file uploaded (fallback):", storagePath)

      return NextResponse.json({
        success: true,
        url: storagePath,
        path: fallbackData.path,
        originalName: file.name,
      })
    }

    console.log("[v0] File uploaded successfully:", data.path)

    // The download API will generate signed URLs on demand
    const storagePath = `digital-files:${data.path}`

    console.log("[v0] Digital file storage path:", storagePath)

    return NextResponse.json({
      success: true,
      url: storagePath,
      path: data.path,
      originalName: file.name,
    })
  } catch (error: any) {
    console.error("[v0] Digital upload error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 })
  }
}
