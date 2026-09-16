"use client"

import { Check } from "lucide-react"
import { useStoreLink } from "./store-link-context"
import { ClaimField } from "./claim-field"
import { NotificationStack } from "./notification-stack"
import styles from "./home.module.css"

const ASSURANCES = ["No coding or developer", "Secure checkout by Paystack", "One simple plan"]

export function Hero() {
  const { displayName, initial } = useStoreLink()

  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} aria-hidden="true" />
      <div className={`bq-container ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <h1 className={`${styles.heroTitle} ${styles.animate}`}>
            <span className={styles.line}>
              <span>Sell anything.</span>
            </span>
            <span className={styles.line}>
              <span>Get paid from</span>
            </span>
            <span className={styles.line}>
              <span>one link.</span>
            </span>
          </h1>
          <p className={styles.heroLede}>
            Tickets, bookings, products and digital downloads in one beautiful store. Set it up in minutes, share it
            anywhere, and let Blaqora handle checkout. No developer needed.
          </p>

          <ClaimField />

          <ul className={styles.heroAssure}>
            {ASSURANCES.map((text) => (
              <li key={text}>
                <Check aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.heroStage} aria-hidden="true">
          <div className={`${styles.orbit} ${styles.orbit1}`} />
          <div className={`${styles.orbit} ${styles.orbit2}`} />

          <div className={styles.phone}>
            <div className={styles.phoneScreen}>
              <div className={styles.sf}>
                <div className={styles.sfBanner}>
                  <span className={styles.sfPattern} />
                </div>
                <div className={styles.sfProfile}>
                  <span className={styles.sfAvatar}>{initial}</span>
                  <div className={styles.sfId}>
                    <p className={styles.sfName}>{displayName}</p>
                    <p className={styles.sfBio}>Shows, sessions, goods and guides</p>
                  </div>
                </div>
                <div className={styles.sfTabs}>
                  <span className={styles.isOn}>All</span>
                  <span>Tickets</span>
                  <span>Book</span>
                  <span>Shop</span>
                </div>
                <div className={styles.sfGrid}>
                  <div className={styles.sfCard}>
                    <div className={`${styles.art} ${styles.artPoster}`}>
                      <span className={styles.artKicker}>Fri, 24 Oct</span>
                      <span className={styles.artBig}>
                        Lagos
                        <br />
                        Live
                      </span>
                      <span className={styles.artSun} />
                    </div>
                    <p className={styles.sfT}>Lagos Live</p>
                    <p className={styles.sfP}>₦5,000</p>
                  </div>
                  <div className={styles.sfCard}>
                    <div className={`${styles.art} ${styles.artBook}`}>
                      <div className={styles.artCal}>
                        <i /><i /><i className={styles.on} /><i /><i /><i />
                      </div>
                      <span className={styles.artTime}>10:00 AM</span>
                    </div>
                    <p className={styles.sfT}>Braids session</p>
                    <p className={styles.sfP}>₦15,000</p>
                  </div>
                  <div className={styles.sfCard}>
                    <div className={`${styles.art} ${styles.artTote}`}>
                      <span className={styles.tote}>
                        <span className={styles.toteHandle} />
                        <span className={styles.toteBody} />
                      </span>
                    </div>
                    <p className={styles.sfT}>Ankara tote</p>
                    <p className={styles.sfP}>₦18,500</p>
                  </div>
                  <div className={styles.sfCard}>
                    <div className={`${styles.art} ${styles.artEbook}`}>
                      <div className={styles.ebook}>
                        <span className={styles.ebookT}>
                          Money
                          <br />
                          Plan
                        </span>
                        <span className={styles.ebookA}>PDF guide</span>
                      </div>
                    </div>
                    <p className={styles.sfT}>Budget planner</p>
                    <p className={styles.sfP}>₦2,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.floatEl} ${styles.floatLink}`}>
            <span className={styles.floatDot} />
            <span className={styles.floatUrl}>
              blaqora.store/<b>{displayName}</b>
            </span>
          </div>

          <NotificationStack />
        </div>
      </div>
    </section>
  )
}
