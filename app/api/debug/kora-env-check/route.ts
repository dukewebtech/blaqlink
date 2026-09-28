import { NextResponse } from "next/server"

// TEMPORARY diagnostic route — reports presence/shape of KORA_SECRET_KEY in the
// live runtime without exposing the secret itself, to debug why the value
// visible in the Vercel dashboard isn't being read by process.env here.
// Delete this file once the mismatch is diagnosed.
function inspect(name: string) {
  const raw = process.env[name]
  if (raw === undefined) return { present: false }
  return {
    present: true,
    length: raw.length,
    trimmedLength: raw.trim().length,
    prefix: raw.slice(0, 6),
    firstCharCode: raw.charCodeAt(0),
    lastCharCode: raw.charCodeAt(raw.length - 1),
  }
}

export async function GET() {
  return NextResponse.json({
    KORA_SECRET_KEY: inspect("KORA_SECRET_KEY"),
    KORAPAY_SECRET_KEY: inspect("KORAPAY_SECRET_KEY"),
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    COMMIT: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  })
}
