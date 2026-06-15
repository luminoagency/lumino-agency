'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

/* ───────────────────────── DATA ───────────────────────── */

const MARQUEE_IMAGES = [
  // 21 immagini di food/ristoranti italiani — stable Unsplash
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=85',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=85',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=85',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85',
  'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=85',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=85',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200&q=85',
  'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=1200&q=85',
  'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=85',
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200&q=85',
  'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?w=1200&q=85',
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1200&q=85',
  'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1200&q=85',
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=85',
  'https://images.unsplash.com/photo-1571066811602-716837d681de?w=1200&q=85',
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=1200&q=85',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&q=85',
  'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=1200&q=85',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=85',
  'https://images.unsplash.com/photo-1542528180-a1208c5169a5?w=1200&q=85',
]

const SERVICES = [
  {
    n: '01', title: 'Sito completo',
    desc: 'Generato dall\'AI in 24 ore: testi, foto, menu, mappa, contatti. Supervisionato personalmente prima della consegna.',
  },
  {
    n: '02', title: 'Prenotazioni online',
    desc: 'Form integrato sul sito, notifiche real-time al ristoratore. Gestione conferme/rifiuti dal pannello admin in 1 click.',
  },
  {
    n: '03', title: 'Dominio + Hosting',
    desc: 'Dominio personalizzato (tuoristorante.it) incluso nel prezzo. Hosting veloce su Vercel, SSL, CDN globale.',
  },
  {
    n: '04', title: 'Pannello di controllo',
    desc: 'Modifichi tu, quando vuoi: testi, orari, menu, foto, eventi. Niente più chiamate all\'agenzia per cambiare un numero.',
  },
  {
    n: '05', title: 'Supporto prioritario',
    desc: 'WhatsApp diretto per i clienti Premium. Risposta entro un\'ora. Modifiche grosse? Le facciamo noi.',
  },
]

const PROJECTS = [
  {
    n: '01',
    name: 'Sushi Hanami',
    category: 'Cliente · Premium',
    slug: 'demo-lumino',
    images: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=85',
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=85',
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1600&q=85',
    ],
  },
  {
    n: '02',
    name: 'Da Nonna Lucia',
    category: 'Cliente · Pro',
    slug: 'demo-lumino',
    images: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85',
      'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=1200&q=85',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1600&q=85',
    ],
  },
  {
    n: '03',
    name: 'Burger Republic',
    category: 'Cliente · Premium',
    slug: 'demo-lumino',
    images: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=85',
      'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1200&q=85',
      'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?w=1600&q=85',
    ],
  },
]

const HERO_PORTRAIT = 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=90'

/* ─────────────── DECORATIVE 3D-style corner images (about) ─────────────── */
const ABOUT_DECO = {
  topLeft:    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=85',
  topRight:   'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=85',
  bottomLeft: 'https://images.unsplash.com/photo-1572441713132-c542fc4fe282?w=400&q=85',
  bottomRight:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=85',
}

/* ───────────────────────── COMPONENTS ───────────────────────── */

/** Wrapper FadeIn con Framer Motion whileInView */
function FadeIn({
  children, delay = 0, duration = 0.7, x = 0, y = 30, className, style,
}: {
  children: ReactNode; delay?: number; duration?: number; x?: number; y?: number;
  className?: string; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Magnet — effetto magnetico al passaggio del mouse */
function Magnet({
  children, padding = 150, strength = 3, style,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.6s ease-in-out',
}: {
  children: ReactNode; padding?: number; strength?: number;
  style?: React.CSSProperties; activeTransition?: string; inactiveTransition?: string;
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      if (dist < Math.max(r.width, r.height) / 2 + padding) {
        setActive(true)
        setPos({ x: dx / strength, y: dy / strength })
      } else {
        setActive(false)
        setPos({ x: 0, y: 0 })
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [padding, strength])

  return (
    <div
      ref={ref}
      style={{
        ...style,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: active ? activeTransition : inactiveTransition,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}

/** AnimatedText — char-by-char opacity 0.2 → 1 scroll-driven */
function AnimatedText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  })

  return (
    <p ref={ref} className={className} style={{ position: 'relative', ...style }}>
      {text.split('').map((ch, i) => {
        const start = i / text.length
        const end = start + 1 / text.length
        return <Char key={i} ch={ch} progress={scrollYProgress} start={start} end={end} />
      })}
    </p>
  )
}

function Char({ ch, progress, start, end }: { ch: string; progress: any; start: number; end: number }) {
  const opacity = useTransform(progress, [start, end], [0.2, 1])
  return (
    <span style={{ position: 'relative', display: 'inline-block', whiteSpace: ch === ' ' ? 'pre' : 'normal' }}>
      <span style={{ opacity: 0 }}>{ch}</span>
      <motion.span style={{ opacity, position: 'absolute', left: 0, top: 0 }}>{ch}</motion.span>
    </span>
  )
}

/** ContactButton — pill con gradient viola/magenta */
function ContactButton({ label = 'Inizia ora', href = '/register' }: { label?: string; href?: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <span
        className="lm-contact-btn"
        style={{
          display: 'inline-block',
          padding: 'clamp(12px, 1.5vw, 18px) clamp(28px, 3vw, 48px)',
          borderRadius: 9999,
          background: 'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
          color: '#fff',
          fontFamily: 'inherit',
          fontSize: 'clamp(12px, 1.1vw, 16px)',
          fontWeight: 500,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          boxShadow:
            '0 4px 4px rgba(181,1,167,0.25), inset 4px 4px 12px #7721B1',
          outline: '2px solid #fff',
          outlineOffset: '-3px',
          transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), filter 0.3s',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </Link>
  )
}

/** LiveProjectButton — ghost border */
function LiveProjectButton({ href }: { href: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <span style={{
        display: 'inline-block',
        padding: 'clamp(10px, 1vw, 14px) clamp(24px, 2.4vw, 40px)',
        borderRadius: 9999,
        border: '2px solid #D7E2EA',
        color: '#D7E2EA',
        fontFamily: 'inherit',
        fontSize: 'clamp(12px, 1vw, 14px)',
        fontWeight: 500,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        background: 'transparent',
        transition: 'background 0.25s, transform 0.25s',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      className="lm-live-btn"
      >
        Vedi live
      </span>
    </Link>
  )
}

/* ───────────────────────── HERO ───────────────────────── */

function HeroSection() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      overflowX: 'clip', position: 'relative',
    }}>
      {/* NAV */}
      <FadeIn y={-20} delay={0}>
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'clamp(20px, 3vw, 36px) clamp(24px, 4vw, 56px)',
          gap: 16, flexWrap: 'wrap',
        }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#D7E2EA', fontFamily: 'inherit', fontSize: 'clamp(20px, 2vw, 28px)', fontWeight: 700, letterSpacing: '-0.01em' }}>
            Lumino<span style={{ color: '#B600A8' }}>.</span>
          </Link>
          <div style={{ display: 'flex', gap: 'clamp(18px, 3vw, 40px)', alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Studio', href: '#studio' },
              { label: 'Piani', href: '/pricing' },
              { label: 'Progetti', href: '#progetti' },
              { label: 'Contatti', href: '#contatti' },
            ].map(l => (
              <a key={l.label} href={l.href} className="lm-nav-link" style={{
                color: '#D7E2EA', textDecoration: 'none',
                fontSize: 'clamp(13px, 1.15vw, 22px)',
                fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'opacity 0.2s',
              }}>{l.label}</a>
            ))}
          </div>
        </nav>
      </FadeIn>

      {/* HERO HEADING */}
      <div style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <FadeIn y={40} delay={0.15}>
          <h1 className="hero-heading" style={{
            fontSize: 'clamp(18vw, 17vw, 17.5vw)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            textTransform: 'lowercase',
            whiteSpace: 'nowrap',
            margin: 0,
            padding: '0 clamp(24px, 4vw, 56px)',
            width: '100%',
            textAlign: 'left',
          }}>
            ciao,&nbsp;siamo<br/>lumino<span style={{ display: 'inline-block', WebkitTextFillColor: '#B600A8', color: '#B600A8' }}>.</span>
          </h1>
        </FadeIn>

        {/* BOTTOM BAR */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          padding: 'clamp(22px, 3vw, 44px) clamp(24px, 4vw, 56px) clamp(28px, 3vw, 44px)',
          gap: 22, flexWrap: 'wrap',
        }}>
          <FadeIn y={20} delay={0.35}>
            <p style={{
              color: '#D7E2EA',
              fontSize: 'clamp(0.75rem, 1.4vw, 1.5rem)',
              fontWeight: 300,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 1.35,
              maxWidth: 'clamp(180px, 22vw, 320px)',
              margin: 0,
            }}>
              Uno studio italiano che genera siti per ristoranti — AI per costruirli, occhi umani per ogni dettaglio
            </p>
          </FadeIn>
          <FadeIn y={20} delay={0.5}>
            <ContactButton label="Inizia ora" />
          </FadeIn>
        </div>
      </div>

      {/* PORTRAIT */}
      <FadeIn y={30} delay={0.6} style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        top: 'auto', bottom: 0,
      }}>
        <Magnet padding={150} strength={3}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_PORTRAIT}
            alt="Lumino"
            style={{
              width: 'clamp(260px, 32vw, 520px)',
              height: 'auto',
              objectFit: 'cover',
              borderRadius: 24,
              boxShadow: '0 24px 80px rgba(182,0,168,0.18), 0 12px 40px rgba(0,0,0,0.5)',
              display: 'block',
            }}
          />
        </Magnet>
      </FadeIn>
    </section>
  )
}

/* ───────────────────────── MARQUEE ───────────────────────── */

function MarqueeSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const sectionTop = rect.top + window.scrollY
      const off = (window.scrollY - sectionTop + window.innerHeight) * 0.3
      setOffset(off)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const row1 = MARQUEE_IMAGES.slice(0, 11)
  const row2 = MARQUEE_IMAGES.slice(11)
  const row1x3 = [...row1, ...row1, ...row1]
  const row2x3 = [...row2, ...row2, ...row2]

  return (
    <section ref={ref} style={{
      background: '#0C0C0C',
      padding: 'clamp(80px, 12vw, 160px) 0 40px',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 12,
        transform: `translateX(${offset - 200}px)`,
        willChange: 'transform',
      }}>
        {row1x3.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`r1-${i}`}
            src={src}
            alt=""
            loading="lazy"
            style={{
              width: 'clamp(280px, 30vw, 420px)',
              height: 'clamp(190px, 20vw, 270px)',
              objectFit: 'cover',
              borderRadius: 18,
              flexShrink: 0,
              filter: 'saturate(1.05)',
            }}
          />
        ))}
      </div>
      <div style={{
        display: 'flex',
        gap: 12,
        transform: `translateX(${-(offset - 200)}px)`,
        willChange: 'transform',
      }}>
        {row2x3.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`r2-${i}`}
            src={src}
            alt=""
            loading="lazy"
            style={{
              width: 'clamp(280px, 30vw, 420px)',
              height: 'clamp(190px, 20vw, 270px)',
              objectFit: 'cover',
              borderRadius: 18,
              flexShrink: 0,
              filter: 'saturate(1.05)',
            }}
          />
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── ABOUT ───────────────────────── */

function AboutSection() {
  return (
    <section id="studio" style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      padding: 'clamp(64px, 10vw, 120px) clamp(20px, 4vw, 56px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 'clamp(40px, 7vw, 90px)',
    }}>
      {/* Decorative corner images */}
      <FadeIn x={-80} delay={0.1} duration={0.9} style={{
        position: 'absolute', top: '4%', left: 'clamp(6px, 3vw, 60px)', zIndex: 1, pointerEvents: 'none',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ABOUT_DECO.topLeft} alt="" style={{
          width: 'clamp(110px, 12vw, 210px)', borderRadius: 18,
          filter: 'saturate(0.7)', opacity: 0.7,
        }} />
      </FadeIn>
      <FadeIn x={80} delay={0.15} duration={0.9} style={{
        position: 'absolute', top: '4%', right: 'clamp(6px, 3vw, 60px)', zIndex: 1, pointerEvents: 'none',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ABOUT_DECO.topRight} alt="" style={{
          width: 'clamp(110px, 12vw, 210px)', borderRadius: 18,
          filter: 'saturate(0.7)', opacity: 0.7,
        }} />
      </FadeIn>
      <FadeIn x={-80} delay={0.25} duration={0.9} style={{
        position: 'absolute', bottom: '8%', left: 'clamp(12px, 6vw, 140px)', zIndex: 1, pointerEvents: 'none',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ABOUT_DECO.bottomLeft} alt="" style={{
          width: 'clamp(90px, 10vw, 180px)', borderRadius: 18,
          filter: 'saturate(0.7)', opacity: 0.7,
        }} />
      </FadeIn>
      <FadeIn x={80} delay={0.3} duration={0.9} style={{
        position: 'absolute', bottom: '8%', right: 'clamp(12px, 6vw, 140px)', zIndex: 1, pointerEvents: 'none',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ABOUT_DECO.bottomRight} alt="" style={{
          width: 'clamp(110px, 12vw, 220px)', borderRadius: 18,
          filter: 'saturate(0.7)', opacity: 0.7,
        }} />
      </FadeIn>

      <FadeIn y={40} delay={0} style={{ position: 'relative', zIndex: 2 }}>
        <h2 className="hero-heading" style={{
          fontSize: 'clamp(3rem, 12vw, 160px)',
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          textTransform: 'uppercase',
          textAlign: 'center',
          margin: 0,
        }}>
          Lo studio
        </h2>
      </FadeIn>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 620 }}>
        <AnimatedText
          text="Lumino è uno studio italiano nato per dare ai ristoratori siti web che oggi normalmente non possono permettersi. L'AI scrive testi, sceglie foto e organizza il menu. Noi controlliamo ogni dettaglio prima della consegna. Niente riunioni infinite, niente template da Facebook. Solo un sito che fa onore al tuo locale, online in 24 ore."
          style={{
            color: '#D7E2EA',
            fontWeight: 500,
            textAlign: 'center',
            lineHeight: 1.55,
            fontSize: 'clamp(1rem, 2vw, 1.35rem)',
            margin: 0,
          }}
        />
      </div>

      <FadeIn delay={0.2} style={{ position: 'relative', zIndex: 2 }}>
        <ContactButton label="Costruisci il tuo" />
      </FadeIn>
    </section>
  )
}

/* ───────────────────────── SERVICES ───────────────────────── */

function ServicesSection() {
  return (
    <section style={{
      background: '#fff',
      borderTopLeftRadius: 'clamp(40px, 5vw, 60px)',
      borderTopRightRadius: 'clamp(40px, 5vw, 60px)',
      padding: 'clamp(80px, 10vw, 130px) clamp(20px, 4vw, 56px)',
      position: 'relative', zIndex: 5,
    }}>
      <FadeIn y={40} delay={0}>
        <h2 style={{
          color: '#0C0C0C',
          fontWeight: 900,
          fontSize: 'clamp(3rem, 12vw, 160px)',
          letterSpacing: '-0.03em',
          textTransform: 'uppercase',
          textAlign: 'center',
          lineHeight: 0.95,
          margin: '0 0 clamp(64px, 8vw, 112px)',
        }}>
          Cosa facciamo
        </h2>
      </FadeIn>

      <div style={{ maxWidth: 1024, margin: '0 auto' }}>
        {SERVICES.map((s, i) => (
          <FadeIn key={s.n} y={30} delay={i * 0.1}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              alignItems: 'center',
              gap: 'clamp(20px, 4vw, 64px)',
              padding: 'clamp(32px, 4.5vw, 56px) 0',
              borderTop: i === 0 ? '1px solid rgba(12,12,12,0.15)' : 'none',
              borderBottom: '1px solid rgba(12,12,12,0.15)',
            }}>
              <span style={{
                color: '#0C0C0C',
                fontWeight: 900,
                fontSize: 'clamp(3rem, 10vw, 140px)',
                lineHeight: 0.85,
                fontFeatureSettings: '"tnum"',
              }}>{s.n}</span>
              <div>
                <h3 style={{
                  color: '#0C0C0C',
                  fontWeight: 500,
                  fontSize: 'clamp(1rem, 2.2vw, 2.1rem)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  margin: '0 0 14px',
                  lineHeight: 1.15,
                }}>{s.title}</h3>
                <p style={{
                  color: '#0C0C0C',
                  fontWeight: 300,
                  fontSize: 'clamp(0.85rem, 1.6vw, 1.25rem)',
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: 720,
                  opacity: 0.6,
                }}>{s.desc}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── PROJECTS (sticky stacking) ───────────────────────── */

function ProjectsSection() {
  return (
    <section id="progetti" style={{
      background: '#0C0C0C',
      borderTopLeftRadius: 'clamp(40px, 5vw, 60px)',
      borderTopRightRadius: 'clamp(40px, 5vw, 60px)',
      marginTop: 'clamp(-56px, -7vw, -40px)',
      position: 'relative', zIndex: 10,
      padding: 'clamp(80px, 10vw, 130px) clamp(20px, 4vw, 56px) clamp(80px, 10vw, 130px)',
    }}>
      <FadeIn y={40} delay={0}>
        <h2 className="hero-heading" style={{
          fontSize: 'clamp(3rem, 12vw, 160px)',
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          textTransform: 'uppercase',
          textAlign: 'center',
          margin: '0 0 clamp(48px, 6vw, 80px)',
        }}>
          Progetti
        </h2>
      </FadeIn>

      {PROJECTS.map((p, i) => (
        <ProjectCard key={p.n} project={p} index={i} totalCards={PROJECTS.length} />
      ))}
    </section>
  )
}

function ProjectCard({ project, index, totalCards }: {
  project: typeof PROJECTS[number]; index: number; totalCards: number;
}) {
  const targetScale = 1 - (totalCards - 1 - index) * 0.03
  const topOffset = index * 28

  return (
    <div style={{
      height: '85vh',
      position: 'relative',
      maxWidth: 1280,
      margin: '0 auto',
    }}>
      <motion.div
        style={{
          position: 'sticky',
          top: `clamp(80px, 10vh, 128px)`,
          marginTop: topOffset,
          background: '#0C0C0C',
          border: '2px solid #D7E2EA',
          borderRadius: 'clamp(32px, 5vw, 60px)',
          padding: 'clamp(16px, 2vw, 32px)',
          scale: targetScale,
          transformOrigin: 'top',
        }}
      >
        {/* Top row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          gap: 'clamp(16px, 3vw, 40px)', flexWrap: 'wrap',
          marginBottom: 'clamp(16px, 2vw, 28px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(16px, 3vw, 36px)', flexWrap: 'wrap' }}>
            <span style={{
              color: '#D7E2EA',
              fontWeight: 900,
              fontSize: 'clamp(3rem, 10vw, 140px)',
              lineHeight: 0.8,
              fontFeatureSettings: '"tnum"',
            }}>{project.n}</span>
            <div>
              <p style={{
                color: '#D7E2EA',
                fontSize: 'clamp(0.7rem, 1vw, 1rem)',
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                margin: '0 0 4px',
                opacity: 0.7,
              }}>{project.category}</p>
              <h3 style={{
                color: '#D7E2EA',
                fontWeight: 500,
                fontSize: 'clamp(1.2rem, 2.4vw, 2.4rem)',
                letterSpacing: '-0.01em',
                margin: 0,
              }}>{project.name}</h3>
            </div>
          </div>
          <LiveProjectButton href={`/sites/${project.slug}`} />
        </div>

        {/* Bottom: 2-col image grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40% 60%',
          gap: 'clamp(8px, 1.5vw, 18px)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 18px)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.images[0]} alt="" style={{
              width: '100%',
              height: 'clamp(130px, 16vw, 230px)',
              objectFit: 'cover',
              borderRadius: 'clamp(32px, 5vw, 60px)',
              display: 'block',
            }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.images[1]} alt="" style={{
              width: '100%',
              height: 'clamp(160px, 22vw, 340px)',
              objectFit: 'cover',
              borderRadius: 'clamp(32px, 5vw, 60px)',
              display: 'block',
            }} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.images[2]} alt="" style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 'clamp(32px, 5vw, 60px)',
            display: 'block',
          }} />
        </div>
      </motion.div>
    </div>
  )
}

/* ───────────────────────── FOOTER ───────────────────────── */

function FooterSection() {
  return (
    <footer id="contatti" style={{
      background: '#0C0C0C',
      padding: 'clamp(60px, 8vw, 100px) clamp(20px, 4vw, 56px) clamp(40px, 5vw, 60px)',
      borderTop: '1px solid rgba(215,226,234,0.08)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 40, flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ color: '#D7E2EA', fontSize: 'clamp(1.5rem, 4vw, 3rem)', fontWeight: 500, letterSpacing: '-0.01em', margin: '0 0 14px' }}>
            Pronto a costruire?
          </p>
          <ContactButton label="Inizia ora" />
        </div>
        <div style={{ display: 'flex', gap: 'clamp(28px, 4vw, 60px)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="/pricing" style={{ color: '#D7E2EA', textDecoration: 'none', fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }} className="lm-nav-link">Piani</a>
            <a href="#progetti" style={{ color: '#D7E2EA', textDecoration: 'none', fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }} className="lm-nav-link">Progetti</a>
            <a href="/portfolio" style={{ color: '#D7E2EA', textDecoration: 'none', fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }} className="lm-nav-link">Portfolio</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="/login" style={{ color: '#D7E2EA', textDecoration: 'none', fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }} className="lm-nav-link">Accedi</a>
            <a href="/register" style={{ color: '#D7E2EA', textDecoration: 'none', fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }} className="lm-nav-link">Registrati</a>
            <a href="mailto:ciao@bylumino.com" style={{ color: '#D7E2EA', textDecoration: 'none', fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }} className="lm-nav-link">Email</a>
          </div>
        </div>
      </div>
      <div style={{
        maxWidth: 1280, margin: '40px auto 0',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, color: 'rgba(215,226,234,0.5)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        flexWrap: 'wrap', gap: 8,
        paddingTop: 24, borderTop: '1px solid rgba(215,226,234,0.08)',
      }}>
        <span>© Lumino Agency</span>
        <span>Made in Italy</span>
      </div>
    </footer>
  )
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function HomePage() {
  return (
    <main style={{
      background: '#0C0C0C',
      color: '#D7E2EA',
      fontFamily: 'Kanit, system-ui, sans-serif',
      overflowX: 'clip',
      minHeight: '100vh',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;700;900&display=swap');

        :root { color-scheme: dark; }

        * { box-sizing: border-box; }
        html, body, #__next { margin: 0; padding: 0; background: #0C0C0C; }
        body { font-family: 'Kanit', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }

        .hero-heading {
          background: linear-gradient(180deg, #646973 0%, #BBCCD7 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }

        .lm-nav-link { transition: opacity 0.2s; }
        .lm-nav-link:hover { opacity: 0.7; }

        .lm-contact-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .lm-live-btn:hover { background: rgba(215,226,234,0.1); transform: translateY(-2px); }
      `}</style>

      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
      <FooterSection />
    </main>
  )
}
