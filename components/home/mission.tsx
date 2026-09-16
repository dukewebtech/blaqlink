import styles from "./home.module.css"

export function Mission() {
  return (
    <section className={`${styles.sec} ${styles.mission}`}>
      <div className={`bq-container ${styles.missionInner}`}>
        <div className={styles.missionMark} aria-hidden="true">
          <img src="/blaqora-icon.png" alt="" width={64} height={64} />
        </div>
        <blockquote>
          <p>No seller should be kept waiting by a developer before they can start selling.</p>
          <p className={styles.missionBody}>
            We built Blaqora so anyone can get a link they can sell from in minutes, get paid soon after every sale, and
            actually enjoy setting up their store.
          </p>
          <footer>The Blaqora team, made in Nigeria</footer>
        </blockquote>
      </div>
    </section>
  )
}
