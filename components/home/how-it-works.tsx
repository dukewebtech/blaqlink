"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { useStoreLink } from "./store-link-context"
import styles from "./home.module.css"

const STEPS = [
  { title: "Create your account", desc: "Sign up with your name and email." },
  { title: "Claim your store link", desc: "Choose the name your customers will remember." },
  { title: "Add your first item", desc: "A ticket, a booking, a product or a file." },
  { title: "Share and get paid", desc: "Post your link and watch orders come in." },
]

const DURATION = 5200
const TYPE_TEXT = "Adaeze Okafor"

export function HowItWorks() {
  const { displayName } = useStoreLink()
  const [current, setCurrent] = useState(0)
  const [filled, setFilled] = useState(false)
  const [typed, setTyped] = useState("")

  const sectionRef = useRef<HTMLElement>(null)
  const progressRefs = useRef<(HTMLSpanElement | null)[]>([])
  const playingRef = useRef(false)
  const pausedRef = useRef(false)
  const currentRef = useRef(0)
  const elapsedRef = useRef(0)
  const startTRef = useRef(0)
  const rafRef = useRef<number | undefined>(undefined)
  const fillTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const reduceRef = useRef(false)

  function applyProgress(i: number, value: number) {
    const el = progressRefs.current[i]
    if (el) el.style.transform = `scaleX(${value})`
  }

  function typeInto() {
    clearInterval(typeTimerRef.current)
    if (reduceRef.current) {
      setTyped(TYPE_TEXT)
      return
    }
    let i = 0
    setTyped("")
    typeTimerRef.current = setInterval(() => {
      i++
      setTyped(TYPE_TEXT.slice(0, i))
      if (i >= TYPE_TEXT.length) clearInterval(typeTimerRef.current)
    }, 70)
  }

  function goStep(i: number) {
    currentRef.current = i
    elapsedRef.current = 0
    startTRef.current = performance.now()
    setCurrent(i)
    setFilled(false)
    clearTimeout(fillTimerRef.current)

    STEPS.forEach((_, k) => {
      applyProgress(k, k < i ? 1 : 0)
    })

    if (i === 0) typeInto()
    if (i === 2) {
      fillTimerRef.current = setTimeout(() => setFilled(true), reduceRef.current ? 0 : 1700)
    }
  }

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    goStep(0)

    function tick(now: number) {
      if (playingRef.current && !pausedRef.current) {
        elapsedRef.current += now - startTRef.current
        const p = Math.min(elapsedRef.current / DURATION, 1)
        applyProgress(currentRef.current, p)
        if (p >= 1) goStep((currentRef.current + 1) % STEPS.length)
      }
      startTRef.current = now
      rafRef.current = requestAnimationFrame(tick)
    }

    let observer: IntersectionObserver | undefined
    if (!reduceRef.current && "IntersectionObserver" in window && sectionRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          playingRef.current = entry.isIntersecting
        },
        { threshold: 0.35 },
      )
      observer.observe(sectionRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    return () => {
      observer?.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      clearTimeout(fillTimerRef.current)
      clearInterval(typeTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePause() {
    pausedRef.current = true
  }
  function handleResume() {
    pausedRef.current = false
  }

  return (
    <section className={`${styles.sec} ${styles.how}`} id="how" ref={sectionRef} onMouseEnter={handlePause} onMouseLeave={handleResume} onFocus={handlePause} onBlur={handleResume}>
      <div className={`bq-container ${styles.howGrid}`}>
        <div className={styles.head}>
          <h2>Four steps to your first sale.</h2>
          <p>No website to build, no developer to wait on. If you can post on Instagram, you can run a Blaqora store.</p>
        </div>

        <ol className={`${styles.stepsGrid} ${styles.steps}`}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={`${styles.step} ${i === current ? styles.isActive : ""} ${i < current ? styles.isDone : ""}`}>
              <button type="button" className={styles.stepBtn} aria-controls={`screen-${i}`} aria-expanded={i === current} onClick={() => goStep(i)}>
                <span className={styles.stepNum}>{i + 1}</span>
                <span className={styles.stepTxt}>
                  <b>{step.title}</b>
                  <small>{step.desc}</small>
                </span>
              </button>
              <span className={styles.stepProgress}>
                <i
                  ref={(el) => {
                    progressRefs.current[i] = el
                  }}
                />
              </span>
            </li>
          ))}
        </ol>

        <div className={styles.howDevice} aria-hidden="true">
          <div className={styles.app}>
            <div className={styles.appBar}>
              <i />
              <i />
              <i />
              <span>app.blaqora.store</span>
            </div>
            <div className={styles.appBody}>
              <div className={`${styles.screen} ${current === 0 ? styles.isActive : ""}`} id="screen-0">
                <div className={styles.sAuth}>
                  <img src="/blaqora-icon.png" alt="" width={44} height={44} />
                  <p className={styles.sTitle}>Create your account</p>
                  <p className={styles.sSub}>Start selling in minutes</p>
                  <span className={styles.sField}>
                    <small>Full name</small>
                    <b className={styles.typeCursor}>{typed}</b>
                  </span>
                  <span className={styles.sField}>
                    <small>Email</small>
                    <b>adaeze@email.com</b>
                  </span>
                  <span className={styles.sBtn}>Create account</span>
                </div>
              </div>

              <div className={`${styles.screen} ${current === 1 ? styles.isActive : ""}`} id="screen-1">
                <div className={styles.sAuth}>
                  <p className={styles.sTitle}>Claim your store link</p>
                  <p className={styles.sSub}>You can change this later</p>
                  <span className={`${styles.sField} ${styles.sFieldLink}`}>
                    <small>Store link</small>
                    <b>
                      blaqora.store/<em>{displayName}</em>
                    </b>
                  </span>
                  <div className={styles.sOk}>
                    <CheckCircle2 aria-hidden="true" />
                    Link is available
                  </div>
                  <span className={styles.sBtn}>Continue</span>
                </div>
              </div>

              <div className={`${styles.screen} ${current === 2 ? styles.isActive : ""} ${filled ? styles.isFilled : ""}`} id="screen-2">
                <div className={styles.sDash}>
                  <div className={styles.sDashTop}>
                    <b>Your items</b>
                    <span className={styles.sMiniBtn}>+ Add item</span>
                  </div>
                  <div className={styles.sEmpty}>
                    <span className={styles.sEmptyArt}>
                      <i />
                      <i />
                      <i />
                    </span>
                    <b>Your store is empty</b>
                    <small>Add your first ticket, booking, product or file to open for sales.</small>
                    <span className={`${styles.sBtn} ${styles.sBtnSm}`}>Add your first item</span>
                  </div>
                  <div className={styles.sAdded}>
                    <span className={styles.sAddedThumb}>
                      <span className={`${styles.tote} ${styles.toteMini}`}>
                        <span className={styles.toteHandle} />
                        <span className={styles.toteBody} />
                      </span>
                    </span>
                    <span>
                      <b>Ankara tote bag</b>
                      <small>₦18,500, 12 in stock</small>
                    </span>
                    <span className={styles.sLive}>Live</span>
                  </div>
                </div>
              </div>

              <div className={`${styles.screen} ${current === 3 ? styles.isActive : ""}`} id="screen-3">
                <div className={styles.sShare}>
                  <p className={styles.sTitle}>Your store is live</p>
                  <div className={styles.sLinkcopy}>
                    <span>blaqora.store/{displayName}</span>
                    <em>Copy</em>
                  </div>
                  <div className={styles.sSocials}>
                    <span className={styles.soc}>WhatsApp</span>
                    <span className={styles.soc}>Instagram</span>
                    <span className={styles.soc}>TikTok</span>
                    <span className={styles.soc}>X</span>
                  </div>
                  <div className={styles.sSale}>
                    <span className={styles.sSaleBurst}>
                      <i /><i /><i /><i /><i /><i />
                    </span>
                    <small>First sale</small>
                    <b>₦18,500</b>
                    <span>Ankara tote bag</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
