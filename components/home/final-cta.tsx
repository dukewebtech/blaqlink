import { Ticket, Calendar, ShoppingBag, Download } from "lucide-react"
import { ClaimField } from "./claim-field"
import styles from "./home.module.css"

export function FinalCta() {
  return (
    <section className={styles.final}>
      <div className="bq-container">
        <div className={styles.finalPanel}>
          <div className={styles.finalCopy}>
            <h2>Your store is one link away.</h2>
            <p>Claim your name before someone else does.</p>
            <ClaimField className={styles.claimFinal} buttonVariant="dark" />
          </div>
          <div className={styles.finalArt} aria-hidden="true">
            <span className={`${styles.fa} ${styles.faTix}`}>
              <Ticket aria-hidden="true" />
            </span>
            <span className={`${styles.fa} ${styles.faBook}`}>
              <Calendar aria-hidden="true" />
            </span>
            <span className={`${styles.fa} ${styles.faProd}`}>
              <ShoppingBag aria-hidden="true" />
            </span>
            <span className={`${styles.fa} ${styles.faDig}`}>
              <Download aria-hidden="true" />
            </span>
            <span className={styles.faCenter}>
              <img src="/blaqora-icon.png" alt="" width={84} height={84} />
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
