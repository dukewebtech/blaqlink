import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {

    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error("[v0] FormData parsing error:", error)
      return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 })
    }

    const fileEntry = formData.get("file")

    if (!fileEntry) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "Invalid file format" }, { status: 400 })
    }

    const file = fileEntry as File

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

    const arrayBuffer = await file.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: file.type })

    // Private bucket only. Paid files must never land in a public bucket,
    // so there is deliberately no fallback.
    const { data, error } = await supabase.storage.from("digital-files").upload(fileName, blob, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("[upload-digital] storage upload failed:", error.message)
      return NextResponse.json({ error: "That file didn't upload. Please try again." }, { status: 500 })
    }

    const storagePath = `digital-files:${data.path}`

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
