import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function page(title: string, message: string, status: number) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;background:#F5F7FC;color:#0A0E27}main{max-width:420px;text-align:center}p{color:#4B5275;line-height:1.6}</style></head>
<body><main><h1>${title}</h1><p>${message}</p></main></body></html>`
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } })
}

/**
 * Paid file download. The link carries the order item's random token — never
 * a storage path — so a buyer can only ever get the file they paid for, and
 * claim_download counts each download against the product's limit.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token") ?? ""
  const fileIndex = Number(url.searchParams.get("file") ?? "0")
  if (!UUID_RE.test(token) || !Number.isInteger(fileIndex) || fileIndex < 0) {
    return page("This link isn't valid", "Open the download link from your email again. If it still doesn't work, contact the seller.", 404)
  }

  const supabase = createAdminClient()
  const { data: claim, error } = await supabase.rpc("claim_download", { p_token: token })
  if (error) {
    console.error("[download] claim failed:", error.message)
    return page("Download unavailable", "Something went wrong on our side. Please try again in a moment.", 500)
  }
  if (claim?.result === "limit_reached") {
    return page(
      "Download limit reached",
      `This purchase allows ${claim.limit} download${claim.limit === 1 ? "" : "s"}, and they've all been used. Contact the seller if you need it again.`,
      403,
    )
  }
  if (claim?.result !== "ok") {
    return page("This link isn't valid", "Open the download link from your email again. If it still doesn't work, contact the seller.", 404)
  }

  const { data: product } = await supabase.from("products").select("file_urls").eq("id", claim.product_id).maybeSingle()
  const stored = product?.file_urls?.[fileIndex]
  if (!stored) {
    return page("File not available", "The seller has removed this file. Contact them for a copy.", 404)
  }

  // Stored as "digital-files:<path>"
  const path = stored.startsWith("digital-files:") ? stored.slice("digital-files:".length) : null
  if (!path) {
    console.error("[download] unexpected storage reference for product", claim.product_id)
    return page("File not available", "Contact the seller for a copy.", 404)
  }

  const { data: signed, error: signError } = await supabase.storage.from("digital-files").createSignedUrl(path, 60, {
    download: path.split("/").pop()?.replace(/^\d+-/, "") ?? true,
  })
  if (signError || !signed?.signedUrl) {
    console.error("[download] signing failed:", signError?.message)
    return page("Download unavailable", "Something went wrong on our side. Please try again in a moment.", 500)
  }

  // A 60-second signed link, so large files stream straight from storage.
  return NextResponse.redirect(signed.signedUrl, 302)
}
