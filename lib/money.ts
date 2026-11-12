// The one naira formatter: ₦18,500 (kobo only when there are any), and a true
// minus sign (−) for deductions, per the design rules.
const whole = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 })
const withKobo = new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatNaira(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0)
  if (!Number.isFinite(n)) return "₦0"
  const abs = Math.abs(n)
  const body = Number.isInteger(Math.round(abs * 100) / 100) ? whole.format(abs) : withKobo.format(abs)
  return `${n < 0 ? "−" : ""}₦${body}`
}
