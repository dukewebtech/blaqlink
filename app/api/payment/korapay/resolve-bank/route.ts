import { NextResponse } from "next/server"
import { getBankCode, resolveBankAccount } from "@/lib/korapay"

export async function POST(request: Request) {
  try {
    const { bank_name, account_number } = await request.json()

    if (!bank_name || !account_number) {
      return NextResponse.json({ error: "bank_name and account_number are required" }, { status: 400 })
    }

    if (account_number.length !== 10) {
      return NextResponse.json({ error: "Account number must be 10 digits" }, { status: 400 })
    }

    const bankCode = getBankCode(bank_name)
    if (!bankCode) {
      return NextResponse.json(
        { error: `Bank "${bank_name}" is not supported. Please select a valid Nigerian bank.` },
        { status: 422 },
      )
    }

    const result = await resolveBankAccount(bankCode, account_number)

    if (!result.status) {
      return NextResponse.json(
        { error: result.message || "Could not resolve account. Please check the account number." },
        { status: 400 },
      )
    }

    return NextResponse.json({
      account_name: result.data?.account_name ?? "",
      account_number: result.data?.account ?? account_number,
      bank_code: bankCode,
    })
  } catch (error) {
    console.error("[resolve-bank] Error:", error)
    return NextResponse.json({ error: "Failed to resolve bank account" }, { status: 500 })
  }
}
