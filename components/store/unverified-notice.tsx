/**
 * Shown above every storefront template until the vendor's NIN is verified.
 * Neutral wording: buyers can still order, payment still goes through Paystack.
 */
export function UnverifiedNotice() {
  return (
    <div
      role="note"
      style={{
        background: "var(--bq-warning-50)",
        color: "var(--bq-warning-ink)",
        borderBottom: "1px solid color-mix(in srgb, var(--bq-warning) 35%, transparent)",
        fontFamily: "var(--bq-font-body)",
        fontSize: "var(--bq-text-sm)",
        lineHeight: 1.45,
        padding: "var(--bq-space-2) var(--bq-space-4)",
        textAlign: "center",
      }}
    >
      <strong style={{ fontWeight: 700 }}>This seller isn&apos;t verified yet.</strong> They haven&apos;t confirmed their identity with Blaqora.
      Payments are still handled securely by Paystack.
    </div>
  )
}
