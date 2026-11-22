import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient, createServerClient } from "@/lib/supabase/server"
import { DIGITAL_FILE_TYPES, MAX_DIGITAL_FILE_BYTES } from "@/lib/products/digital-files"

/**
 * Step 1 of a paid-file upload: returns a one-time signed upload link for
 * the private bucket. The browser then sends the file straight to storage,
 * because Vercel refuses request bodies over ~4.5 MB — which rejected most
 * real PDFs, videos and course files.
 *
 * Body: { name: string, size: number }
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 })

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name : ""
  const size = Number(body?.size)

  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : ""
  const contentType = DIGITAL_FILE_TYPES[ext]
  if (!contentType) {
    return NextResponse.json(
      { error: "That file type isn't supported. Use PDF, ZIP, EPUB, DOC, DOCX, MP3, MP4 or MOV." },
      { status: 400 },
    )
  }
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "That file looks empty. Choose it again." }, { status: 400 })
  }
  if (size > MAX_DIGITAL_FILE_BYTES) {
    return NextResponse.json({ error: "Files can be up to 100 MB. Compress it or split it into parts." }, { status: 400 })
  }

  const safeName = name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(-120)
  const path = `${user.id}/digital/${Date.now()}-${safeName}`

  const { data, error } = await createAdminClient().storage.from("digital-files").createSignedUploadUrl(path)
  if (error || !data) {
    console.error("[upload-digital] signing failed:", error?.message)
    return NextResponse.json({ error: "We couldn't start the upload. Please try again." }, { status: 500 })
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
    contentType,
    // What the product stores; the download route turns it into a short-lived link.
    url: `digital-files:${data.path}`,
  })
}
