'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Play, Sparkles, LayoutGrid, Gem, Clock, Globe } from 'lucide-react'

/* ────────────────────────────  CONFIG  ──────────────────────────── */

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4'
const CAP_VIDEO  = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4'

const FADE_MS = 500
const FADE_OUT_LEAD = 0.55

/* ────────────────────────  FadingVideo  ─────────────────────────── */

interface FadingVideoProps {
  src: string
  className?: string
  style?: React.CSSProperties
}

function FadingVideo({ src, className, style }: FadingVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const fadingOutRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  const fadeTo = useCallback((target: number, duration: number) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    const v = ref.current
    if (!v) return
    const start = parseFloat(v.style.opacity || '0') || 0
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - t0) / duration, 1)
      if (v) v.style.opacity = String(start + (target - start) * t)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.style.opacity = '0'

    const start = () => {
      // play() ritorna una promise; se viene rejected (autoplay block) ignoriamo
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
      fadeTo(1, FADE_MS)
    }
    const onLoaded = () => { start() }
    const onTime = () => {
      if (!fadingOutRef.current && v.duration > 0) {
        const remaining = v.duration - v.currentTime
        if (remaining <= FADE_OUT_LEAD && remaining > 0) {
          fadingOutRef.current = true
          fadeTo(0, FADE_MS)
        }
      }
    }
    const onEnded = () => {
      v.style.opacity = '0'
      setTimeout(() => {
        v.currentTime = 0
        const p = v.play()
        if (p && typeof p.catch === 'function') p.catch(() => {})
        fadingOutRef.current = false
        fadeTo(1, FADE_MS)
      }, 100)
    }

    v.addEventListener('loadeddata', onLoaded)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('ended', onEnded)

    // Race-condition fix: se il video è già pronto quando useEffect parte,
    // l'evento loadeddata è già stato emesso — chiama start() manualmente.
    if (v.readyState >= 2) start()

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      v.removeEventListener('loadeddata', onLoaded)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('ended', onEnded)
    }
  }, [fadeTo, src])

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      ref={ref}
      src={src}
      className={className}
      style={{ opacity: 0, ...style }}
      autoPlay
      muted
      playsInline
      preload="auto"
    />
  )
}

/* ────────────────────────────  BlurText  ─────────────────────────── */

interface BlurTextProps {
  text: string
  className?: string
  style?: React.CSSProperties
}

function BlurText({ text, className, style }: BlurTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const words = text.split(' ')
  return (
    <p
      ref={ref}
      className={className}
      style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        rowGap: '0.1em', margin: 0, ...style,
      }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ filter: 'blur(10px)', opacity: 0, y: 50 }}
          animate={visible ? {
            filter: ['blur(10px)', 'blur(5px)', 'blur(0px)'],
            opacity: [0, 0.5, 1],
            y: [50, -5, 0],
          } : {}}
          transition={{
            duration: 0.7,
            times: [0, 0.5, 1],
            ease: 'easeOut',
            delay: (i * 100) / 1000,
          }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {w}
        </motion.span>
      ))}
    </p>
  )
}

/* ────────────────────────────  FadeUp wrapper  ─────────────────────────── */

function FadeUp({ children, delay = 0, className, style }: { children: ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
      animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

/* ───────────────────────────  Navbar  ─────────────────────────── */

function Navbar() {
  return (
    <FadeUp delay={0.2} style={{
      position: 'fixed', top: 16, left: 0, right: 0, zIndex: 50,
      padding: '0 clamp(20px, 4vw, 64px)',
    }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Logo circle */}
        <Link href="/" aria-label="Home" className="liquid-glass" style={{
          width: 48, height: 48, borderRadius: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', textDecoration: 'none',
          fontFamily: 'var(--font-heading)', fontStyle: 'italic',
          fontSize: 26, lineHeight: 1,
          textTransform: 'lowercase',
        }}>l</Link>

        {/* Center pill (desktop) */}
        <div className="liquid-glass lm-nav-center" style={{
          borderRadius: 9999, padding: '6px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {[
            { label: 'Home', href: '#home' },
            { label: 'Studio', href: '#studio' },
            { label: 'Tecnologia', href: '#cap' },
            { label: 'Piani', href: '/pricing' },
            { label: 'Progetti', href: '/portfolio' },
          ].map(l => (
            <Link key={l.label} href={l.href} style={{
              padding: '8px 14px',
              fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.92)',
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
              borderRadius: 9999,
              transition: 'background 0.2s',
            }} className="lm-nav-link">{l.label}</Link>
          ))}
          <Link href="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#fff', color: '#000',
            padding: '8px 14px',
            borderRadius: 9999,
            fontSize: 13, fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
          }} className="lm-nav-cta">
            Inizia ora <ArrowUpRight size={16} strokeWidth={2.4} />
          </Link>
        </div>

        {/* Right spacer */}
        <div style={{ width: 48, height: 48 }} aria-hidden />
      </nav>
    </FadeUp>
  )
}

/* ───────────────────────────  Stats card  ─────────────────────────── */

function StatCard({ icon, value, label, delay }: { icon: ReactNode; value: string; label: string; delay: number }) {
  return (
    <FadeUp delay={delay} className="liquid-glass" style={{
      borderRadius: '1.25rem', padding: 20, width: 220,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ color: '#fff', opacity: 0.95 }}>{icon}</div>
      <div>
        <p style={{
          fontFamily: 'var(--font-heading)', fontStyle: 'italic',
          fontSize: '2.25rem', letterSpacing: '-1px',
          color: '#fff', lineHeight: 1, margin: 0,
        }}>{value}</p>
        <p style={{
          fontFamily: 'var(--font-body)', fontWeight: 300,
          fontSize: 12, color: '#fff', margin: '8px 0 0', opacity: 0.92,
        }}>{label}</p>
      </div>
    </FadeUp>
  )
}

/* ────────────────────────────  HERO  ─────────────────────────── */

function HeroSection() {
  return (
    <section id="home" style={{
      position: 'relative', height: '100vh', minHeight: 700,
      background: '#000', overflow: 'hidden',
    }}>
      {/* Background video */}
      <FadingVideo
        src={HERO_VIDEO}
        style={{
          position: 'absolute', left: '50%', top: 0,
          transform: 'translateX(-50%)',
          width: '120%', height: '120%',
          objectFit: 'cover', objectPosition: 'top',
          zIndex: 0,
        }}
      />

      {/* Bottom black fade for legibility */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,0,0,0.45) 100%)',
      }} />

      <Navbar />

      <div style={{
        position: 'relative', zIndex: 10,
        height: '100%', display: 'flex', flexDirection: 'column',
        paddingTop: 96, paddingLeft: 16, paddingRight: 16,
      }}>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          gap: 24,
        }}>
          {/* Badge */}
          <FadeUp delay={0.4} className="liquid-glass" style={{
            borderRadius: 9999, padding: '4px 4px 4px 4px',
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              background: '#fff', color: '#000',
              padding: '4px 12px', borderRadius: 9999,
              fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)',
              letterSpacing: '0.02em',
            }}>Nuovo</span>
            <span style={{
              paddingRight: 14, fontSize: 13, color: 'rgba(255,255,255,0.92)',
              fontFamily: 'var(--font-body)',
            }}>Pipeline AI generazione siti — Live</span>
          </FadeUp>

          {/* Headline (BlurText) */}
          <div style={{ maxWidth: 920 }}>
            <BlurText
              text="Eleva il tuo locale oltre l'ordinario"
              style={{
                fontFamily: 'var(--font-heading)',
                fontStyle: 'italic',
                fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
                color: '#fff',
                lineHeight: 0.85,
                letterSpacing: '-4px',
                margin: 0,
              }}
            />
          </div>

          {/* Subheading */}
          <FadeUp delay={0.8}>
            <p style={{
              maxWidth: 640, margin: 0,
              color: '#fff',
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: 'clamp(0.875rem, 1.5vw, 1.05rem)',
              lineHeight: 1.4,
            }}>
              Generazione AI di siti per ristoratori italiani. Template cinematografici, supervisione umana su ogni dettaglio. Pronto in 24 ore.
            </p>
          </FadeUp>

          {/* CTAs */}
          <FadeUp delay={1.1} style={{
            display: 'flex', alignItems: 'center', gap: 24, marginTop: 8,
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            <Link href="/register" className="liquid-glass-strong" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              borderRadius: 9999, padding: '10px 20px',
              fontSize: 14, fontWeight: 500, color: '#fff',
              fontFamily: 'var(--font-body)', textDecoration: 'none',
            }}>
              Inizia ora <ArrowUpRight size={20} strokeWidth={2} />
            </Link>
            <Link href="#cap" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: '#fff', textDecoration: 'none',
              fontSize: 14, fontWeight: 500,
              fontFamily: 'var(--font-body)',
            }} className="lm-link">
              Vedi esempi <Play size={16} fill="currentColor" stroke="none" />
            </Link>
          </FadeUp>

          {/* Stats */}
          <div style={{
            display: 'flex', alignItems: 'stretch', gap: 16, marginTop: 32,
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            <StatCard
              delay={1.3}
              icon={<Clock size={28} strokeWidth={1.4} />}
              value="24h"
              label="Tempo medio di consegna del sito"
            />
            <StatCard
              delay={1.4}
              icon={<Globe size={28} strokeWidth={1.4} />}
              value="5"
              label="Template cinematografici disponibili"
            />
          </div>
        </div>

        {/* Partners */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 16, paddingBottom: 32,
        }}>
          <FadeUp delay={1.4} className="liquid-glass" style={{
            display: 'inline-flex', borderRadius: 9999, padding: '4px 14px',
            fontSize: 11.5, fontWeight: 500, color: '#fff',
            fontFamily: 'var(--font-body)',
          }}>
            Potenziati dalle migliori tecnologie disponibili
          </FadeUp>
          <FadeUp delay={1.5} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 'clamp(28px, 4vw, 64px)', flexWrap: 'wrap',
            color: '#fff',
            fontFamily: 'var(--font-heading)', fontStyle: 'italic',
            fontSize: 'clamp(1.25rem, 2.4vw, 1.75rem)',
            letterSpacing: '-0.01em',
          }}>
            <span>Claude</span>
            <span>Vercel</span>
            <span>Supabase</span>
            <span>Unsplash</span>
            <span>Stripe</span>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────  CapabilityCard  ────────────────────── */

function CapabilityCard({
  icon, tags, title, body, delay,
}: {
  icon: ReactNode; tags: string[]; title: string; body: string; delay: number
}) {
  return (
    <FadeUp delay={delay} className="liquid-glass" style={{
      borderRadius: '1.25rem', padding: 24,
      minHeight: 360,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div className="liquid-glass" style={{
          width: 44, height: 44, borderRadius: '0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>{icon}</div>

        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end',
          gap: 6, maxWidth: '72%',
        }}>
          {tags.map(t => (
            <span key={t} className="liquid-glass" style={{
              borderRadius: 9999, padding: '4px 11px',
              fontSize: 11, color: 'rgba(255,255,255,0.95)',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ marginTop: 24 }}>
        <h3 style={{
          fontFamily: 'var(--font-heading)', fontStyle: 'italic',
          color: '#fff',
          fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
          letterSpacing: '-1px',
          lineHeight: 1, margin: 0,
        }}>{title}</h3>
        <p style={{
          margin: '12px 0 0',
          fontSize: 14, color: 'rgba(255,255,255,0.92)',
          fontFamily: 'var(--font-body)', fontWeight: 300,
          lineHeight: 1.4, maxWidth: '34ch',
        }}>{body}</p>
      </div>
    </FadeUp>
  )
}

/* ────────────────────────  Capabilities  ─────────────────────── */

function CapabilitiesSection() {
  return (
    <section id="cap" style={{
      position: 'relative', minHeight: '100vh',
      background: '#000', overflow: 'hidden',
    }}>
      <FadingVideo
        src={CAP_VIDEO}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0,
        }}
      />

      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.45) 100%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 10,
        padding: 'clamp(80px, 8vw, 96px) clamp(20px, 5vw, 80px) 40px',
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
      }}>
        <div style={{ marginBottom: 'auto' }}>
          <FadeUp delay={0}>
            <p style={{
              fontSize: 14, color: 'rgba(255,255,255,0.85)',
              fontFamily: 'var(--font-body)',
              margin: '0 0 22px',
            }}>// Funzionalità</p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontStyle: 'italic',
              color: '#fff',
              fontSize: 'clamp(2.8rem, 8vw, 6rem)',
              lineHeight: 0.9, letterSpacing: '-3px',
              margin: 0,
            }}>
              Tecnologia<br/>evoluta
            </h2>
          </FadeUp>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24, marginTop: 64,
        }}>
          <CapabilityCard
            delay={0.2}
            icon={<Sparkles size={22} strokeWidth={1.6} />}
            tags={['Testi naturali', 'Foto curate', 'Menu coerente', '24 ore']}
            title="AI Generativa"
            body="L'AI analizza il tuo ristorante e genera testi, sceglie le foto migliori, organizza il menu. Tutto pronto in un giorno, supervisionato da occhi umani."
          />
          <CapabilityCard
            delay={0.35}
            icon={<LayoutGrid size={22} strokeWidth={1.6} />}
            tags={['Edit live', 'Prenotazioni', 'Newsletter', 'Eventi']}
            title="Pannello & Prenotazioni"
            body="Modifica tutto in autonomia dal pannello: testi, orari, menu, foto. Le prenotazioni arrivano in real-time, gestisci tutto da un solo posto."
          />
          <CapabilityCard
            delay={0.5}
            icon={<Gem size={22} strokeWidth={1.6} />}
            tags={['5 template', 'Logo AI', 'Foto custom', 'Dominio incluso']}
            title="Su misura"
            body="Scegli tra 5 template cinematografici. Logo generato dall'AI, dominio personalizzato incluso, foto e video sostituibili quando vuoi."
          />
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────  PAGE  ─────────────────────────── */

export default function HomePage() {
  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh', overflowX: 'clip' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600;700&display=swap');

        :root {
          color-scheme: dark;
          --font-heading: 'Instrument Serif', Georgia, serif;
          --font-body: 'Barlow', system-ui, -apple-system, sans-serif;
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #000; }
        body { font-family: var(--font-body); -webkit-font-smoothing: antialiased; }

        /* ─── liquid-glass ─── */
        .liquid-glass {
          background: rgba(255, 255, 255, 0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
        }
        .liquid-glass::before {
          content: "";
          position: absolute; inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(180deg,
            rgba(255,255,255,0.45) 0%,
            rgba(255,255,255,0.15) 20%,
            rgba(255,255,255,0) 40%,
            rgba(255,255,255,0) 60%,
            rgba(255,255,255,0.15) 80%,
            rgba(255,255,255,0.45) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .liquid-glass-strong {
          background: rgba(255, 255, 255, 0.02);
          background-blend-mode: luminosity;
          backdrop-filter: blur(50px);
          -webkit-backdrop-filter: blur(50px);
          border: none;
          box-shadow: 4px 4px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.15);
          position: relative;
          overflow: hidden;
        }
        .liquid-glass-strong::before {
          content: "";
          position: absolute; inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(180deg,
            rgba(255,255,255,0.5) 0%,
            rgba(255,255,255,0.2) 20%,
            rgba(255,255,255,0) 40%,
            rgba(255,255,255,0) 60%,
            rgba(255,255,255,0.2) 80%,
            rgba(255,255,255,0.5) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        /* ─── interactions ─── */
        .lm-nav-link { transition: background 0.2s, color 0.2s; }
        .lm-nav-link:hover { background: rgba(255,255,255,0.06); color: #fff; }

        .lm-nav-cta { transition: transform 0.2s, box-shadow 0.2s; }
        .lm-nav-cta:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(255,255,255,0.18); }

        .lm-link { transition: opacity 0.2s; }
        .lm-link:hover { opacity: 0.7; }

        /* ─── responsive: hide center nav on mobile ─── */
        @media (max-width: 880px) {
          .lm-nav-center { display: none !important; }
        }

        /* fallback gradient if video doesn't load */
        section { background-image: radial-gradient(circle at 30% 20%, rgba(70,30,100,0.18), transparent 60%), radial-gradient(circle at 80% 80%, rgba(180,0,140,0.10), transparent 55%); }
      ` }} />

      <HeroSection />
      <CapabilitiesSection />
    </main>
  )
}
