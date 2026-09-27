'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Banknote,
  Bot,
  BookOpen,
  Folder,
  LayoutGrid,
  LogOut,
  MapPin,
  FlaskConical,
  Menu,
  MoreHorizontal,
  PieChart,
  Sun,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Toggle } from '@/components/staff/Controls'
import { impostaDemo } from '@/lib/staff/actions'
import { FASE_VIVA, activeHref, visibleNav, type StaffNavItem } from '@/lib/staff/nav'
import type { StaffProfile } from '@/lib/staff/types'

/**
 * La struttura dell'area staff: dove sei, dove puoi andare, chi sei.
 *
 * Il rail di ref4: **una barra nera stretta dentro il pannello di vetro**, con
 * sole icone. Nera perché è l'unico elemento sempre presente, e in una
 * composizione tutta chiara serve un punto fermo scuro che la tenga insieme;
 * stretta perché le etichette le dice al passaggio, e una dashboard usata ogni
 * giorno impara le sue sette icone in due giorni.
 *
 * **Le sezioni non ancora costruite non fanno una lista.** Prima erano sette
 * voci spente con scritto "in arrivo" accanto: un menù per metà di promesse fa
 * sembrare incompiuto anche quello che c'è. Ora stanno dietro l'ultima icona,
 * che le elenca solo a chi va a cercarle.
 *
 * Su telefono niente rail: la pill flottante in basso di ref1, in vetro, dove
 * arriva il pollice.
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
  '/staff/lab-ai': Bot,
  '/staff/agent': Bot,
}

export default function StaffShell({
  me,
  demo,
  anteprima,
  children,
}: {
  me: StaffProfile
  /** L'interruttore dei dati finti, già risolto dal server. */
  demo: boolean
  /** Si sta guardando l'anteprima di sviluppo, non l'area vera. */
  anteprima: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? '/staff'
  const active = activeHref(pathname)
  const items = visibleNav(me.role === 'admin')
  const vive = items.filter((i) => i.fase <= FASE_VIVA)
  const future = items.filter((i) => i.fase > FASE_VIVA)
  const tabs = vive.filter((i) => i.mobile)
  const [sheetOpen, setSheetOpen] = useState(false)

  /* Il pannello si chiude da sé al cambio pagina: lasciarlo aperto sopra la
     pagina appena aperta è il classico modo di sembrare rotti. */
  useEffect(() => setSheetOpen(false), [pathname])

  return (
    <div className="lm-staff-shell">
      <header className="lm-staff-top">
        <Link href="/staff" className="lm-staff-brand" aria-label="Lumino Staff">
          <Wordmark />
          <span className="lm-staff-tag">Staff</span>
        </Link>
        <span className="lm-staff-avatar" aria-hidden="true">
          {iniziale(me.nome)}
        </span>
      </header>

      <div className="lm-glass">
        <nav className="lm-staff-rail" aria-label="Sezioni">
          <Link href="/staff" className="lm-rail-mark" aria-label="Lumino Staff">
            L<span>I</span>
          </Link>

          {vive.map((item) => {
            const Icon = ICONS[item.href] ?? LayoutGrid
            return (
              <Link
                key={item.href}
                href={item.href}
                className="lm-staff-link"
                aria-current={active === item.href ? 'page' : undefined}
              >
                <Icon aria-hidden="true" />
                <span className="lm-tip">{item.label}</span>
              </Link>
            )
          })}

          {future.length > 0 && <Prossime items={future} />}

          <span className="lm-rail-spacer" />

          {/* Il piede del rail: tre bersagli della stessa misura delle icone
              sopra, incolonnati sullo stesso asse. Prima l'avatar era un
              cerchio da 32px dentro un blocco da 44 e il logout un quadrato da
              32 senza contorno: due misure e due forme diverse in fondo a una
              colonna di quadrati da 42, che è esattamente il punto in cui una
              barra smette di sembrare costruita. */}
          <div className="lm-rail-foot">
            {me.role === 'admin' && <InterruttoreDemo acceso={demo} />}
            <span className="lm-rail-sep" aria-hidden="true" />
            <span className="lm-staff-link" data-static tabIndex={0} role="img" aria-label={me.nome}>
              <span className="lm-staff-avatar" aria-hidden="true">
                {iniziale(me.nome)}
              </span>
              <span className="lm-tip">
                <b>{me.nome}</b>
                {me.role === 'admin' ? 'Amministratore' : 'Venditore'}
              </span>
            </span>
            <form action="/staff/logout" method="post">
              <button type="submit" className="lm-staff-link" aria-label="Esci">
                <LogOut aria-hidden="true" />
                <span className="lm-tip">Esci</span>
              </button>
            </form>
          </div>
        </nav>

        <main className="lm-staff-main">
          {anteprima && (
            <p className="lm-anteprima">Anteprima di sviluppo · dati finti · sola lettura</p>
          )}
          <PageEnter key={pathname}>{children}</PageEnter>
        </main>
      </div>

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
            <div className="lm-sheet-grid">
              {items.map((item) => {
                const Icon = ICONS[item.href] ?? LayoutGrid
                const soon = item.fase > FASE_VIVA
                return (
                  <Link
                    key={item.href}
                    href={soon ? pathname : item.href}
                    className="lm-sheet-item"
                    data-soon={soon}
                    aria-disabled={soon}
                  >
                    <Icon aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {me.role === 'admin' && (
              <div style={{ marginTop: '1rem' }}>
                <InterruttoreDemo acceso={demo} esteso />
              </div>
            )}

            <div className="lm-modal-actions">
              <span className="lm-muted" style={{ marginRight: 'auto', fontSize: '0.82rem' }}>
                {me.nome} · {me.role === 'admin' ? 'Amministratore' : 'Venditore'}
              </span>
              <form action="/staff/logout" method="post">
                <button type="submit" className="lm-btn" data-variant="ghost">
                  Esci
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/** Il marchio: la I nel gradiente, come sul sito pubblico. */
function Wordmark() {
  return (
    <span className="lm-wm" aria-label="Lumino">
      <b>LUM</b>
      <b className="lm-wm-i">I</b>
      <b>NO</b>
    </span>
  )
}

/**
 * Le sezioni future, dietro una sola icona.
 *
 * La promessa c'è ancora — serve a sapere che la sezione è prevista e in quale
 * fase — ma non occupa più metà del menù.
 */
function Prossime({ items }: { items: StaffNavItem[] }) {
  return (
    <span className="lm-staff-link" tabIndex={0} role="button" aria-label="Sezioni in arrivo">
      <MoreHorizontal aria-hidden="true" />
      <span className="lm-tip" data-multi="true">
        <b>In arrivo</b>
        {items.map((i) => `${i.label} (fase ${i.fase})`).join(' · ')}
      </span>
    </span>
  )
}

/**
 * L'interruttore dei dati demo.
 *
 * Solo per l'admin, e spento di default. Sta nel rail e non in una pagina di
 * impostazioni perché serve esattamente mentre si guarda una schermata: si
 * accende, si vede com'è piena, si spegne.
 *
 * **Nel rail non è più un interruttore a scorrimento.** Lo era, con la sua
 * pista rimpicciolita a 34×20 da uno `style` inline mentre il pallino restava
 * quello da 21px del formato grande: il pallino usciva dal binario, e si vedeva.
 * Ma il difetto vero era prima di quello — un interruttore con la pista in mezzo
 * a una colonna di quadrati da 42px è l'unico oggetto di forma diversa di tutta
 * la barra, e in una barra di icone la cosa giusta è un'icona.
 *
 * Quindi qui è un bottone che si accende, con `aria-pressed` perché è
 * esattamente ciò che uno stato acceso/spento vuole dire per un lettore di
 * schermo. L'interruttore vero resta nel pannello «Altro» del telefono, dove
 * c'è spazio per l'etichetta accanto e la forma ha senso.
 */
function InterruttoreDemo({ acceso, esteso }: { acceso: boolean; esteso?: boolean }) {
  const router = useRouter()
  const [inCorso, avvia] = useTransition()

  function cambia(on: boolean) {
    avvia(async () => {
      await impostaDemo(on)
      router.refresh()
    })
  }

  if (esteso) return <Toggle label="Dati demo" checked={acceso} onChange={cambia} />

  return (
    <button
      type="button"
      className="lm-staff-link"
      data-on={acceso}
      aria-pressed={acceso}
      aria-label="Dati demo"
      disabled={inCorso}
      onClick={() => cambia(!acceso)}
    >
      <FlaskConical aria-hidden="true" />
      <span className="lm-tip">{acceso ? 'Dati demo accesi' : 'Dati demo spenti'}</span>
    </button>
  )
}

function iniziale(nome: string): string {
  return nome.trim().charAt(0).toUpperCase()
}

/**
 * L'entrata della pagina: sale di dieci pixel e mette a fuoco.
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

    let annullato = false
    import('@/components/home/useMotion').then(({ gsap, prefersReducedMotion }) => {
      const corrente = ref.current
      if (annullato || !corrente) return
      /* Come in Cascade: in una scheda nascosta rAF non gira e la
         dissolvenza resterebbe congelata a metà. */
      if (prefersReducedMotion() || document.visibilityState === 'hidden') {
        corrente.style.opacity = '1'
        return
      }
      /* Solo trasformazioni e opacità: il `filter: blur()` che c'era qui
         obbligava il browser a rasterizzare di nuovo l'intera pagina a ogni
         fotogramma del cambio pagina. Vedi il commento in Cascade. */
      gsap.fromTo(
        corrente,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform' },
      )
    })

    return () => {
      annullato = true
    }
  }, [])

  return (
    <div ref={ref} className="lm-staff-enter">
      {children}
    </div>
  )
}
