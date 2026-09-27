'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Banknote,
  Bot,
  BookOpen,
  Folder,
  LayoutGrid,
  MapPin,
  Menu,
  PieChart,
  Sparkles,
  Sun,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import Wordmark from '@/components/home/Wordmark'
import { gsap, prefersReducedMotion } from '@/components/home/useMotion'
import { activeHref, visibleNav, type StaffNavItem } from '@/lib/staff/nav'
import type { StaffProfile } from '@/lib/staff/types'

/**
 * La struttura dell'area staff: dove sei, dove puoi andare, chi sei.
 *
 * Due navigazioni per lo stesso elenco, non due elenchi:
 *  · da 960px in su una sidebar in glass a sinistra, con la voce attiva su un
 *    gradiente morbido (ref3);
 *  · sotto, una pill flottante in basso, in glass (ref2). In basso e non in
 *    alto perché la dashboard si usa camminando, con una mano, e il pollice
 *    non arriva in cima allo schermo.
 *
 * Il movimento qui fa una cosa sola: dire che la pagina è cambiata. Niente
 * scroll animato (in una lista di lavoro è un intralcio) e niente entrate
 * lunghe: 0.4s e via.
 */

const ICONS: Record<string, LucideIcon> = {
  '/staff': Sun,
  '/staff/pipeline': LayoutGrid,
  '/staff/clienti': Users,
  '/staff/campo': MapPin,
  '/staff/soldi': Banknote,
  '/staff/progetti': Folder,
  '/staff/statistiche': PieChart,
  '/staff/team': Users,
  '/staff/risorse': BookOpen,
  '/staff/lab-ai': Sparkles,
  '/staff/agent': Bot,
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
      <header className="lm-staff-top">
        <Link href="/staff" className="lm-staff-brand" aria-label="Lumino Staff">
          <Wordmark animated={false} />
          <span className="lm-staff-tag">Staff</span>
        </Link>
        <span className="lm-staff-avatar" aria-hidden="true">
          {iniziale(me.nome)}
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
          <span className="lm-staff-avatar" aria-hidden="true">
            {iniziale(me.nome)}
          </span>
          <span>
            <strong>{me.nome}</strong>
            {me.role === 'admin' ? 'Amministratore' : 'Venditore'}
          </span>
          <LogoutButton />
        </div>
      </nav>

      <main className="lm-staff-main">
        <PageEnter key={pathname}>{children}</PageEnter>
      </main>

      <nav className="lm-staff-dock" aria-label="Sezioni">
        {tabs.map((item) => {
          const Icon = ICONS[item.href] ?? LayoutGrid
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
            <span className="lm-label">Tutte le sezioni</span>
            <div className="lm-staff-nav">
              {items
                .filter((item) => !item.mobile)
                .map((item) => (
                  <NavLink key={item.href} item={item} active={active} />
                ))}
            </div>
            <div className="lm-staff-me">
              <span className="lm-staff-avatar" aria-hidden="true">
                {iniziale(me.nome)}
              </span>
              <span>
                <strong>{me.nome}</strong>
                {me.role === 'admin' ? 'Amministratore' : 'Venditore'}
              </span>
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
  const Icon = ICONS[item.href] ?? LayoutGrid
  return (
    <Link
      href={item.href}
      className="lm-staff-link"
      data-soon={soon}
      aria-current={active === item.href ? 'page' : undefined}
    >
      <Icon aria-hidden="true" />
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

function iniziale(nome: string): string {
  return nome.trim().charAt(0).toUpperCase()
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
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform' },
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
