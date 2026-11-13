'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Phone from './Phone'

const WORKS = [
  ['ambasciata', "L'Ambasciata", 'Ristorante · Quistello'],
  ['zayyane', 'Zayyane', 'Ristorante · Rabat'],
  ['hotel-aurora', 'Hotel Aurora', 'Hotel · Jesolo'],
  ['miss-poppy', 'Miss Poppy', 'Fast food · Padova'],
  ['rossi-restaurant', 'Rossi', 'Ristorante · Jesolo'],
  ['bienvenu', 'Bien Venu', 'Ristorante · Marrakech'],
  ['guizza', 'Guizza', 'Pizzeria · Padova'],
  ['hosteria-moderna', 'Hosteria Moderna', 'Osteria · Padova'],
  ['incanto', 'Incanto', 'Gelateria · Padova'],
  ['trattoria-dalloste', "Dall'Oste", 'Steakhouse · Jesolo'],
] as const

const STEPS = [
  { k: 'Il vocale', t: 'Finisci il lavoro e mandi un vocale.', p: '«Bagno Rossi, cambiato miscelatore e sifone, due ore.» Parli come parli al socio.' },
  { k: 'Il preventivo', t: 'Il preventivo parte da solo.', p: 'Voci, prezzi e totale in un PDF col tuo logo, già inviato al cliente su WhatsApp.' },
  { k: 'I pagamenti', t: 'Chi non paga, se lo sente ricordare.', p: 'Un promemoria gentile al momento giusto. Tu non scrivi più «scusi, il saldo…».' },
  { k: "L'agenda", t: "Domattina l'agenda è pronta.", p: 'Indirizzi, orari e lavori in ordine, prima del caffè.' },
]
const STEP_TO_PHONE = [0, 2, 4, 5]

const fmt = (n: number) => n.toLocaleString('it-IT')

export default function Artigiani() {
  /* ── menu ── */
  const [menu, setMenu] = useState(false)
  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : '' }, [menu])

  /* ── reveal on load + in view ── */
  useEffect(() => {
    document.documentElement.classList.add('la-ready')
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.18 })
    document.querySelectorAll('.la-rv').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  /* ── hero: la finestra si apre con lo scroll ── */
  const heroRef = useRef<HTMLElement>(null)
  const slotRef = useRef<HTMLSpanElement>(null)
  const winRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const hero = heroRef.current, slot = slotRef.current, win = winRef.current
    if (!hero || !slot || !win) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let mx = 0, my = 0, raf = 0
    const ease = (x: number) => 1 - Math.pow(1 - x, 3)
    const frame = () => {
      raf = 0
      const r = hero.getBoundingClientRect()
      const total = Math.max(1, hero.offsetHeight - window.innerHeight)
      const p = Math.min(Math.max(-r.top / total, 0), 1)
      const stage = hero.firstElementChild as HTMLElement
      const sr = stage.getBoundingClientRect(), br = slot.getBoundingClientRect()
      const o = reduce ? (p > 0.5 ? 1 : 0) : ease(Math.min(Math.max((p - 0.08) / 0.55, 0), 1))
      const x0 = br.left - sr.left, y0 = br.top - sr.top, w0 = br.width, h0 = br.height
      const inset = 0
      const L = x0 + (inset - x0) * o, T = y0 + (inset - y0) * o
      const W = w0 + (sr.width - w0) * o, H = h0 + (sr.height - h0) * o
      const rad = Math.min(w0 / 2, 999) * (1 - o) + 0 * o
      win.style.cssText = `left:${L}px;top:${T}px;width:${W}px;height:${H}px;border-radius:${rad}px`
      hero.style.setProperty('--o', String(o))
      hero.style.setProperty('--p', String(p))
      hero.style.setProperty('--mx', String(mx)); hero.style.setProperty('--my', String(my))
    }
    const req = () => { if (!raf) raf = requestAnimationFrame(frame) }
    const mm = (e: PointerEvent) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; req() }
    frame()
    window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req); window.addEventListener('pointermove', mm)
    return () => { window.removeEventListener('scroll', req); window.removeEventListener('resize', req); window.removeEventListener('pointermove', mm); if (raf) cancelAnimationFrame(raf) }
  }, [])

  /* ── come funziona: scena legata allo scroll ── */
  const howRef = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)
  useEffect(() => {
    const on = () => {
      const el = howRef.current; if (!el) return
      const r = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
      const p = Math.min(Math.max(-r.top / total, 0), 0.999)
      setStep(Math.floor(p * STEPS.length))
    }
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  /* ── prima / dopo ── */
  const [cut, setCut] = useState(50)
  const baRef = useRef<HTMLDivElement>(null)
  const drag = useRef(false)
  const moveCut = (x: number) => { const r = baRef.current!.getBoundingClientRect(); setCut(Math.min(96, Math.max(4, ((x - r.left) / r.width) * 100))) }

  /* ── il conto ── */
  const [h, setH] = useState(2), [nights, setNights] = useState(5), [rate, setRate] = useState(40)
  const hrs = h * nights * 48, tot = hrs * rate
  const [shown, setShown] = useState(tot)
  useEffect(() => {
    const from = shown, t1 = performance.now(); let raf = 0
    const roll = (now: number) => { const p = Math.min((now - t1) / 600, 1), e = 1 - Math.pow(1 - p, 3); setShown(Math.round(from + (tot - from) * e)); if (p < 1) raf = requestAnimationFrame(roll) }
    raf = requestAnimationFrame(roll); return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tot])

  /* ── siti: diapositive ── */
  const [shot, setShot] = useState(0)
  useEffect(() => { const iv = setInterval(() => setShot((v) => (v + 1) % 3), 2800); return () => clearInterval(iv) }, [])

  /* ── binario lavori: trascinamento col mouse ── */
  const railRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const rail = railRef.current; if (!rail) return
    let down = false, sx = 0, sl = 0
    const d = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('drag') }
    const m = (e: PointerEvent) => { if (down) rail.scrollLeft = sl - (e.clientX - sx) }
    const u = () => { down = false; rail.classList.remove('drag') }
    rail.addEventListener('pointerdown', d); window.addEventListener('pointermove', m); window.addEventListener('pointerup', u)
    return () => { rail.removeEventListener('pointerdown', d); window.removeEventListener('pointermove', m); window.removeEventListener('pointerup', u) }
  }, [])

  /* ── modulo ── */
  const [sent, setSent] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [errs, setErrs] = useState<Record<string, boolean>>({})
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries()) as Record<string, string>
    const bad: Record<string, boolean> = {}
    for (const k of ['nome', 'mestiere', 'citta', 'whatsapp']) if (!String(data[k] || '').trim()) bad[k] = true
    setErrs(bad); if (Object.keys(bad).length) return
    setSent('sending')
    try {
      const r = await fetch('/api/lista-attesa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      setSent(r.ok ? 'ok' : 'err')
    } catch { setSent('err') }
  }

  return (
    <div className="la">
      <a className="la-skip" href="#come">Vai ai contenuti</a>

      <header className="la-nav">
        <a className="la-wm" href="#top" aria-label="Lumino, torna su">LUM<span>I</span>NO</a>
        <nav className="la-nav__links" aria-label="Sezioni">
          <a href="#come">Come funziona</a><a href="#conto">Il conto</a><a href="#servizi">Cosa facciamo</a><a href="#lavori">Lavori</a>
        </nav>
        <a className="la-btn la-btn--red la-nav__cta" href="#lista">Provalo gratis</a>
        <button className="la-burger" aria-label={menu ? 'Chiudi il menu' : 'Apri il menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}><span /><span /></button>
      </header>
      {menu && (
        <div className="la-menu" onClick={() => setMenu(false)}>
          <a href="#come">Come funziona</a><a href="#conto">Il conto</a><a href="#servizi">Cosa facciamo</a><a href="#lavori">Lavori</a><a href="#lista">Prova gratis</a>
        </div>
      )}

      <main>
        {/* ── HERO: la I del logo diventa una finestra ── */}
        <section className="lh" id="top" ref={heroRef}>
          <div className="lh__stage">
            <div className="lh__word" aria-hidden="true">
              <span className="lh__l lh__l--a">LUM</span>
              <span className="lh__slot" ref={slotRef} />
              <span className="lh__l lh__l--b">NO</span>
            </div>
            <div className="lh__win" ref={winRef}>
              <img src="/artigiani/idraulico.webp" alt="Idraulico che registra un vocale su WhatsApp dopo un lavoro in bagno" />
              <div className="lh__tint" />
              <div className="lh__shade" />
            </div>
            <div className="lh__n lh__n--1" data-d="1.2"><i>✓</i><div><b>Preventivo inviato · 22:41</b><span>Bagno Rossi · 240,00 €</span></div></div>
            <div className="lh__n lh__n--2" data-d="-0.9"><i className="g">€</i><div><b>Bonifico ricevuto</b><span>Sig. Bianchi · +180,00 €</span></div></div>
            <div className="lh__n lh__n--3" data-d="0.7"><i>●</i><div><b>Vocale · 0:07</b><span>«Bagno Rossi, miscelatore…»</span></div></div>
            <div className="lh__intro">
              <h1 className="lh__h1">Tu mandi un vocale. <em>Lumino fa il resto.</em></h1>
              <p>La segretaria AI degli artigiani, dentro WhatsApp: preventivi col tuo logo, promemoria a chi non paga, agenda pronta al mattino.</p>
              <div className="la-ctas lh__ctas">
                <a className="la-btn la-btn--red" href="#lista">Provalo gratis</a>
                <a className="la-btn la-btn--line" href="#come">Guarda come funziona</a>
              </div>
            </div>
            <div className="lh__after">
              <h2 className="lh__h2">Finisci il lavoro.<br /><em>Il resto parte da solo.</em></h2>
              <a className="la-btn la-btn--red lh__after-cta" href="#lista">Entra nella lista d&apos;attesa</a>
            </div>
            <div className="lh__phone"><Phone /></div>
            <div className="lh__cue" aria-hidden="true"><span /></div>
          </div>
        </section>

        {/* ── PRIMA / DOPO ── */}
        <section className="la-ba la-wrap">
          <div className="la-ba__head la-rv">
            <h2 className="la-h2">Le tue sere <em>ti tornano indietro.</em></h2>
            <p>Trascina la linea: a sinistra le 23:00 di adesso, a destra le 7:30 con Lumino.</p>
          </div>
          <div
            ref={baRef}
            className="la-ba__frame la-rv"
            onPointerDown={(e) => { drag.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); moveCut(e.clientX) }}
            onPointerMove={(e) => drag.current && moveCut(e.clientX)}
            onPointerUp={() => { drag.current = false }}
            onKeyDown={(e) => { if (e.key === 'ArrowLeft') setCut((c) => Math.max(4, c - 5)); if (e.key === 'ArrowRight') setCut((c) => Math.min(96, c + 5)) }}
            role="slider" aria-label="Confronta prima e dopo" aria-valuenow={Math.round(cut)} aria-valuemin={0} aria-valuemax={100} tabIndex={0}
          >
            <img className="la-ba__img" src="/artigiani/mattino.webp" alt="Il mattino dopo, con il caffè e l'agenda già pronta sul telefono" />
            <div className="la-ba__clip" style={{ clipPath: `inset(0 ${100 - cut}% 0 0)` }}>
              <img className="la-ba__img" src="/artigiani/sera.webp" alt="La sera alle 23 con fogli, calcolatrice e preventivi da scrivere" />
            </div>
            <span className="la-ba__tag la-ba__tag--l">23:00 · prima</span>
            <span className="la-ba__tag la-ba__tag--r">07:30 · con Lumino</span>
            <div className="la-ba__line" style={{ left: `${cut}%` }}><span>↔</span></div>
          </div>
        </section>

        {/* ── COME FUNZIONA ── */}
        <section className="la-how" id="come" ref={howRef}>
          <div className="la-how__pin">
            <img className="la-how__bg" src="/artigiani/furgone.webp" alt="" />
            <div className="la-how__shade" />
            <div className="la-wrap la-how__grid">
              <div className="la-how__copy">
                <p className="la-kick">Come funziona</p>
                <ol className="la-how__steps">
                  {STEPS.map((st, i) => (
                    <li key={i} className={i === step ? 'on' : ''}>
                      <span className="la-how__k">{String(i + 1).padStart(2, '0')} · {st.k}</span>
                      <h2>{st.t}</h2>
                      <p>{st.p}</p>
                    </li>
                  ))}
                </ol>
                <div className="la-how__bar"><i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
              </div>
              <Phone step={STEP_TO_PHONE[step]} className="la-how__phone" />
            </div>
          </div>
        </section>

        {/* ── IL CONTO ── */}
        <section className="la-bill la-wrap" id="conto">
          <div className="la-bill__l la-rv">
            <p className="la-kick">Il conto che nessuno ti manda</p>
            <h2 className="la-h2">Quanto ti costa <em>la sera?</em></h2>
            <label className="la-sl"><span>Ore al telefono, ogni sera <b>{String(h).replace('.', ',')} h</b></span>
              <input type="range" min={0.5} max={4} step={0.5} value={h} onChange={(e) => setH(+e.target.value)} style={{ ['--v' as string]: `${((h - 0.5) / 3.5) * 100}%` }} /></label>
            <label className="la-sl"><span>Sere a settimana <b>{nights}</b></span>
              <input type="range" min={1} max={7} step={1} value={nights} onChange={(e) => setNights(+e.target.value)} style={{ ['--v' as string]: `${((nights - 1) / 6) * 100}%` }} /></label>
            <label className="la-sl"><span>Quanto vale un&apos;ora del tuo lavoro <b>{rate} €</b></span>
              <input type="range" min={20} max={80} step={5} value={rate} onChange={(e) => setRate(+e.target.value)} style={{ ['--v' as string]: `${((rate - 20) / 60) * 100}%` }} /></label>
          </div>
          <div className="la-receipt la-rv">
            <div className="la-receipt__in">
              <p className="la-receipt__h"><b>SCONTRINO</b><span>Lavoro serale · 1 anno</span></p>
              <p className="la-row"><span>{String(h).replace('.', ',')} h × {nights} sere × 48 settimane</span><b>{fmt(hrs)} h</b></p>
              <p className="la-row"><span>Tariffa oraria</span><b>{rate} €/h</b></p>
              <p className="la-row"><span>Pagato da qualcuno</span><b>0 €</b></p>
              <p className="la-receipt__k">Totale regalato</p>
              <p className="la-receipt__tot">{fmt(shown)} €</p>
              <p className="la-row la-row--soft"><span>Giornate di lavoro da 8 ore</span><b>{fmt(Math.round(hrs / 8))}</b></p>
              <a className="la-btn la-btn--ink la-btn--full" href="#lista">Riprenditi le sere</a>
            </div>
          </div>
        </section>

        {/* ── COSA FACCIAMO ── */}
        <section className="la-svc la-wrap" id="servizi">
          <div className="la-svc__head la-rv">
            <p className="la-kick">Oltre la segretaria</p>
            <h2 className="la-h2">Strumenti semplici <em>per aziende vere.</em></h2>
          </div>
          <div className="la-bento">
            <article className="la-card la-card--ai la-rv">
              <img src="/artigiani/furgone.webp" alt="Elettricista che controlla il telefono seduto sul furgone" />
              <div className="la-card__txt"><p className="la-card__k">Agent AI</p><h3>Rispondono ai clienti, fanno preventivi, ricordano i pagamenti.</h3></div>
              <div className="la-card__bubbles"><span>Quanto costa la caldaia?</span><span className="me">Le mando il preventivo tra 2 minuti ✓</span></div>
            </article>
            <article className="la-card la-card--dash la-rv">
              <div className="la-card__txt"><p className="la-card__k">Dashboard</p><h3>La tua azienda in una schermata. Niente palmari, niente corsi.</h3></div>
              <div className="la-dash">
                <div className="la-dash__row"><span>Incassato a novembre</span><b>8.420 €</b></div>
                <div className="la-dash__bars">{[42, 58, 47, 71, 63, 88, 76].map((v, i) => <i key={i} style={{ ['--h' as string]: `${v}%`, ['--d' as string]: `${i * 70}ms` }} />)}</div>
                <div className="la-dash__row"><span>Da incassare</span><b className="red">1.260 €</b></div>
              </div>
            </article>
            <article className="la-card la-card--web la-rv">
              <div className="la-card__txt"><p className="la-card__k">Siti</p><h3>Scritti da zero, mai template. Dieci attività tra Italia e Marocco.</h3></div>
              <div className="la-browser">
                <div className="la-browser__bar"><i /><i /><i /><span>bylumino.com</span></div>
                <div className="la-browser__shots">
                  {['ambasciata', 'zayyane', 'miss-poppy'].map((w, i) => <img key={w} className={i === shot ? 'on' : ''} src={`/works/hero/${w}.webp`} alt="" />)}
                </div>
              </div>
            </article>
            <article className="la-card la-card--reel la-rv">
              <div className="la-card__txt"><p className="la-card__k">Contenuti</p><h3>Reel, editing e grafica che fanno parlare di te.</h3></div>
              <div className="la-reel"><img src="/artigiani/sera.webp" alt="" /><span className="la-reel__play">▶</span><span className="la-reel__cap">«22:40, e stai ancora facendo preventivi»</span><i className="la-reel__prog" /></div>
            </article>
          </div>
        </section>

        {/* ── LAVORI ── */}
        <section className="la-works" id="lavori">
          <div className="la-wrap la-works__head la-rv">
            <h2 className="la-h2">Siti che <em>si ricordano.</em></h2>
            <p>Trascina per scorrere →</p>
          </div>
          <div className="la-rail" ref={railRef}>
            {WORKS.map(([f, n, d]) => (
              <figure key={f} className="la-work">
                <div className="la-work__img"><img src={`/works/hero/${f}.webp`} alt={`Sito di ${n}`} loading="lazy" draggable={false} /></div>
                <figcaption><b>{n}</b><span>{d}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ── LISTA D'ATTESA ── */}
        <section className="la-list" id="lista">
          <div className="la-wrap la-list__grid">
            <div className="la-list__l la-rv">
              <p className="la-kick la-kick--light">Lista d&apos;attesa</p>
              <h2 className="la-h2 la-h2--light">Il primo preventivo <em>è il tuo.</em></h2>
              <p>I primi artigiani entrano in prova gratis. Compila il foglio: ti scriviamo su WhatsApp, nessuna chiamata.</p>
              <p className="la-list__alt">Preferisci scriverci? <a href="https://wa.me/393293382674">WhatsApp +39 329 338 2674</a></p>
            </div>
            <form className="la-paper la-rv" onSubmit={submit} noValidate>
              <div className="la-paper__h"><b>Iscrizione</b><span>Lumino · prova gratuita</span></div>
              {([
                ['nome', 'Nome e cognome', 'Marco Bellini', 'name', 'text'],
                ['mestiere', 'Mestiere', 'Idraulico', 'organization-title', 'text'],
                ['citta', 'Città', 'Padova', 'address-level2', 'text'],
                ['whatsapp', 'WhatsApp', '+39 …', 'tel', 'tel'],
              ] as const).map(([n, l, ph, ac, ty]) => (
                <label key={n} className={`la-fl${errs[n] ? ' err' : ''}`}>
                  <span>{l}</span>
                  <input name={n} type={ty} placeholder={ph} autoComplete={ac} required />
                  {errs[n] && <small>Questo campo serve</small>}
                </label>
              ))}
              <div className="la-paper__go">
                <small>Niente spam: un messaggio quando il tuo posto è pronto.</small>
                <button className="la-btn la-btn--red" type="submit" disabled={sent === 'sending' || sent === 'ok'}>
                  {sent === 'sending' ? 'Invio…' : sent === 'ok' ? 'Inviato ✓' : 'Firma e invia'}
                </button>
              </div>
              {sent === 'err' && <p className="la-paper__err">Qualcosa non è andato. Scrivici su WhatsApp al +39 329 338 2674.</p>}
              <div className={`la-stamp${sent === 'ok' ? ' on' : ''}`} aria-live="polite">{sent === 'ok' ? 'Ricevuto ✓' : ''}</div>
            </form>
          </div>
        </section>
      </main>

      <footer className="la-foot la-wrap">
        <a className="la-wm" href="#top">LUM<span>I</span>NO</a>
        <p>Studio digitale · EMYRA LTD, Londra</p>
        <nav aria-label="Note legali"><a href="/privacy-policy">Privacy</a><a href="/cookie-policy">Cookie</a><a href="/termini-condizioni">Termini</a></nav>
      </footer>
    </div>
  )
}
