'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Quote, Star, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import { PLANS, SALES_TERMS } from '@/lib/plans'

/* ───────────────────────── DATA ───────────────────────── */

const MARQUEE_IMAGES = [
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1600&q=85',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1600&q=85',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1600&q=85',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85',
  'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1600&q=85',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=85',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&q=85',
]

const TESTIMONIALS = [
  {
    name: 'Marco Bianchi',
    role: 'Proprietario, Trattoria del Sole',
    text: 'In 24 ore il mio sito era online. Senza chiamate, senza riunioni infinite. Ho ricevuto la prima prenotazione dal sito la sera stessa.',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&w=200&h=200&fit=crop',
  },
  {
    name: 'Giulia Romano',
    role: 'Chef, Sapori di Sicilia',
    text: 'L\'AI ha scritto testi che sembrano scritti da me. Ho corretto due cose dal pannello, in 10 minuti. Pazzesco.',
    avatar: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&w=200&h=200&fit=crop',
  },
  {
    name: 'Davide Esposito',
    role: 'Founder, Pizzeria Da Vide',
    text: 'Avevo un sito di 8 anni fa. Lumino me ne ha fatto uno nuovo, moderno, in un giorno. Prenotazioni triplicate nel primo mese.',
    avatar: 'https://images.pexels.com/photos/2531553/pexels-photo-2531553.jpeg?auto=compress&w=200&h=200&fit=crop',
  },
  {
    name: 'Francesca Marini',
    role: 'Co-fondatrice, Osteria Verona',
    text: 'Pagato la prima rata, due giorni dopo il sito era live. Le foto scelte dall\'AI sono migliori di quelle che avrei caricato io.',
    avatar: 'https://images.pexels.com/photos/3812743/pexels-photo-3812743.jpeg?auto=compress&w=200&h=200&fit=crop',
  },
  {
    name: 'Lorenzo Conte',
    role: 'Chef Patron, Sushi Hanami',
    text: 'Il design del template Aurora ha portato un\'estetica che non avevo mai avuto. Clientela più alta, scontrini medi più alti.',
    avatar: 'https://images.pexels.com/photos/1813947/pexels-photo-1813947.jpeg?auto=compress&w=200&h=200&fit=crop',
  },
]

const PROJECTS = [
  {
    slug: 'sushi-hanami',
    name: 'Sushi Hanami',
    desc: 'Sushi-bar di nuova generazione a Milano. Template Aurora, video AI, atmosfera onirica.',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1920&q=90',
  },
  {
    slug: 'trattoria-nonna-lucia',
    name: 'Da Nonna Lucia',
    desc: 'Tre generazioni di cucina toscana a Firenze. Template Mercato, editorial vintage.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=90',
  },
  {
    slug: 'demo-lumino',
    name: 'Burger Republic',
    desc: 'Smash burger gourmet a Milano. Template Bento, energico e moderno.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=90',
  },
]

/* ───────────────────────── HOOKS ───────────────────────── */

function useInView<T extends HTMLElement>(threshold = 0.1) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          obs.unobserve(el)
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ───────────────────────── SHARED STYLES ───────────────────────── */

const COLOR = {
  dark: '#051A24',
  dark2: '#0D212C',
  light1: '#F6FCFF',
  light2: '#E0EBF0',
  muted: '#273C46',
}

const PRIMARY_BTN_SHADOW =
  '0 1px 2px 0 rgba(5,26,36,0.1), 0 4px 4px 0 rgba(5,26,36,0.09), 0 9px 6px 0 rgba(5,26,36,0.05), 0 17px 7px 0 rgba(5,26,36,0.01), 0 26px 7px 0 rgba(5,26,36,0), inset 0 2px 8px 0 rgba(255,255,255,0.18)'
const PRIMARY_BTN_SHADOW_DARK_BG =
  '0 1px 2px 0 rgba(0,0,0,0.25), 0 4px 14px 0 rgba(0,0,0,0.18), inset 0 2px 8px 0 rgba(255,255,255,0.10)'
const SECONDARY_BTN_SHADOW =
  '0 0 0 0.5px rgba(0,0,0,0.05), 0 4px 30px rgba(0,0,0,0.08)'

/* ───────────────────────── BUTTON ───────────────────────── */

interface BtnProps {
  variant?: 'primary' | 'secondary' | 'tertiary'
  href?: string
  external?: boolean
  children: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
}

function Btn({ variant = 'primary', href, external, children, onClick, style }: BtnProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '13px 28px',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    borderRadius: 9999,
    border: 0,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s, opacity 0.2s',
    whiteSpace: 'nowrap',
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: COLOR.dark, color: '#fff', boxShadow: PRIMARY_BTN_SHADOW },
    secondary: { background: '#fff', color: COLOR.dark, boxShadow: SECONDARY_BTN_SHADOW },
    tertiary: { background: '#fff', color: COLOR.dark, boxShadow: '0 0 0 0.5px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.10)' },
  }
  const merged = { ...base, ...variants[variant], ...style }

  const inner = (
    <span style={merged} className="lm-btn-hover">
      {children}
    </span>
  )

  if (href) {
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
    ) : (
      <Link href={href}>{inner}</Link>
    )
  }
  return <button type="button" onClick={onClick} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>{inner}</button>
}

/* ───────────────────────── HERO ───────────────────────── */

function Hero() {
  return (
    <section style={{ maxWidth: 440, margin: '0 auto', padding: '48px 24px 0', textAlign: 'left' }}>
      <h1 className="lm-fade" style={{
        animationDelay: '0.1s',
        fontFamily: 'var(--font-serif)', fontWeight: 600,
        fontSize: 'clamp(32px, 5vw, 44px)',
        color: COLOR.dark, letterSpacing: '-0.02em',
        margin: '0 0 16px',
      }}>
        Lumino<span style={{ color: '#e52d1d' }}>.</span>
      </h1>

      <p className="lm-fade" style={{
        animationDelay: '0.2s',
        fontFamily: 'var(--font-mono)', fontSize: 13,
        color: COLOR.dark, margin: '0 0 18px',
        letterSpacing: '0.02em',
      }}>
        Lo studio AI per ristoranti italiani
      </p>

      <h2 className="lm-fade" style={{
        animationDelay: '0.3s',
        fontSize: 'clamp(28px, 4.5vw, 44px)',
        lineHeight: 1.1, color: COLOR.dark2,
        letterSpacing: '-0.025em', fontWeight: 400,
        margin: '0 0 22px',
      }}>
        Costruisci il sito{' '}
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 500 }}>del tuo locale</span>,
        <br />
        in <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 500 }}>24 ore</span>.
      </h2>

      <div className="lm-fade" style={{
        animationDelay: '0.4s',
        display: 'flex', flexDirection: 'column', gap: 22,
        fontSize: 14.5, lineHeight: 1.65, color: COLOR.dark,
        marginBottom: 26,
      }}>
        <p style={{ margin: 0 }}>
          Lumino è uno studio italiano costruito attorno all'AI. Generiamo siti per ristoratori che vogliono apparire bene online <em>senza</em> riunioni infinite, agenzie costose o template da Facebook.
        </p>
        <p style={{ margin: 0 }}>
          Lo studio è piccolo per scelta. L'intelligenza artificiale fa il lavoro pesante — testi, foto, menu, prenotazioni. Noi supervisioniamo ogni sito personalmente prima della consegna.
        </p>
        <p style={{ margin: 0 }}>
          I siti partono da <strong>€{PLANS[0].priceFrom}</strong>. Un solo pagamento, nessun abbonamento.
        </p>
      </div>

      <div className="lm-fade lm-hero-ctas" style={{
        animationDelay: '0.5s',
        display: 'flex', gap: 14, flexWrap: 'wrap',
      }}>
        <Btn href="/register" variant="primary">Inizia ora</Btn>
        <Btn href="#progetti" variant="secondary">Vedi esempi</Btn>
      </div>
    </section>
  )
}

/* ───────────────────────── MARQUEE ───────────────────────── */

function Marquee() {
  const all = [...MARQUEE_IMAGES, ...MARQUEE_IMAGES]
  return (
    <section style={{ marginTop: 80, marginBottom: 80, overflow: 'hidden', width: '100%' }}>
      <div className="lm-marquee" style={{ display: 'flex', width: 'max-content' }}>
        {all.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            loading="lazy"
            style={{
              height: 'clamp(260px, 38vw, 500px)',
              width: 'auto',
              objectFit: 'cover',
              margin: '0 12px',
              borderRadius: 18,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── QUOTE WITH PARALLAX ───────────────────────── */

function QuoteSection() {
  const { ref, inView } = useInView<HTMLDivElement>()
  const [offset, setOffset] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        if (!imgRef.current) return
        const r = imgRef.current.getBoundingClientRect()
        const vh = window.innerHeight
        const center = r.top + r.height / 2
        const progress = (center - vh / 2) / vh   // -1 (top) … +1 (bottom)
        const off = Math.max(-100, Math.min(100, -progress * 100))
        setOffset(off)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  return (
    <section ref={ref} style={{ padding: '48px 24px', maxWidth: 720, margin: '0 auto', textAlign: 'left' }}>
      <div className={inView ? 'lm-fade' : ''} style={{ animationDelay: '0.1s', marginBottom: 18 }}>
        <Quote width={26} height={26} color={COLOR.dark} strokeWidth={1.8} />
      </div>

      <p className={inView ? 'lm-fade' : ''} style={{
        animationDelay: '0.2s',
        fontSize: 'clamp(30px, 4.5vw, 44px)',
        lineHeight: 1.12,
        color: COLOR.dark2,
        letterSpacing: '-0.025em',
        margin: '0 0 26px',
        fontWeight: 400,
      }}>
        Costruito a <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 500 }}>Milano</span>,
        pensato per i ristoranti che <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 500 }}>contano</span>.
      </p>

      <p className={inView ? 'lm-fade' : ''} style={{
        animationDelay: '0.3s',
        fontSize: 14, fontStyle: 'italic',
        color: COLOR.muted, margin: '0 0 30px',
      }}>
        Lumino Agency
      </p>

      <div className={inView ? 'lm-fade' : ''} style={{
        animationDelay: '0.4s',
        display: 'flex', gap: 36, alignItems: 'center', flexWrap: 'wrap',
        marginBottom: 38, fontSize: 22, fontWeight: 500, color: COLOR.dark,
        fontFamily: 'var(--font-serif)',
      }}>
        <span>Claude</span>
        <span>Supabase</span>
        <span>Vercel</span>
      </div>

      <div className={inView ? 'lm-fade' : ''} style={{ animationDelay: '0.5s' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1280&q=85"
          alt="Lumino"
          style={{
            width: '100%', maxWidth: 320,
            borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            transform: `translateY(${offset}px)`,
            transition: 'transform 0.05s linear',
            display: 'block',
          }}
        />
      </div>
    </section>
  )
}

/* ───────────────────────── PRICING ───────────────────────── */

function PricingSection() {
  const { ref, inView } = useInView<HTMLDivElement>()
  const basic = PLANS[0]
  const pro = PLANS[1]
  return (
    <section ref={ref} id="prezzi" style={{ padding: '48px 24px', width: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 0 0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
        }}>
          {/* Card 1 — DARK */}
          <div className={inView ? 'lm-fade' : ''} style={{
            animationDelay: '0.1s',
            background: COLOR.dark, color: COLOR.light1,
            borderRadius: 40,
            padding: '40px 40px 40px 40px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 48px rgba(0,0,0,0.18)',
          }}>
            <h3 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 10px' }}>Sito + AI</h3>
            <p style={{ color: COLOR.light2, fontSize: 14.5, lineHeight: 1.55, margin: '0 0 28px' }}>
              Sito completo generato dall'AI.<br />
              Pronto in 24 ore, supervisionato da noi.
            </p>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 28, color: COLOR.light1, margin: '0 0 4px', lineHeight: 1,
            }}>
              da €{basic.priceFrom}
            </p>
            <p style={{ color: COLOR.light2, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 24px' }}>
              Una tantum
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Btn href="/register" variant="primary" style={{ background: '#fff', color: COLOR.dark, boxShadow: PRIMARY_BTN_SHADOW_DARK_BG }}>Inizia ora</Btn>
              <Btn href="/pricing" variant="secondary" style={{ background: 'transparent', color: COLOR.light1, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }}>Come funziona</Btn>
            </div>
          </div>

          {/* Card 2 — LIGHT */}
          <div className={inView ? 'lm-fade' : ''} style={{
            animationDelay: '0.2s',
            background: '#fff', color: COLOR.dark2,
            borderRadius: 40,
            padding: '40px 40px 40px 40px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}>
            <h3 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 10px' }}>{pro.name} & {PLANS[2].name}</h3>
            <p style={{ color: 'rgba(13,33,44,0.6)', fontSize: 14.5, lineHeight: 1.55, margin: '0 0 28px' }}>
              Prenotazioni, eventi, sezione chef, WhatsApp.<br />
              Dominio personalizzato e pannello di controllo.
            </p>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 28, color: COLOR.dark2, margin: '0 0 4px', lineHeight: 1,
            }}>
              da €{pro.priceFrom}
            </p>
            <p style={{ color: 'rgba(13,33,44,0.5)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 24px' }}>
              Minimo
            </p>
            <Btn href="/register" variant="tertiary">Inizia ora</Btn>
          </div>
        </div>
        <p style={{ marginTop: 24, color: 'rgba(5,26,36,0.55)', fontSize: 12.5, textAlign: 'right', lineHeight: 1.5 }}>
          {SALES_TERMS.publicNote}
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────── TESTIMONIAL CAROUSEL ───────────────────────── */

function CarouselSection() {
  const tripled = [...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS]
  const [index, setIndex] = useState(TESTIMONIALS.length)  // start in middle copy
  const [hover, setHover] = useState(false)
  const { ref, inView } = useInView<HTMLDivElement>()

  useEffect(() => {
    if (hover) return
    const t = setInterval(() => setIndex(i => i + 1), 3500)
    return () => clearInterval(t)
  }, [hover])

  // Reset position when index out of middle window (no animation)
  useEffect(() => {
    if (index >= TESTIMONIALS.length * 2) {
      const t = setTimeout(() => setIndex(TESTIMONIALS.length), 850)
      return () => clearTimeout(t)
    }
    if (index < 0) {
      const t = setTimeout(() => setIndex(TESTIMONIALS.length - 1), 850)
      return () => clearTimeout(t)
    }
  }, [index])

  const cardWidth = 360
  const gap = 24

  return (
    <section ref={ref} style={{ padding: '80px 0', width: '100%', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1100, margin: '0 0 0 auto', padding: '0 24px' }}>
        <div className={inView ? 'lm-fade' : ''} style={{
          animationDelay: '0.1s',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: 36, gap: 24, flexWrap: 'wrap',
        }}>
          <h3 style={{
            fontSize: 'clamp(28px, 4.5vw, 44px)',
            lineHeight: 1.1, color: COLOR.dark2,
            letterSpacing: '-0.025em', margin: 0, fontWeight: 400,
          }}>
            Cosa dicono i{' '}
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 500 }}>ristoratori</span>.
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[0,1,2,3,4].map(i => <Star key={i} width={18} height={18} fill={COLOR.dark} stroke={COLOR.dark} />)}
            <span style={{ marginLeft: 4, fontSize: 14, color: COLOR.dark, fontWeight: 500 }}>5/5</span>
          </div>
        </div>
      </div>

      <div
        style={{ padding: '0 24px' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            gap,
            transform: `translateX(calc(50% - ${cardWidth/2}px - ${index * (cardWidth + gap)}px))`,
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {tripled.map((t, i) => (
              <div key={i} style={{
                width: cardWidth, flexShrink: 0,
                background: '#fff', borderRadius: 32,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                padding: '32px 32px 32px 32px',
                display: 'flex', flexDirection: 'column', gap: 18,
              }}>
                <Quote width={22} height={22} color={COLOR.dark} strokeWidth={1.6} />
                <p style={{
                  margin: 0, fontSize: 15.5, lineHeight: 1.6, color: COLOR.dark2,
                  flex: 1,
                }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatar} alt={t.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: COLOR.dark }}>{t.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: COLOR.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ArrowUpRight width={12} height={12} />
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', marginTop: 28 }}>
          <button
            type="button"
            onClick={() => setIndex(i => i - 1)}
            aria-label="Precedente"
            style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '1px solid rgba(13,33,44,0.18)',
              background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            className="lm-circle-btn"
          >
            <ChevronLeft width={20} height={20} color={COLOR.dark} />
          </button>
          <button
            type="button"
            onClick={() => setIndex(i => i + 1)}
            aria-label="Successivo"
            style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '1px solid rgba(13,33,44,0.18)',
              background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            className="lm-circle-btn"
          >
            <ChevronRight width={20} height={20} color={COLOR.dark} />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── PROJECTS ───────────────────────── */

function ProjectItem({ project, delay }: { project: typeof PROJECTS[number]; delay: number }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15)
  return (
    <div ref={ref} className={inView ? 'lm-fade' : ''} style={{ animationDelay: `${delay}s`, marginBottom: 80 }}>
      <div style={{ marginLeft: 'clamp(20px, 5vw, 110px)', marginBottom: 18 }}>
        <h4 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(24px, 3.4vw, 32px)',
          fontWeight: 600, color: COLOR.dark,
          margin: '0 0 6px', letterSpacing: '-0.01em',
        }}>
          {project.name}
        </h4>
        <p style={{
          fontSize: 'clamp(14px, 1.6vw, 16px)',
          color: 'rgba(5,26,36,0.7)', margin: 0, lineHeight: 1.55,
          maxWidth: 520,
        }}>
          {project.desc}
        </p>
      </div>
      <Link href={`/sites/${project.slug}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={project.name}
          style={{
            width: '100%', borderRadius: 18,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            objectFit: 'cover',
            aspectRatio: '16 / 9',
            display: 'block',
            cursor: 'pointer',
            transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="lm-project-img"
        />
      </Link>
    </div>
  )
}

function ProjectsSection() {
  return (
    <section id="progetti" style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
      {PROJECTS.map((p, i) => (
        <ProjectItem key={p.slug} project={p} delay={0.1 + i * 0.05} />
      ))}
    </section>
  )
}

/* ───────────────────────── PARTNER (MOUSE TRAIL) ───────────────────────── */

function PartnerSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; img: string; rotation: number }>>([])
  const lastSpawn = useRef(0)
  const nextId = useRef(0)

  const onMove = useCallback((e: React.MouseEvent) => {
    const now = performance.now()
    if (now - lastSpawn.current < 80) return
    lastSpawn.current = now
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const img = MARQUEE_IMAGES[Math.floor(Math.random() * MARQUEE_IMAGES.length)]
    const rotation = Math.random() * 20 - 10
    const id = nextId.current++
    setParticles(p => [...p, { id, x, y, img, rotation }])
    setTimeout(() => {
      setParticles(p => p.filter(x => x.id !== id))
    }, 1100)
  }, [])

  return (
    <section style={{ padding: '48px 24px', width: '100%' }}>
      <div
        ref={containerRef}
        onMouseMove={onMove}
        style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '180px 24px',
          background: '#fff', borderRadius: 40,
          boxShadow: '0 0 0 0.5px rgba(0,0,0,0.05), 0 16px 64px rgba(0,0,0,0.06)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {particles.map(p => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.id}
            src={p.img}
            alt=""
            style={{
              position: 'absolute',
              left: p.x - 60, top: p.y - 80,
              width: 120, height: 160,
              objectFit: 'cover',
              borderRadius: 14,
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
              transform: `rotate(${p.rotation}deg)`,
              animation: 'lmParticle 1s ease-out forwards',
              pointerEvents: 'none',
            }}
          />
        ))}

        <h3 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(48px, 7vw, 80px)',
          fontWeight: 500, color: COLOR.dark2,
          textAlign: 'center', margin: '0 0 48px',
          letterSpacing: '-0.025em',
          position: 'relative', zIndex: 2,
          pointerEvents: 'none',
        }}>
          Costruisci con noi.
        </h3>

        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
          <Link href="/register" style={{ textDecoration: 'none' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: COLOR.dark, color: '#fff',
              padding: '8px 8px 8px 8px',
              borderRadius: 9999,
              boxShadow: PRIMARY_BTN_SHADOW,
              fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
            }} className="lm-btn-hover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&w=120&h=120&fit=crop"
                alt=""
                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ paddingRight: 20 }}>Inizia una chat con Lumino</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── FOOTER ───────────────────────── */

function FooterSection() {
  return (
    <footer id="contatti" style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 36, flexWrap: 'wrap',
      }}>
        <Btn href="/register" variant="primary">Inizia una chat</Btn>

        <div style={{ display: 'flex', gap: 60, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <ArrowUpRight width={22} height={22} color={COLOR.dark} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 100 }}>
            <a href="#prezzi" style={footerLinkStyle}>Prezzi</a>
            <a href="#progetti" style={footerLinkStyle}>Esempi</a>
            <Link href="/login" style={footerLinkStyle}>Accedi</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 100 }}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={footerLinkStyle}>Instagram</a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" style={footerLinkStyle}>X.com</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

const footerLinkStyle: React.CSSProperties = {
  fontSize: 16,
  color: COLOR.dark,
  textDecoration: 'none',
  transition: 'opacity 0.2s',
}

/* ───────────────────────── COPYRIGHT BAR ───────────────────────── */

function CopyrightBar() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 90px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 13, color: COLOR.dark, flexWrap: 'wrap', gap: 8,
        borderTop: '1px solid rgba(5,26,36,0.08)', paddingTop: 16,
      }}>
        <span>© Lumino Agency</span>
        <span>Made in Italy</span>
      </div>
    </div>
  )
}

/* ───────────────────────── FIXED BOTTOM NAV ───────────────────────── */

function BottomNav() {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50, display: 'flex', alignItems: 'center', gap: 14,
      background: '#fff', borderRadius: 9999, padding: '8px 8px 8px 24px',
      boxShadow: '0 1px 2px rgba(5,26,36,0.06), 0 8px 24px rgba(5,26,36,0.10), 0 24px 48px rgba(5,26,36,0.08)',
    }}>
      <Link href="/" style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 24, fontWeight: 600, color: COLOR.dark,
        textDecoration: 'none', lineHeight: 1,
      }}>
        L
      </Link>
      <Btn href="/register" variant="primary">Inizia una chat</Btn>
    </div>
  )
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function HomePage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: COLOR.dark, fontFamily: 'var(--font-sans)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          --font-serif: 'Instrument Serif', Georgia, 'Cormorant Garamond', serif;
          --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
        }

        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #fff; }
        body { font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }

        /* fade in up */
        @keyframes lmFadeInUp {
          0%   { opacity: 0; transform: translateY(28px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .lm-fade {
          animation: lmFadeInUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }

        /* infinite marquee */
        @keyframes lmMarquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .lm-marquee {
          animation: lmMarquee 32s linear infinite;
          will-change: transform;
        }
        @media (max-width: 768px) {
          .lm-marquee { animation-duration: 18s; }
        }

        /* mouse trail particle */
        @keyframes lmParticle {
          0%   { opacity: 0; transform: scale(0.6) rotate(var(--rot, 0deg)); }
          15%  { opacity: 1; transform: scale(1) rotate(var(--rot, 0deg)); }
          100% { opacity: 0; transform: scale(0.6) translateY(40px) rotate(var(--rot, 0deg)); }
        }

        /* button hover */
        .lm-btn-hover { will-change: transform; }
        a:hover .lm-btn-hover, button:hover .lm-btn-hover { transform: translateY(-2px); }
        a:active .lm-btn-hover { transform: translateY(0); }

        .lm-circle-btn:hover { background: ${COLOR.dark} !important; }
        .lm-circle-btn:hover svg { color: #fff !important; }

        .lm-project-img:hover { transform: scale(1.02); }

        a { color: inherit; }
        a:hover { opacity: 0.7; }

        @media (max-width: 540px) {
          .lm-hero-ctas { flex-direction: column; align-items: stretch; }
          .lm-hero-ctas > a, .lm-hero-ctas > button { width: 100%; }
          .lm-hero-ctas > a > span, .lm-hero-ctas > button > span { width: 100%; justify-content: center; }
        }
      `}</style>

      <Hero />
      <Marquee />
      <QuoteSection />
      <PricingSection />
      <CarouselSection />
      <ProjectsSection />
      <PartnerSection />
      <FooterSection />
      <CopyrightBar />
      <BottomNav />
    </div>
  )
}
