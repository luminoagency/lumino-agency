'use client'

import { useEffect, useRef, useState } from 'react'

/* Telefono realistico (cornice in titanio, isola, vetro) con una chat
   WhatsApp viva. `step` comanda la scena dall'esterno (sezione "come
   funziona"); senza `step` la scena gira da sola in loop (hero). */

type Props = { step?: number; className?: string; tilt?: boolean }

const WAVE = Array.from({ length: 34 }, (_, i) => 5 + Math.round(Math.abs(Math.sin(i * 1.27) * Math.cos(i * 0.41)) * 18))

export default function Phone({ step, className = '', tilt = true }: Props) {
  const [auto, setAuto] = useState(0)
  const [play, setPlay] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const s = step ?? auto

  /* loop automatico: 0 vocale · 1 scrive · 2 preventivo · 3 promemoria · 4 pagato · 5 agenda */
  useEffect(() => {
    if (step !== undefined) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setAuto(5); return }
    const seq = [2400, 1300, 2600, 2200, 2600, 3200]
    let i = 0
    let t: ReturnType<typeof setTimeout>
    const next = () => { i = (i + 1) % seq.length; setAuto(i); t = setTimeout(next, seq[i]) }
    t = setTimeout(next, seq[0])
    return () => clearTimeout(t)
  }, [step])

  /* la barra del vocale avanza mentre "suona" */
  useEffect(() => {
    if (s !== 0) { setPlay(WAVE.length); return }
    setPlay(0)
    const iv = setInterval(() => setPlay((p) => (p >= WAVE.length ? p : p + 1)), 60)
    return () => clearInterval(iv)
  }, [s])

  /* leggera inclinazione che segue il puntatore */
  useEffect(() => {
    if (!tilt) return
    const el = ref.current
    if (!el || window.matchMedia('(pointer: coarse)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5
        const y = e.clientY / window.innerHeight - 0.5
        el.style.setProperty('--rx', `${6 - y * 6}deg`)
        el.style.setProperty('--ry', `${-16 + x * 10}deg`)
        el.style.setProperty('--gx', `${50 + x * 40}%`)
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [tilt])

  const show = (n: number) => (s >= n ? ' on' : '')

  return (
    <div ref={ref} className={`la-phone ${className}`} aria-hidden="true">
      <div className="la-phone__body">
        <span className="la-phone__btn la-phone__btn--a" />
        <span className="la-phone__btn la-phone__btn--b" />
        <span className="la-phone__btn la-phone__btn--c" />
        <div className="la-phone__screen">
          <div className="la-status"><b>22:41</b><span className="la-status__r"><i className="la-sig" /><i className="la-wifi" /><i className="la-bat" /></span></div>
          <div className="la-island" />

          {/* notifiche iOS che scendono dall'alto */}
          <div className={`la-banner${s === 4 ? ' on' : ''}`}>
            <span className="la-banner__ic la-banner__ic--wa" />
            <div><p className="la-banner__t">Sig. Bianchi <small>ora</small></p><p>Bonifico fatto, grazie! 180,00 €</p></div>
          </div>
          <div className={`la-banner${s === 5 ? ' on' : ''}`}>
            <span className="la-banner__ic la-banner__ic--l">L</span>
            <div><p className="la-banner__t">Lumino <small>07:30</small></p><p>Domani 3 lavori · il primo alle 08:30, Via Roma</p></div>
          </div>

          <div className="la-wa">
            <div className="la-wa__top">
              <span className="la-wa__back">‹</span>
              <span className="la-wa__av">L</span>
              <div className="la-wa__who"><b>Lumino</b><small>{s === 1 ? 'sta scrivendo…' : 'online'}</small></div>
            </div>
            <div className="la-wa__chat">
              <div className="la-wa__day">Oggi</div>

              <div className="la-msg la-msg--out on">
                <div className="la-voice">
                  <span className="la-voice__play" />
                  <span className="la-voice__wave">
                    {WAVE.map((h, i) => <i key={i} style={{ height: h }} className={i < play ? 'p' : ''} />)}
                  </span>
                </div>
                <span className="la-meta">0:07 · 22:41 <em className="la-ticks">✓✓</em></span>
              </div>

              <div className={`la-msg la-msg--in la-typing${s === 1 ? ' on' : ''}`}><i /><i /><i /></div>

              <div className={`la-msg la-msg--in${show(2)}`}>
                <p>Fatto. Ecco il preventivo per la Sig.ra Rossi 👇</p>
                <div className="la-file">
                  <span className="la-file__ic">PDF</span>
                  <span><b>Preventivo_Rossi.pdf</b><small>1 pagina · col tuo logo</small></span>
                </div>
                <div className="la-sum"><span>Totale</span><b>240,00 €</b></div>
                <span className="la-meta">22:41</span>
              </div>

              <div className={`la-msg la-msg--in${show(3)}`}>
                <p>Inviato alla cliente ✓ Ho ricordato a <b>Bianchi</b> il saldo di 180 €.</p>
                <span className="la-meta">22:42</span>
              </div>

              <div className={`la-msg la-msg--in${show(5)}`}>
                <p><b>Domani</b></p>
                <p className="la-ag"><em>08:30</em> Via Roma · caldaia</p>
                <p className="la-ag"><em>11:00</em> Condominio · perdita</p>
                <p className="la-ag"><em>15:00</em> Sig.ra Rossi · miscelatore</p>
                <span className="la-meta">07:30</span>
              </div>
            </div>
            <div className="la-wa__bar"><span className="la-wa__input">Messaggio</span><span className="la-wa__mic" /></div>
          </div>
          <div className="la-glare" />
        </div>
      </div>
      <div className="la-phone__shadow" />
    </div>
  )
}
