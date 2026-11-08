import styles from "./home.module.css"

const QA = [
  {
    q: "What can I sell on Blaqora?",
    a: "Four things, from the same store: event tickets, bookings for your time or services, physical products, and digital products like e-books, templates and course files.",
  },
  {
    q: "Do I need a website or a developer?",
    a: "No. You get a ready-made store at your own blaqora.store link. Add your items, share the link, and you're selling.",
  },
  {
    q: "How much does it cost?",
    a: "Every store starts on the Free plan, with no monthly fee and a fee on each sale. Paid plans add a monthly fee and lower your fee per sale. The Pricing section above shows the current prices and what each plan includes.",
  },
  {
    q: "How do my customers pay?",
    a: "They check out on your store through Paystack's secure payment page.",
  },
  {
    q: "How do I get my money?",
    a: "Your sales show up in your Blaqora balance. From Payouts in your dashboard, you withdraw to your bank account.",
  },
  {
    q: "Can I sell more than one type of thing?",
    a: "Yes. Sell tickets on Friday, take bookings on Saturday and sell your merch all week, from the same link.",
  },
]

export function Faq() {
  return (
    <section className={`${styles.sec} ${styles.faq}`} id="faq">
      <div className={`bq-container ${styles.faqGrid}`}>
        <div className={styles.head}>
          <h2>Questions vendors ask</h2>
          <p>
            Can&apos;t find your answer? Email <a href="mailto:hello@blaqora.store">hello@blaqora.store</a> and we&apos;ll get back to you.
          </p>
        </div>
        <div className={styles.faqList}>
          {QA.map((item, i) => (
            <details key={item.q} className={styles.qa} open={i === 0}>
              <summary>{item.q}</summary>
              <div className={styles.qaA}>
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
