'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  BarChart3,
  Bot,
  BookOpen,
  CalendarCheck,
  Contact,
  FlaskConical,
  FolderKanban,
  Kanban,
  LogOut,
  Menu,
  MapPinned,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import Salat from '@/components/staff/Salat'
import { Toggle } from '@/components/staff/Controls'
import { impostaDemo } from '@/lib/staff/actions'
import { iniziali } from '@/lib/staff/avatar'
import {
  FASE_VIVA,
  GRUPPO_LABEL,
  HREF_IMPOSTAZIONI,
  activeHref,
  navPerGruppi,
  visibleNav,
  type StaffNavItem,
} from '@/lib/staff/nav'
import type { StaffProfile } from '@/lib/staff/types'

/**
 * La struttura dell'area staff: dove sei, dove puoi andare, chi sei.
 *
 * Il rail di ref4 — **una barra nera dentro il pannello di vetro** — ma non più
 * una colonna di sole icone. Undici pittogrammi senza etichetta sono leggibili
 * per chi li ha disegnati e un rebus per chiunque altro: la barra si **apre al
 * passaggio del mouse** e dice i nomi, e chi la vuole sempre aperta la blocca.
 *
 * **L'apertura non sposta il contenuto.** La barra nera è posizionata in modo
 * assoluto dentro un segnaposto largo 74px: allargandosi passa *sopra* la
 * pagina invece di spingerla. Sono due guadagni in uno — il testo che si stava
 * leggendo non scappa da sotto gli occhi mentre il mouse attraversa la barra,
 * e la larghezza che cresce non rimette in coda il layout delle dodici card
 * accanto a ogni fotogramma. Il caso «bloccata», che invece deve spostare il
 * contenuto, è l'unico in cui il segnaposto si allarga davvero: succede una
 * volta, al clic, e un layout al clic non lo vede nessuno.
 *
 * **Il tooltip resta**, e ha ancora un compito: l'apertura ha 150ms di ritardo,
 * quindi puntando un'icona il nome compare *prima* che la barra si apra, e sotto
 * le dita o da tastiera — dove l'apertura al passaggio non c'è — è l'unica cosa
 * che dice a cosa serve quell'icona.
 *
 * Su telefono niente rail: la pill flottante in basso di ref1, in vetro, con
 * **l'etichetta sotto l'icona** e non accanto — di fianco stavano in cinque su
 * uno schermo da 375px solo perché la barra scorreva, cioè la quinta voce
 * esisteva ma non si vedeva.
 */

const ICONS: Record<string, LucideIcon> = {
  /* Un'icona per voce, e ognuna dice il *contenuto* della pagina e non una
     categoria generica. Prima Oggi era un sole (che vuol dire «giorno», non
     «cosa devo fare»), Clienti e Team erano **la stessa** icona `Users`, e sia
     Lab AI sia Ricerca Agent erano `Bot`: tre coppie identiche in una barra di
     undici voci, che è il modo più rapido di rendere inutili le icone. */
  '/staff': CalendarCheck,
  '/staff/pipeline': Kanban,
  '/staff/clienti': Contact,
  '/staff/campo': MapPinned,
  '/staff/soldi': Wallet,
  '/staff/progetti': FolderKanban,
  '/staff/statistiche': BarChart3,
  '/staff/team': Users,
  '/staff/risorse': BookOpen,
  '/staff/lab-ai': Sparkles,
  '/staff/agent': Bot,
}

/** Il rail bloccato aperto: è una preferenza del dispositivo, non dell'account. */
const CHIAVE_RAIL = 'lm_rail_fisso'

export default function StaffShell({
  me,
  foto,
  demo,
  anteprima,
  children,
}: {
  me: StaffProfile
  /** L'URL firmato della foto profilo, o null: le iniziali sono il fallback. */
  foto: string | null
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
  const gruppi = navPerGruppi(vive)
  const tabs = vive.filter((i) => i.mobile)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { fisso, blocca, aperto, apri, chiudi } = useRail()
  const { attesa, parti } = useAttesa(pathname)

  /* Il pannello si chiude da sé al cambio pagina: lasciarlo aperto sopra la
     pagina appena aperta è il classico modo di sembrare rotti. */
  useEffect(() => setSheetOpen(false), [pathname])

  const espanso = fisso || aperto

  return (
    <div className="lm-staff-shell">
      <header className="lm-staff-top">
        <Link href="/staff" className="lm-staff-brand" aria-label="Lumino Staff">
          <Wordmark />
          <span className="lm-staff-tag">Staff</span>
        </Link>
        <Link href={HREF_IMPOSTAZIONI} aria-label="Le mie impostazioni">
          <Avatar nome={me.nome} foto={foto} size="sm" />
        </Link>
      </header>

      <div className="lm-glass">
        <nav
          className="lm-staff-rail"
          aria-label="Sezioni"
          data-esp={espanso}
          data-fisso={fisso}
          onPointerEnter={apri}
          onPointerLeave={chiudi}
        >
          <div className="lm-rail-inner">
            <div className="lm-rail-head">
              <Link href="/staff" className="lm-rail-mark" aria-label="Lumino Staff">
                L<span>I</span>
              </Link>
              {/* Il bottone del blocco compare solo a barra aperta: a barra
                  chiusa sarebbe una dodicesima icona da interpretare, e per
                  premerla bisogna comunque avere il mouse lì sopra. */}
              <button
                type="button"
                className="lm-rail-pin"
                aria-pressed={fisso}
                onClick={blocca}
                title={fisso ? 'Lascia che si chiuda' : 'Tieni la barra aperta'}
              >
                {fisso ? <PanelLeftClose aria-hidden="true" /> : <PanelLeftOpen aria-hidden="true" />}
                <span className="lm-sr">
                  {fisso ? 'Lascia che la barra si chiuda' : 'Tieni la barra aperta'}
                </span>
              </button>
            </div>

            <div className="lm-rail-body">
              {gruppi.map((g, gi) => (
                <div key={g.gruppo} className="lm-rail-group">
                  {/* Il separatore sta *sopra* il gruppo e non sotto, così il
                      primo blocco non ne ha uno appeso sotto il marchio. */}
                  {gi > 0 && <span className="lm-rail-sep" aria-hidden="true" />}
                  <span className="lm-rail-group-label" aria-hidden="true">
                    {GRUPPO_LABEL[g.gruppo]}
                  </span>
                  {g.voci.map((item, i) => (
                    <Voce
                      key={item.href}
                      item={item}
                      attiva={active === item.href}
                      attesa={attesa === item.href}
                      indice={i}
                      parti={parti}
                    />
                  ))}
                </div>
              ))}

              {future.length > 0 && (
                <div className="lm-rail-group">
                  <span className="lm-rail-sep" aria-hidden="true" />
                  <Prossime items={future} />
                </div>
              )}
            </div>

            <span className="lm-rail-spacer" />

            {/* Il piede: chi sono, le mie impostazioni, l'uscita. A barra aperta
                la foto porta con sé nome e ruolo, che è l'unica informazione di
                tutta la schermata che dice con quale account si è entrati. */}
            <div className="lm-rail-foot">
              {me.role === 'admin' && <InterruttoreDemo acceso={demo} />}
              <span className="lm-rail-sep" aria-hidden="true" />

              <Link
                href={HREF_IMPOSTAZIONI}
                className="lm-staff-link lm-rail-me"
                aria-current={pathname.startsWith(HREF_IMPOSTAZIONI) ? 'page' : undefined}
              >
                <Avatar nome={me.nome} foto={foto} size="rail" />
                <span className="lm-rail-label" style={sfasa(0)}>
                  <b>{me.nome}</b>
                  <small>{me.ruolo_titolo ?? (me.role === 'admin' ? 'Amministratore' : 'Venditore')}</small>
                </span>
                <span className="lm-tip">
                  <b>{me.nome}</b>
                  {me.ruolo_titolo ?? (me.role === 'admin' ? 'Amministratore' : 'Venditore')}
                </span>
              </Link>

              <form action="/staff/logout" method="post">
                <button type="submit" className="lm-staff-link" aria-label="Esci">
                  <LogOut aria-hidden="true" />
                  <span className="lm-rail-label" style={sfasa(1)}>
                    Esci
                  </span>
                  <span className="lm-tip">Esci</span>
                </button>
              </form>
            </div>
          </div>
        </nav>

        {/* Il filo parte al clic e muore quando la pagina è arrivata. Sta qui
            dentro e non nella testata perché il pannello di vetro è il pezzo che
            cambia contenuto: l'avanzamento deve stare sul bordo di ciò che si
            sta sostituendo. */}
        {attesa && <span className="lm-nav-filo" aria-hidden="true" />}

        <main className="lm-staff-main">
          {anteprima && (
            <p className="lm-anteprima">Anteprima di sviluppo · dati finti · sola lettura</p>
          )}

          {/* Il widget della preghiera vive nella shell e non in una pagina: si
              deve vedere da tutta l'area, ed è **montato una volta sola** — due
              istanze nascoste a vicenda da un media query sarebbero due conti
              alla rovescia che battono insieme e due notifiche per ogni orario.
              Sta **fuori** da `PageEnter`, che ha `key={pathname}` e quindi si
              rimonta a ogni navigazione: dentro, il widget si ricostruirebbe da
              zero a ogni cambio pagina e ricomincerebbe a cercare la posizione.

              Ed è **nel flusso**, prima possibile nella colonna del contenuto.
              Prima era in posizione assoluta in alto a destra della shell, cioè
              sopra il titolo della pagina e sopra i bottoni della testata: un
              elemento che galleggia sopra gli altri senza appartenere a niente.
              Qui occupa una riga sua, allineata al bordo destro del contenuto —
              la stessa riga su cui stanno le azioni delle pagine — e non copre
              nulla, su nessuna larghezza. */}
          <div className="lm-shell-salat">
            <Salat />
          </div>

          <PageEnter key={pathname}>{children}</PageEnter>
        </main>
      </div>

      <nav className="lm-staff-dock" aria-label="Sezioni">
        {tabs.map((item) => {
          const Icon = ICONS[item.href] ?? Kanban
          return (
            <Link
              key={item.href}
              href={item.href}
              className="lm-staff-tab"
              aria-current={active === item.href ? 'page' : undefined}
              data-attesa={attesa === item.href || undefined}
              onClick={() => parti(item.href)}
            >
              <Icon aria-hidden="true" />
              <span>{item.short}</span>
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
          <span>Altro</span>
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
                const Icon = ICONS[item.href] ?? Kanban
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
              <Link href={HREF_IMPOSTAZIONI} className="lm-sheet-item">
                <Settings aria-hidden="true" />
                Impostazioni
              </Link>
            </div>

            {me.role === 'admin' && (
              <div style={{ marginTop: '1rem' }}>
                <InterruttoreDemo acceso={demo} esteso />
              </div>
            )}

            <div className="lm-modal-actions">
              <span className="lm-muted" style={{ marginRight: 'auto', fontSize: '0.82rem' }}>
                {me.nome} · {me.ruolo_titolo ?? (me.role === 'admin' ? 'Amministratore' : 'Venditore')}
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

/**
 * Lo stato della barra.
 *
 * `fisso` è la preferenza, e sta in `localStorage` perché è del dispositivo:
 * sul portatile da 13" la si tiene chiusa, sul monitor grande aperta, e la stessa
 * persona vuole le due cose diverse nello stesso giorno. Si legge dentro un
 * effetto e non durante il render — il server non ha `localStorage`, e leggerlo
 * mentre si disegna darebbe due HTML diversi e un errore di idratazione.
 *
 * `aperto` è il passaggio del mouse, con **150ms di ritardo in apertura**: senza,
 * il rail si spalanca ogni volta che il puntatore lo sfiora andando altrove, che
 * è il difetto di tutte le barre che si aprono da sole. In chiusura nessun
 * ritardo — uscendo, si vuole che si chiuda subito.
 */
function useRail() {
  const [fisso, setFisso] = useState(false)
  const [aperto, setAperto] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    try {
      setFisso(localStorage.getItem(CHIAVE_RAIL) === '1')
    } catch {
      /* Finestra privata o storage negato: la barra parte chiusa, e si apre
         comunque al passaggio. */
    }
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  const blocca = useCallback(() => {
    setFisso((prima) => {
      const dopo = !prima
      try {
        localStorage.setItem(CHIAVE_RAIL, dopo ? '1' : '0')
      } catch {
        /* vedi sopra */
      }
      return dopo
    })
  }, [])

  const apri = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAperto(true), 150)
  }, [])

  const chiudi = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    setAperto(false)
  }, [])

  return { fisso, blocca, aperto, apri, chiudi }
}

/**
 * La navigazione in corso.
 *
 * Next 14 non ha un modo di chiedere al router «stai andando da qualche parte?»
 * — `useLinkStatus` arriva dopo — quindi la destinazione la si segna da sé al
 * clic e la si cancella quando `pathname` diventa quella. Non è una stima: il
 * clic è l'inizio vero e il cambio di `pathname` è la fine vera.
 *
 * Serve perché senza di lui, per tutti i millisecondi che il server passa a
 * interrogare Supabase, l'unica voce accesa è quella che si sta **lasciando**:
 * lo schermo continua a dire di essere sulla pagina di prima, che è il motivo
 * per cui si riclicca. Con questo, la voce puntata si accende nel fotogramma
 * del clic.
 *
 * Il timeout di sicurezza non è pignoleria: se una navigazione fallisce — rete
 * caduta, `redirect()` verso il login — `pathname` non cambia mai e la voce
 * resterebbe accesa per sempre su una pagina dove non si è andati. Dopo otto
 * secondi si spegne e lo schermo torna a dire il vero.
 */
function useAttesa(pathname: string) {
  const [attesa, setAttesa] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    setAttesa(null)
  }, [pathname])

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  const parti = useCallback(
    (href: string) => {
      if (href === pathname) return
      setAttesa(href)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setAttesa(null), 8000)
    },
    [pathname],
  )

  return { attesa, parti }
}

/** Una voce del rail: icona, etichetta che entra, tooltip per quando è chiusa. */
function Voce({
  item,
  attiva,
  attesa,
  indice,
  parti,
}: {
  item: StaffNavItem
  attiva: boolean
  /** Il clic è partito e la pagina non è ancora arrivata. */
  attesa: boolean
  indice: number
  parti: (href: string) => void
}) {
  const Icon = ICONS[item.href] ?? Kanban
  return (
    <Link
      href={item.href}
      className="lm-staff-link"
      aria-current={attiva ? 'page' : undefined}
      data-attesa={attesa || undefined}
      onClick={() => parti(item.href)}
    >
      <Icon aria-hidden="true" />
      <span className="lm-rail-label" style={sfasa(indice)}>
        {item.label}
      </span>
      <span className="lm-tip">{item.label}</span>
    </Link>
  )
}

/**
 * Le etichette non entrano tutte insieme.
 *
 * Dodici parole che compaiono nello stesso fotogramma sono un blocco di testo
 * che lampeggia; le stesse dodici sfasate di 18ms sono una barra che si apre.
 * Il ritardo va in una variabile CSS e non in un `transition-delay` inline:
 * così la regola di `prefers-reduced-motion` nel foglio di stile può azzerarlo
 * tutto in un colpo, cosa che uno stile inline non permetterebbe.
 */
function sfasa(i: number): React.CSSProperties {
  return { '--i': i } as React.CSSProperties
}

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
 * La faccia, o le iniziali.
 *
 * `<img>` e non `next/image`: l'indirizzo è un URL firmato che scade in sei ore,
 * quindi l'ottimizzatore di Next lo metterebbe nella sua cache con una chiave
 * che cambia a ogni firma — cioè ri-scaricherebbe e ri-comprimerebbe la stessa
 * foto ogni volta, e la terrebbe nella cache come immagine pubblica. Una foto
 * già ridotta a 512px non ha niente da guadagnare da quel passaggio.
 *
 * `onError` torna alle iniziali: una firma scaduta mentre la pagina è aperta
 * lascerebbe altrimenti un rettangolo rotto al posto della faccia.
 */
function Avatar({
  nome,
  foto,
  size,
}: {
  nome: string
  foto: string | null
  size: 'sm' | 'rail' | 'lg'
}) {
  const [rotta, setRotta] = useState(false)
  const mostra = foto && !rotta

  return (
    <span className="lm-avatar" data-size={size} data-foto={Boolean(mostra)}>
      {mostra ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={foto} alt="" onError={() => setRotta(true)} />
      ) : (
        <span aria-hidden="true">{iniziali(nome)}</span>
      )}
    </span>
  )
}

/**
 * Le sezioni future, dietro una sola icona.
 *
 * La promessa c'è ancora — serve a sapere che la sezione è prevista e in quale
 * fase — ma non occupa metà del menù.
 */
function Prossime({ items }: { items: StaffNavItem[] }) {
  return (
    <span className="lm-staff-link" tabIndex={0} role="button" aria-label="Sezioni in arrivo">
      <MoreHorizontal aria-hidden="true" />
      <span className="lm-rail-label" style={sfasa(0)}>
        In arrivo
      </span>
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
 * Nel rail è un bottone che si accende e non un interruttore a scorrimento: in
 * una barra di icone la cosa giusta è un'icona, e `aria-pressed` dice a un
 * lettore di schermo esattamente ciò che uno stato acceso/spento vuol dire.
 * L'interruttore vero resta nel pannello «Altro» del telefono, dove c'è spazio
 * per l'etichetta accanto.
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
      <span className="lm-rail-label" style={sfasa(0)}>
        Dati demo
      </span>
      <span className="lm-tip">{acceso ? 'Dati demo accesi' : 'Dati demo spenti'}</span>
    </button>
  )
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
