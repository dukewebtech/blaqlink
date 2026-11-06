import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, type LegalSection } from "@/components/legal/legal-page"
import { LEGAL } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Privacy Policy | Blaqora",
  description: "What personal data Blaqora collects, why, who we share it with, and your rights.",
  alternates: { canonical: "/privacy" },
}

const sections: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <>
        <p>
          {LEGAL.tradingName} is operated by {LEGAL.legalEntity} (RC {LEGAL.rcNumber}), {LEGAL.registeredAddress}. We
          are the data controller for the personal data described here, under the Nigeria Data Protection Act 2023
          (NDPA).
        </p>
        <p>
          When you buy from a store, the seller also receives your order details so they can fulfil your order. They are
          responsible for how they use that data.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <h3>If you run a store</h3>
        <ul>
          <li>your name, email address, phone number and password</li>
          <li>your business name, address, logo, store link and the items you list</li>
          <li>your National Identification Number (NIN) and the legal name it returns</li>
          <li>your bank name, account number and account name</li>
          <li>your sales, payouts and plan history</li>
        </ul>
        <h3>If you buy from a store</h3>
        <ul>
          <li>your name, email address and phone number</li>
          <li>your delivery address, if your order is delivered</li>
          <li>what you bought, booking times, and any note you leave for the seller</li>
          <li>a payment reference. Paystack handles your card details and we never see them</li>
        </ul>
        <h3>When you use the site</h3>
        <ul>
          <li>basic technical data such as your browser, device type and pages visited</li>
          <li>the contents of your bag, saved in your own browser</li>
        </ul>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <>
        <p>We use your data only for these purposes, and on these legal bases under the NDPA:</p>
        <ul>
          <li>
            <strong>To run Blaqora</strong>: your account, stores, checkout, orders, delivery, receipts and payouts.
            This is necessary to perform our contract with you.
          </li>
          <li>
            <strong>To verify identity and prevent fraud</strong>: NIN checks before payouts, and spotting suspicious
            payments. This is required by law and is in our legitimate interest.
          </li>
          <li>
            <strong>To keep records</strong>: transaction and tax records we must keep by law.
          </li>
          <li>
            <strong>To support and improve the service</strong>: answering questions, fixing problems and measuring
            which features are used. This is in our legitimate interest.
          </li>
          <li>
            <strong>To send you news about Blaqora</strong>: only with your consent, which you can withdraw at any time.
          </li>
        </ul>
        <p>We don’t sell your personal data.</p>
      </>
    ),
  },
  {
    id: "share",
    title: "Who we share it with",
    body: (
      <>
        <ul>
          <li>
            <strong>The seller you buy from</strong> receives your name, contact details, delivery address and order.
          </li>
          <li>
            <strong>Paystack</strong> processes buyers’ payments.
          </li>
          <li>
            <strong>Korapay</strong> verifies sellers’ NIN and sends payouts.
          </li>
          <li>
            <strong>Terminal Africa and Shipbubble</strong> receive delivery details when a seller uses them to ship.
          </li>
          <li>
            <strong>Supabase</strong> stores our database and files, <strong>Vercel</strong> hosts the site and
            provides privacy-friendly analytics, and <strong>Resend</strong> sends our emails.
          </li>
          <li>
            <strong>Authorities</strong>, such as regulators, courts or the police, when the law requires it.
          </li>
        </ul>
        <p>Each of these companies may only use your data to provide their service to us or to the seller.</p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "Data stored outside Nigeria",
    body: (
      <p>
        Some of the companies above store data on servers outside Nigeria. When this happens, we rely on the safeguards
        the NDPA allows, such as contracts that require them to protect your data to the same standard.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <>
        <p>
          We keep account data while your account is open. When you close it, we delete or anonymise your data within a
          reasonable time, except for records we must keep by law.
        </p>
        <p>
          Order, payment, payout and identity records are kept for as long as Nigerian tax, anti-money-laundering and
          accounting laws require.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the NDPA, you can ask us to:</p>
        <ul>
          <li>give you a copy of your personal data</li>
          <li>correct data that’s wrong or incomplete</li>
          <li>delete your data, where we don’t need to keep it by law</li>
          <li>stop or limit how we use it, or object to a particular use</li>
          <li>send your data to you or another company in a common format</li>
          <li>withdraw consent you’ve given, such as for marketing emails</li>
        </ul>
        <p>
          Email <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a> and we’ll reply within 30 days. If
          you’re not happy with our answer, you can complain to the Nigeria Data Protection Commission (NDPC).
        </p>
        <p>If your request is about an order, we may pass it to the seller, who holds a copy of your order details.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and browser storage",
    body: (
      <>
        <p>We only use what Blaqora needs to work:</p>
        <ul>
          <li>sign-in cookies that keep you logged in to your dashboard</li>
          <li>browser storage that remembers what’s in your bag on each store</li>
        </ul>
        <p>
          Our analytics don’t use cookies or track you across other websites. We don’t use advertising cookies.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Keeping your data safe",
    body: (
      <p>
        We use encrypted connections, restrict who on our team can see personal data, and never store card details. No
        system is perfectly secure. If a breach affects you, we’ll tell you and the NDPC as the law requires.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Seller accounts are for people aged 18 and over. We don’t knowingly collect data from children. If you think a
        child has given us their data, please contact us and we’ll delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We’ll update this page when our practices change and change the date at the top. If a change matters, we’ll
        email sellers before it takes effect. See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      current="/privacy"
      title="Privacy Policy"
      intro="What personal data we collect when you sell or buy on Blaqora, why we need it, who sees it, and how to control it."
      sections={sections}
    />
  )
}
