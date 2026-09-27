'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Euro, Layers, MapPin, Menu, Sun, X } from 'lucide-react'
import Wordmark from '@/components/home/Wordmark'
import { gsap, lerp, onMouseEffectsChange, pointer, prefersReducedMotion, trackPointer } from '@/components/home/useMotion'
import { activeHref, visibleNav, type StaffNavItem } from '@/lib/staff/nav'
import type { StaffProfile } from '@/lib/staff/types'

/**
 * La struttura dell'area staff: dove sei, dove puoi andare, chi sei.
 *
 * Due navigazioni per lo stesso elenco, non due elenchi:
 *  · da 900px in su un rail fisso a sinistra — un indice tipografico, perché
 *    su un monitor c'è spazio per leggere le parole invece di indovinare icone;
 *  · sotto, una barra in basso con quattro voci e un pannello per le altre.
 *    In basso e non in alto perché la dashboard si usa camminando, con una
 *    mano, e il pollice non arriva in cima allo schermo.
 *
 * Il movimento qui fa una cosa sola: dire che la pagina è cambiata. Niente
 * scroll animato (in una lista di lavoro è un intralcio) e niente entrate
 * lunghe: 0.4s e via.
 */

const ICONS: Record<string, typeof Sun> = {
  '/staff': Sun,
  '/staff/pipeline': Layers,
  '/staff/campo': MapPin,
  '/staff/soldi': Euro,
}

export default function StaffShell({
  me,
  children,
}: {
  me: StaffProfile
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? '/staff'
  const active = activeHref(pathname)
  const items = visibleNav(me.role === 'admin')
  const tabs = items.filter((item) => item.mobile)
  const [sheetOpen, setSheetOpen] = useState(false)

  /* Il pannello si chiude da sé al cambio pagina: lasciarlo aperto sopra la
     pagina appena aperta è il classico modo di sembrare rotti. */
  useEffect(() => setSheetOpen(false), [pathname])

  return (
    <div className="lm-staff-shell">
      <StaffCursor />

      <header className="lm-staff-top">
        <Link href="/staff" className="lm-staff-brand" aria-label="Lumino Staff">
          <Wordmark animated={false} />
          <span className="lm-staff-tag">Staff</span>
        </Link>
        <span className="lm-staff-initial" aria-hidden="true">
          {me.nome.trim().charAt(0).toUpperCase()}
        </span>
      </header>

      <nav className="lm-staff-rail" aria-label="Sezioni">
        <Link href="/staff" className="lm-staff-brand" aria-label="Lumino Staff">
          <Wordmark animated={false} />
          <span className="lm-staff-tag">Staff</span>
        </Link>

        <div className="lm-staff-nav">
          {items.map((item) => (
            <NavLink key={item.href} item={item} active={active} />
          ))}
        </div>

        <div className="lm-staff-me">
          <strong>{me.nome}</strong>
          {me.role === 'admin' ? 'Amministratore' : 'Venditore'}
          <LogoutButton />
        </div>
      </nav>

      <main className="lm-staff-main">
        <PageEnter key={pathname}>{children}</PageEnter>
      </main>

      <nav className="lm-staff-dock" aria-label="Sezioni">
        {tabs.map((item) => {
          const Icon = ICONS[item.href] ?? Layers
          return (
            <Link
              key={item.href}
              href={item.href}
              className="lm-staff-tab"
              aria-current={active === item.href ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
              {item.short}
            </Link>
          )
        })}
        <button
          type="button"
          className="lm-staff-tab"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen((open) => !open)}
        >
          {sheetOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          Altro
        </button>
      </nav>

      {sheetOpen && (
        <div
          className="lm-staff-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Tutte le sezioni"
          onClick={() => setSheetOpen(false)}
        >
          <div className="lm-staff-sheet-inner" onClick={(event) => event.stopPropagation()}>
            <span className="lm-staff-label">Tutte le sezioni</span>
            <div className="lm-staff-nav">
              {items
                .filter((item) => !item.mobile)
                .map((item) => (
                  <NavLink key={item.href} item={item} active={active} />
                ))}
            </div>
            <div className="lm-staff-me">
              <strong>{me.nome}</strong>
              {me.role === 'admin' ? 'Amministratore' : 'Venditore'}
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NavLink({ item, active }: { item: StaffNavItem; active: string }) {
  const soon = item.fase > 1
  return (
    <Link
      href={item.href}
      className="lm-staff-link"
      data-soon={soon}
      aria-current={active === item.href ? 'page' : undefined}
      data-cursor="grow"
    >
      {item.label}
      {soon && <span className="lm-staff-soon">in arrivo</span>}
    </Link>
  )
}

/** Un form, non un link: l'uscita cambia lo stato, e lo stato si cambia in POST. */
function LogoutButton() {
  return (
    <form action="/staff/logout" method="post">
      <button type="submit" className="lm-staff-out">
        Esci
      </button>
    </form>
  )
}

/**
 * L'entrata della pagina.
 *
 * Il `key={pathname}` sul chiamante rimonta questo componente a ogni
 * navigazione, quindi l'animazione riparte senza dover confrontare i percorsi.
 * Lo stato iniziale (opacity 0) è nel CSS: se il JS arriva tardi il contenuto
 * non lampeggia già a posto per poi rifare l'entrata.
 */
function PageEnter({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (prefersReducedMotion()) {
      el.style.opacity = '1'
      return
    }

    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.42, ease: 'power2.out', clearProps: 'transform' },
    )
    return () => {
      tween.kill()
    }
  }, [])

  return (
    <div ref={ref} className="lm-staff-enter">
      {children}
    </div>
  )
}

/**
 * Il cursore della vetrina, ridotto all'osso: il punto che segue e l'anello che
 * insegue. Nessun alone, nessuna parola dentro un disco — lì serviva a invitare
 * al clic, qui si sta lavorando.
 *
 * Solo con un mouse vero (onMouseEffectsChange): col dito un anello che
 * inseguisce il tocco è solo un ritardo visibile.
 */
function StaffCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let raf = 0
    let stop: (() => void) | null = null
    const at = { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    const tick = () => {
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`
      at.x = lerp(at.x, pointer.x, 0.18)
      at.y = lerp(at.y, pointer.y, 0.18)
      ring.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    /* Lo stato sta sul contenitore e non sul body: è quello che nasconde il
       cursore di sistema, e deve smettere di valere appena si esce da /staff. */
    const shell = dot.closest('.lm-staff') as HTMLElement | null

    const unsubscribe = onMouseEffectsChange((enabled) => {
      if (enabled && !stop) {
        stop = trackPointer()
        shell?.setAttribute('data-cursor-on', 'true')
        raf = requestAnimationFrame(tick)
      } else if (!enabled && stop) {
        cancelAnimationFrame(raf)
        stop()
        stop = null
        shell?.removeAttribute('data-cursor-on')
      }
    })

    return () => {
      unsubscribe()
      cancelAnimationFrame(raf)
      stop?.()
      shell?.removeAttribute('data-cursor-on')
    }
  }, [])

  return (
    <>
      <div className="lm-staff-cur" ref={dotRef} aria-hidden="true" />
      <div className="lm-staff-cur-ring" ref={ringRef} aria-hidden="true" />
    </>
  )
}
