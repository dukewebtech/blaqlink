import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, type LegalSection } from "@/components/legal/legal-page"
import { LEGAL } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Terms of Service | Blaqora",
  description: "The rules for selling and buying on Blaqora stores.",
  alternates: { canonical: "/terms" },
}

const sections: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          {LEGAL.tradingName} is operated by {LEGAL.legalEntity} (RC {LEGAL.rcNumber}), {LEGAL.registeredAddress}. In
          these terms, “we”, “us” and “our” mean {LEGAL.tradingName}. “You” means anyone who uses Blaqora, whether you
          run a store (a “seller”) or buy from one (a “buyer”).
        </p>
        <p>
          By creating an account or buying from a Blaqora store, you agree to these terms, our{" "}
          <Link href="/privacy">Privacy Policy</Link> and our <Link href="/refunds">Refund Policy</Link>. If you don’t
          agree, please don’t use Blaqora.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <ul>
        <li>You must be at least 18 years old to open a seller account.</li>
        <li>The details you give us must be true and kept up to date.</li>
        <li>You’re responsible for everything done through your account, so keep your password private.</li>
        <li>Tell us straight away at {LEGAL.contactEmail} if you think someone else has used your account.</li>
      </ul>
    ),
  },
  {
    id: "verification",
    title: "Identity checks",
    body: (
      <>
        <p>
          Before you can withdraw money, we verify your identity using your National Identification Number (NIN). The
          name on your NIN must match the name on the bank account you withdraw to.
        </p>
        <p>
          We may ask for more information at any time, and we may hold withdrawals until a check is complete. We do
          this to protect buyers, sellers and Blaqora from fraud, and because the law requires it.
        </p>
      </>
    ),
  },
  {
    id: "selling",
    title: "Selling on Blaqora",
    body: (
      <>
        <p>
          Blaqora gives you a store at blaqora.store/your-name where you can sell event tickets, bookings, physical
          products and digital products. <strong>You are the seller of everything in your store.</strong> The sale is
          between you and your buyer. Blaqora provides the store and collects payment for you.
        </p>
        <p>As a seller, you agree to:</p>
        <ul>
          <li>describe items honestly, with accurate prices, photos and stock levels</li>
          <li>deliver what you sell, on time and as described</li>
          <li>run events and honour bookings you’ve taken payment for</li>
          <li>publish clear terms for delivery, returns and cancellations, in line with our Refund Policy</li>
          <li>reply to buyers promptly and handle complaints fairly</li>
          <li>follow all laws that apply to you, including consumer protection and tax laws</li>
        </ul>
      </>
    ),
  },
  {
    id: "prohibited",
    title: "What you can’t sell or do",
    body: (
      <>
        <p>You must not use Blaqora to sell, offer or do any of the following:</p>
        <ul>
          <li>anything illegal in Nigeria, or in the country where your buyer is</li>
          <li>weapons, drugs, prescription medicines, or tobacco and alcohol sold to minors</li>
          <li>stolen, counterfeit or fake goods, or items that infringe someone else’s rights</li>
          <li>adult sexual content or services</li>
          <li>gambling, lotteries, investment schemes or “double your money” offers</li>
          <li>tickets for events that don’t exist, or bookings you can’t fulfil</li>
          <li>anything that promotes hate, violence or discrimination</li>
          <li>misleading buyers, collecting payment outside Blaqora for a Blaqora order, or attempting fraud</li>
          <li>interfering with Blaqora’s systems or accessing data you’re not allowed to see</li>
        </ul>
        <p>We can remove any item and suspend any store that breaks these rules.</p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments, fees and payouts",
    body: (
      <>
        <h3>How buyers pay</h3>
        <p>
          Buyers pay on Paystack’s secure checkout. We never see or store full card details. Prices are in naira and
          include any delivery fee shown at checkout.
        </p>
        <h3>Fees</h3>
        <p>
          Sellers pay the monthly fee and per-sale fees of their plan, as shown on our{" "}
          <Link href="/#pricing">Pricing</Link> section and in your dashboard. We deduct per-sale fees before the money
          reaches your balance. We’ll give you at least 30 days’ notice by email before we change your fees.
        </p>
        <h3>Your balance and withdrawals</h3>
        <p>
          Money from your sales, minus fees, is added to your Blaqora balance. You can withdraw it from Payouts in your
          dashboard to a verified Nigerian bank account in your own name.
        </p>
        <p>We may hold or reverse funds in your balance when:</p>
        <ul>
          <li>a buyer disputes a payment or asks their bank for a chargeback</li>
          <li>we owe a buyer a refund under our Refund Policy</li>
          <li>we suspect fraud or a breach of these terms</li>
          <li>a payment provider, court or regulator requires it</li>
        </ul>
        <p>If your balance can’t cover a refund or chargeback, you agree to pay us the difference.</p>
      </>
    ),
  },
  {
    id: "buyers",
    title: "If you’re buying",
    body: (
      <>
        <p>
          When you buy from a Blaqora store, your contract for the item is with that seller, not with Blaqora. The
          seller is responsible for the item, its delivery, and any event or booking.
        </p>
        <p>
          If something goes wrong, contact the seller first. If that doesn’t work, our{" "}
          <Link href="/refunds">Refund Policy</Link> explains how we can help.
        </p>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content",
    body: (
      <>
        <p>
          You own the names, photos, descriptions, files and logos you upload. You give us permission to store, display
          and share them so we can run your store and promote Blaqora, for example by showing your store link preview
          on WhatsApp or Instagram.
        </p>
        <p>You confirm you have the right to use everything you upload.</p>
      </>
    ),
  },
  {
    id: "service",
    title: "Our service",
    body: (
      <>
        <p>
          We work hard to keep Blaqora running, but we can’t promise it will always be available or error-free. We may
          change, add or remove features over time.
        </p>
        <p>
          Some features rely on other companies, such as Paystack and Korapay for payments and identity checks, and
          Terminal Africa and Shipbubble for delivery. Their own terms also apply when you use them.
        </p>
      </>
    ),
  },
  {
    id: "closing",
    title: "Suspending or closing an account",
    body: (
      <>
        <p>
          You can close your account at any time by emailing {LEGAL.contactEmail}. You must first complete or refund any
          open orders. We’ll pay out your remaining balance after any holds described above.
        </p>
        <p>
          We may suspend or close your account if you break these terms, if the law requires it, or if your account puts
          buyers or Blaqora at risk. Where we can, we’ll tell you why and give you a chance to fix the problem.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Our liability",
    body: (
      <>
        <p>
          Blaqora is provided “as is”. As far as the law allows, we are not liable for indirect losses, such as lost
          profits or lost data, or for the acts of sellers, buyers or the companies we work with.
        </p>
        <p>
          As far as the law allows, our total liability to you is limited to the fees you paid us in the 12 months
          before the claim. Nothing in these terms limits rights you have under Nigerian consumer protection law.
        </p>
        <p>
          Sellers agree to cover any losses, costs or claims we face because of their items, their store, or a breach of
          these terms.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. If a change matters, we’ll email sellers at least 30 days before it takes effect.
        The date at the top of this page shows the latest version.
      </p>
    ),
  },
  {
    id: "law",
    title: "Law and disputes",
    body: (
      <p>
        These terms are governed by the laws of the Federal Republic of Nigeria. If we have a dispute, we’ll first try to
        settle it by talking. If we can’t, the courts of {LEGAL.courts} will decide it.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      current="/terms"
      title="Terms of Service"
      intro="The rules for running a store on Blaqora and buying from one. We've kept them as short and plain as we can."
      sections={sections}
    />
  )
}
