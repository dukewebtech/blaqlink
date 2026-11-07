import { NextResponse } from "next/server"

// Retired: saved bank details without verifying the account with Korapay.
// Bank accounts are saved through POST /api/onboarding (step "bank"), which
// resolves the account name server-side and checks it against the NIN name.
export async function PUT() {
  return NextResponse.json({ error: "Update your bank account from Payout settings." }, { status: 410 })
}

export const POST = PUT
