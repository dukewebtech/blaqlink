import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, type LegalSection } from "@/components/legal/legal-page"
import { LEGAL } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Refund Policy | Blaqora",
  description: "How refunds work for tickets, bookings, products and digital downloads bought on Blaqora stores.",
  alternates: { canonical: "/refunds" },
}

const sections: LegalSection[] = [
  {
    id: "start",
    title: "Start with the seller",
    body: (
      <>
        <p>
          Every Blaqora store is run by an independent seller, and they handle refunds for what they sell. If there’s a
          problem with your order, contact the seller first, using the details in your order confirmation email. Keep
          your order reference handy.
        </p>
        <p>
          Sellers can offer more generous terms than this policy, and many do. They can’t offer less. The rules below are
          the minimum every seller must follow.
        </p>
      </>
    ),
  },
  {
    id: "tickets",
    title: "Event tickets",
    body: (
      <ul>
        <li>
          <strong>Event cancelled:</strong> you get a full refund of the ticket price.
        </li>
        <li>
          <strong>Event moved to a new date:</strong> your ticket stays valid. If you can’t make the new date, ask the
          seller for a refund before the original event date.
        </li>
        <li>
          <strong>You can’t attend:</strong> tickets aren’t refundable unless the seller’s store says otherwise.
        </li>
      </ul>
    ),
  },
  {
    id: "bookings",
    title: "Bookings",
    body: (
      <ul>
        <li>
          <strong>The seller cancels or doesn’t show up:</strong> you get a full refund, or a new time if you prefer.
        </li>
        <li>
          <strong>You cancel or reschedule:</strong> the seller’s cancellation terms apply. Check the booking page before
          you pay.
        </li>
      </ul>
    ),
  },
  {
    id: "products",
    title: "Physical products",
    body: (
      <>
        <ul>
          <li>
            <strong>Never arrived:</strong> you get a full refund, including the delivery fee.
          </li>
          <li>
            <strong>Damaged, faulty or not as described:</strong> tell the seller within 7 days of delivery, with
            photos. They will repair, replace or refund it.
          </li>
          <li>
            <strong>Changed your mind:</strong> returns are at the seller’s discretion. Check their store for details.
          </li>
        </ul>
        <p>If you return an item, keep proof of postage until your refund arrives.</p>
      </>
    ),
  },
  {
    id: "digital",
    title: "Digital products",
    body: (
      <p>
        Because downloads can’t be returned, digital products aren’t refundable once delivered. The exception is a file
        that’s broken, missing or clearly not what was described, and that the seller can’t fix. Then you get a full
        refund.
      </p>
    ),
  },
  {
    id: "escalate",
    title: "If the seller doesn’t help",
    body: (
      <>
        <p>
          If the seller doesn’t reply within 3 working days, or you can’t agree, email{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> within 14 days of the problem. Include:
        </p>
        <ul>
          <li>your order reference and the store’s link</li>
          <li>what went wrong, with photos or screenshots if you have them</li>
          <li>what you’ve already tried with the seller</li>
        </ul>
        <p>
          We’ll look at both sides and tell you our decision. If we agree you’re owed a refund under this policy, we can
          pay it from the seller’s Blaqora balance.
        </p>
      </>
    ),
  },
  {
    id: "how",
    title: "How you’re refunded",
    body: (
      <p>
        Refunds go back to the card or account you paid with, through Paystack. Once a refund is approved, it usually
        takes 5 to 10 working days to appear, depending on your bank. If you asked your bank for a chargeback instead,
        the bank’s process applies.
      </p>
    ),
  },
  {
    id: "sellers",
    title: "For sellers",
    body: (
      <>
        <ul>
          <li>Refunds you give, and chargebacks on your sales, are deducted from your Blaqora balance.</li>
          <li>Per-sale fees aren’t returned when a sale is refunded.</li>
          <li>
            Your monthly plan fee covers the month you’re in. If you cancel, your plan runs to the end of that month and
            isn’t refunded for the days left.
          </li>
          <li>Put any extra refund terms on your store, so buyers see them before they pay.</li>
        </ul>
        <p>
          See our <Link href="/terms">Terms of Service</Link> for how balances, holds and payouts work.
        </p>
      </>
    ),
  },
]

export default function RefundsPage() {
  return (
    <LegalPage
      current="/refunds"
      title="Refund Policy"
      intro="What happens when an order goes wrong: who to contact, what you're entitled to for each kind of purchase, and how we step in if needed."
      sections={sections}
    />
  )
}
