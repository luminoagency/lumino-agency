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

const EVE = [
  ['Preventivo · Bagno Rossi', 'da scrivere e mandare', 'Preventivo inviato'],
  ['Sollecito · Sig. Bianchi', '180 € in ritardo da 3 settimane', 'Promemoria inviato'],
  ['Richiamare la Sig.ra Conti', 'vuole un prezzo per la caldaia', 'Risposto con la fascia di prezzo'],
  ['Fattura n. 112', 'da fare e inviare', 'Fattura inviata'],
  ['Agenda di domani', '3 lavori da mettere in ordine', 'Agenda pronta alle 7:30'],
  ['Note cantiere Ferri', 'foto e misure da sistemare', 'Note salvate nel lavoro'],
] as const

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

  /* ── hero: la I del logo si apre nel mondo Lumino ── */
  const heroRef = useRef<HTMLElement>(null)
  const slotRef = useRef<HTMLSpanElement>(null)
  const winRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const hero = heroRef.current, slot = slotRef.current, win = winRef.current
    if (!hero || !slot || !win) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const q = (c: string) => hero.querySelector(c) as HTMLElement
    const la = q('.lh__l--a'), lb = q('.lh__l--b'), intro = q('.lh__intro'), after = q('.lh__after'), phone = q('.lh__phone'), cue = q('.lh__cue')
    const ns = Array.from(hero.querySelectorAll<HTMLElement>('.lh__n'))
    const chips = Array.from(hero.querySelectorAll<HTMLElement>('.lh__chip'))
    const cl = (x: number) => Math.min(Math.max(x, 0), 1)
    const ease = (x: number) => 1 - Math.pow(1 - x, 3)
    let raf = 0, last = -1
    const frame = () => {
      raf = 0
      const r = hero.getBoundingClientRect()
      const total = Math.max(1, hero.offsetHeight - window.innerHeight)
      const p = cl(-r.top / total)
      if (Math.abs(p - last) < 0.0005) return
      last = p
      const o = reduce ? (p > 0.3 ? 1 : 0) : ease(cl((p - 0.03) / 0.55))
      const sr = hero.firstElementChild!.getBoundingClientRect(), br = slot.getBoundingClientRect()
      const x0 = br.left - sr.left, y0 = br.top - sr.top
      const t = y0 * (1 - o), l = x0 * (1 - o)
      const rr = (sr.width - x0 - br.width) * (1 - o), bb = (sr.height - y0 - br.height) * (1 - o)
      win.style.clipPath = `inset(${t}px ${rr}px ${bb}px ${l}px round ${(br.width / 2) * (1 - o) + 0}px)`
      const lo = cl(1 - o * 3)
      la.style.transform = `translate3d(${-o * 18}vw,0,0)`; la.style.opacity = String(lo)
      lb.style.transform = `translate3d(${o * 18}vw,0,0)`; lb.style.opacity = String(lo)
      intro.style.opacity = String(cl(1 - o * 5)); intro.style.transform = `translate3d(-50%,${o * 40}px,0)`
      cue.style.opacity = String(cl(1 - o * 6))
      ns.forEach((n) => { n.style.opacity = String(cl(1 - o * 4)); n.style.translate = `0 ${-o * 120}px` })
      const a1 = cl((o - 0.62) / 0.3), a2 = cl((o - 0.72) / 0.28)
      after.style.opacity = String(a1); after.style.transform = `translate3d(0,${(1 - ease(a1)) * 50}px,0)`
      phone.style.opacity = String(a2); phone.style.transform = `translate3d(0,${(1 - ease(a2)) * 120}px,0)`
      chips.forEach((c, i) => { const k = cl((o - 0.8 - i * 0.06) / 0.2); c.style.opacity = String(k); c.style.transform = `translate3d(0,${(1 - ease(k)) * 30}px,0)` })
    }
    const req = () => { if (!raf) raf = requestAnimationFrame(frame) }
    const rs = () => { last = -1; req() }
    frame()
    window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', rs)
    return () => { window.removeEventListener('scroll', req); window.removeEventListener('resize', rs); if (raf) cancelAnimationFrame(raf) }
  }, [])

  /* ── la sera: i lavori si accumulano, poi Lumino li sbriga ── */
  const eveRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const sec = eveRef.current; if (!sec) return
    const q = (c: string) => sec.querySelector(c) as HTMLElement
    const pin = q('.le__pin'), clock = q('.le__clock'), h1 = q('.le__h--a'), h2 = q('.le__h--b'), h3 = q('.le__h--c'), sw = q('.le__sw'), end = q('.le__end')
    const cards = Array.from(sec.querySelectorAll<HTMLElement>('.le__c'))
    const cl = (x: number) => Math.min(Math.max(x, 0), 1)
    const ease = (x: number) => 1 - Math.pow(1 - x, 3)
    const R = [-6, 4, -3, 6, -4, 2], X = [-8, 7, -3, 9, -6, 3], Y = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]
    const hm = (m: number) => { const h = 19 + Math.floor(m / 60), mm = Math.floor(m % 60); return `${h}:${String(mm).padStart(2, '0')}` }
    let raf = 0, last = -1
    const frame = () => {
      raf = 0
      const r = sec.getBoundingClientRect()
      const total = Math.max(1, sec.offsetHeight - window.innerHeight)
      const p = cl(-r.top / total)
      if (Math.abs(p - last) < 0.0005) return
      last = p
      const night = cl(p / 0.16) * (1 - cl((p - 0.88) / 0.06))
      pin.style.setProperty('--n', night.toFixed(3))
      const on = p > 0.52
      sw.classList.toggle('on', on)
      let m = 270 * cl(p / 0.42)
      if (p > 0.52) m = 5 + 265 * (1 - cl((p - 0.52) / 0.36))
      clock.textContent = hm(m)
      h1.style.opacity = String(p < 0.52 ? 1 : 0); h2.style.opacity = String(p >= 0.52 && p < 0.9 ? 1 : 0)
      h3.style.opacity = String(cl((p - 0.9) / 0.06)); h3.style.transform = `translate3d(0,${(1 - cl((p - 0.9) / 0.06)) * 30}px,0)`
      end.style.opacity = String(cl((p - 0.92) / 0.06))
      cards.forEach((c, i) => {
        const a = ease(cl((p - 0.04 - i * 0.06) / 0.06))
        const d = cl((p - 0.53 - i * 0.05) / 0.03), f = ease(cl((p - 0.6 - i * 0.05) / 0.06))
        c.classList.toggle('done', d > 0.5)
        c.style.opacity = String(a * (1 - f))
        c.style.transform = `translate3d(${X[i]}%,calc(${Y[i] * 100}% + ${(1 - a) * -60 - f * 120}vh),0) rotate(${R[i] * (1 - f) + f * R[i] * 3}deg) scale(${0.9 + 0.1 * a})`
      })
    }
    const req = () => { if (!raf) raf = requestAnimationFrame(frame) }
    frame()
    window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req)
    return () => { window.removeEventListener('scroll', req); window.removeEventListener('resize', req); if (raf) cancelAnimationFrame(raf) }
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
            <div className="lh__n lh__n--1"><i>✓</i><div><b>Preventivo inviato · 22:41</b><span>Bagno Rossi · 240,00 €</span></div></div>
            <div className="lh__n lh__n--2"><i className="g">€</i><div><b>Bonifico ricevuto</b><span>Sig. Bianchi · +180,00 €</span></div></div>
            <div className="lh__intro">
              <h1 className="lh__h1">Tu mandi un vocale. <em>Lumino fa il resto.</em></h1>
              <p>La segretaria AI degli artigiani, dentro WhatsApp: preventivi col tuo logo, promemoria a chi non paga, agenda pronta al mattino.</p>
              <div className="la-ctas lh__ctas">
                <a className="la-btn la-btn--red" href="#lista">Provalo gratis</a>
                <a className="la-btn la-btn--line" href="#come">Guarda come funziona</a>
              </div>
            </div>
            <div className="lh__cue" aria-hidden="true"><span /></div>
            <div className="lh__win" ref={winRef}>
              <div className="lh__glow" />
              <div className="lh__after">
                <p className="lh__k">Lumino · per artigiani</p>
                <h2 className="lh__h2">Finisci il lavoro.<br /><em>Il resto parte da solo.</em></h2>
                <p className="lh__sub">Mandi un vocale su WhatsApp: preventivo, promemoria e agenda li fa Lumino.</p>
                <a className="la-btn la-btn--red lh__after-cta" href="#lista">Entra nella lista d&apos;attesa</a>
              </div>
              <div className="lh__phone"><Phone tilt={false} /></div>
              <div className="lh__chip lh__chip--1"><i>✓</i>Preventivo inviato · 240 €</div>
              <div className="lh__chip lh__chip--2"><i className="g">€</i>Bonifico ricevuto · +180 €</div>
            </div>
          </div>
        </section>

        {/* ── LA SERA ── */}
        <section className="le" ref={eveRef} aria-label="La tua sera, prima e con Lumino">
          <div className="le__pin">
            <div className="la-wrap le__grid">
              <div className="le__copy">
                <p className="la-kick le__kick">La tua sera</p>
                <div className="le__hs">
                  <h2 className="la-h2 le__h le__h--a">Stasera, alle <span className="le__clock">19:00</span>, ti aspetta questo.</h2>
                  <h2 className="la-h2 le__h le__h--b">Con Lumino lo fa lui. Tu chiudi il telefono.</h2>
                  <h2 className="la-h2 le__h le__h--c">Le tue sere <em>ti tornano indietro.</em></h2>
                </div>
                <div className="le__sw" aria-hidden="true"><span>Senza Lumino</span><i><b /></i><span>Con Lumino</span></div>
                <p className="le__end">Due ore a sera, ogni sera. Con un vocale da dieci secondi.</p>
              </div>
              <div className="le__pile" aria-hidden="true">
                {EVE.map(([t, s2, d], i) => (
                  <div className="le__c" key={i}><b>{t}</b><span>{s2}</span><em>✓ {d}</em></div>
                ))}
              </div>
            </div>
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
              <p className="la-list__alt">Preferisci scriverci? <a href="https://wa.me/393201453320">WhatsApp +39 320 145 3320</a></p>
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
              {sent === 'err' && <p className="la-paper__err">Qualcosa non è andato. Scrivici su WhatsApp al +39 320 145 3320.</p>}
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
