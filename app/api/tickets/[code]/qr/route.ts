import QRCode from "qrcode"
import { getAppUrl } from "@/lib/utils/app-url"

const CODE_RE = /^[0-9a-f]{32}$/

// PNG QR for ticket emails (email clients block data: images). It only
// encodes the ticket's public URL, so it reveals nothing the link doesn't.
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!CODE_RE.test(code)) return new Response("Not found", { status: 404 })
  const png = await QRCode.toBuffer(`${getAppUrl()}/tickets/${code}`, { margin: 1, width: 440, errorCorrectionLevel: "M" })
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  })
}
