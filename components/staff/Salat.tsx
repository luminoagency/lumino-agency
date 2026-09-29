'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ospitePortale } from '@/lib/staff/portale'
import { Bell, BellOff, Check, Clock, MapPin, Moon, Search, Settings2, X } from 'lucide-react'
import { ayahDelGiro } from '@/lib/staff/ayat'
import {
  IMPOSTAZIONI_DEFAULT,
  MADHAB,
  METODI,
  NOME_ARABO,
  NOME_PREGHIERA,
  cercaCitta,
  chiediPosizione,
  cittaDaCoordinate,
  contoAllaRovescia,
  eApprossimativa,
  leggiImpostazioni,
  leggiPosizione,
  permessoNegato,
  posizioneDaIp,
  scriviImpostazioni,
  scriviPosizione,
  segnaNegato,
  stato as calcolaStato,
  type CittaTrovata,
  type ImpostazioniSalat,
  type Posizione,
  type Stato,
} from '@/lib/staff/salat'

/**
 * Il promemoria della preghiera.
 *
 * Vive nella shell, quindi si vede da ogni pagina dell'area. Chiuso è una pill:
 * la preghiera in corso, la prossima e quanto manca — le tre cose che si
 * guardano di sfuggita mentre si lavora. Aperto diventa un pannello con i cinque
 * orari, la città, un'ayah e le impostazioni.
 *
 * **Il calcolo è qui e non altrove**: `adhan` sono formule astronomiche, non
 * dati, quindi funziona offline e non ha un servizio che possa spegnersi. Vedi
 * `lib/staff/salat.ts`.
 *
 * **La posizione la prende da sé, e non resta mai su «dove siamo?».** Al primo
 * caricamento partono due cose insieme:
 *   · il ripiego dal server, che legge l'IP dalle intestazioni di Vercel e
 *     costa zero chiamate — gli orari ci sono entro il primo fotogramma utile,
 *     con scritto accanto da dove vengono;
 *   · la richiesta del permesso vera, con una riga di spiegazione sotto la pill
 *     mentre la finestra del browser è aperta.
 * Quando il GPS risponde, la sua posizione **sostituisce** il ripiego; se il
 * ripiego fosse arrivato dopo, non lo sovrascrive (`eApprossimativa`).
 *
 * La richiesta automatica si fa **una volta per dispositivo**: un rifiuto resta
 * segnato e da lì in poi si chiede la città a parole. Chiedere di nuovo a ogni
 * apertura è il modo più sicuro di farsi negare il permesso per sempre — che era
 * la ragione per cui prima non si chiedeva affatto. Il compromesso vero non è
 * «mai» ma «una volta, e poi si ricorda».
 */
export default function Salat() {
  const [imp, setImp] = useState<ImpostazioniSalat | null>(null)
  const [pos, setPos] = useState<Posizione | null>(null)
  /* `null` finché non si è letto localStorage: al primo render il server e il
     browser devono disegnare la stessa cosa, e il server non sa niente di
     questo dispositivo. Quella stessa cosa è: niente. */
  const [pronto, setPronto] = useState(false)
  const [aperto, setAperto] = useState(false)
  const [pannello, setPannello] = useState<'orari' | 'impostazioni'>('orari')
  const [adesso, setAdesso] = useState<number>(() => Date.now())
  const [giro, setGiro] = useState(0)
  const [dissolve, setDissolve] = useState(false)
  const [inCorso, setInCorso] = useState(false)
  /* La finestra del permesso è aperta in questo momento: sotto la pill compare
     una riga che dice perché. Dura quanto la finestra e non un millisecondo di
     più — una spiegazione che resta dopo la risposta è un avviso. */
  const [chiedendo, setChiedendo] = useState(false)

  const pillRef = useRef<HTMLButtonElement>(null)
  const pannelloRef = useRef<HTMLDivElement>(null)
  /* `document` non esiste sul server, e `createPortal` lo pretende: si disegna
     solo dopo il primo montaggio. Il pannello è chiuso al primo render in ogni
     caso, quindi non si perde niente. */
  const montato = useMontato()
  const ancora = useAncora(aperto, pillRef)
  /* Stabile, non una lambda nuova a ogni render: sta nelle dipendenze di un
     effetto che aggiunge due ascoltatori al `document`, e una funzione nuova a
     ogni fotogramma del conto alla rovescia vorrebbe dire staccarli e
     riattaccarli una volta al secondo. */
  const chiudiPannello = useCallback(() => setAperto(false), [])
  useChiusura(aperto, chiudiPannello, pillRef, pannelloRef)

  /* ── avvio ─────────────────────────────────────────────────────────────── */
  /**
   * Due strade in parallelo, e la più precisa vince.
   *
   * Il vecchio avvio faceva una cosa sola: se il permesso era **già** concesso
   * rinfrescava la posizione, altrimenti restava sul messaggio «dove siamo?»
   * finché qualcuno non apriva il pannello e premeva un bottone. Il risultato
   * era un widget che per la maggior parte delle persone non diceva mai un
   * orario.
   *
   * Adesso:
   *   · il ripiego dal server parte subito e solo se non c'è niente di salvato —
   *     non è una chiamata a un servizio di geolocalizzazione, è un'intestazione
   *     HTTP che Vercel ha già riempito, quindi arriva in una ventina di
   *     millisecondi e gli orari compaiono di fatto insieme alla pagina;
   *   · il permesso si chiede una volta, con la spiegazione sotto la pill.
   *
   * L'ordine di arrivo non è garantito, quindi nessuno dei due sovrascrive alla
   * cieca: `eApprossimativa` dice quali posizioni si possono rimpiazzare (quelle
   * da IP e il ripiego) e quali no (il GPS e la città scelta a mano).
   */
  useEffect(() => {
    const impostazioni = leggiImpostazioni()
    const salvata = leggiPosizione()
    setImp(impostazioni)
    setPos(salvata)
    setPronto(true)

    if (!impostazioni.attivo) return

    let annullato = false

    /* 1. Il ripiego, solo a mani vuote. Con una posizione salvata — anche
          approssimativa — rifarlo a ogni apertura sarebbe una richiesta al
          nostro server per un dato che è già nel localStorage. */
    if (!salvata) {
      void posizioneDaIp().then((ip) => {
        if (annullato || !ip) return
        setPos((prima) => {
          if (prima && !eApprossimativa(prima)) return prima
          scriviPosizione(ip)
          return ip
        })
      })
    }

    /* 2. Il GPS. */
    void (async () => {
      let stato: PermissionState | 'sconosciuto' = 'sconosciuto'
      try {
        const p = await navigator.permissions?.query({ name: 'geolocation' as PermissionName })
        stato = p?.state ?? 'sconosciuto'
      } catch {
        /* Safari vecchio non ha `permissions`: si prosegue come se fosse la
           prima volta, ed è il ramo `sconosciuto` qui sotto a decidere. */
      }
      if (annullato) return

      if (stato === 'denied') {
        /* Il browser lo sa già: non si chiede, e si segna per non riprovare
           nemmeno dopo che l'utente ha ripulito i permessi per sbaglio. */
        segnaNegato(true)
        return
      }

      if (stato === 'granted') {
        /* Permesso già dato: nessuna finestra, nessuna spiegazione, la
           posizione si rinfresca in silenzio. È così che la città cambia da sé
           cambiando posto. */
        await rilevaPosizione(true)
        return
      }

      /* Da qui è `prompt` o `sconosciuto`: la finestra comparirà. Si chiede una
         volta sola nella vita di questo dispositivo. */
      if (permessoNegato()) return
      if (salvata && !eApprossimativa(salvata)) return

      setChiedendo(true)
      const ok = await rilevaPosizione(true)
      if (annullato) return
      setChiedendo(false)
      /* Un rifiuto e un timeout arrivano identici da `getCurrentPosition`, e
         vanno trattati identici: in entrambi i casi non si insiste. Chi ha solo
         avuto una brutta connessione ha il bottone nelle impostazioni. */
      if (!ok) segnaNegato(true)
    })()

    return () => {
      annullato = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── il battito ────────────────────────────────────────────────────────── */
  /**
   * Un tick al secondo, e **solo** quando serve.
   *
   * Il conto alla rovescia è l'unica cosa viva del widget, quindi il timer è
   * l'unico costo continuo che questa dashboard paga: si spegne con il widget
   * spento, senza posizione, e quando la scheda passa in secondo piano. Lì il
   * browser strozza comunque i timer a uno al minuto, e un conto alla rovescia
   * che si aggiorna ogni minuto mentre nessuno guarda è lavoro buttato — al
   * ritorno si rimette a posto da sé, perché legge l'orologio e non un contatore
   * incrementale.
   */
  useEffect(() => {
    if (!imp?.attivo || !pos) return

    let id: number | null = null
    const avvia = () => {
      if (id !== null) return
      setAdesso(Date.now())
      id = window.setInterval(() => setAdesso(Date.now()), 1000)
    }
    const ferma = () => {
      if (id !== null) window.clearInterval(id)
      id = null
    }
    const visibilita = () => (document.visibilityState === 'visible' ? avvia() : ferma())

    visibilita()
    document.addEventListener('visibilitychange', visibilita)
    return () => {
      ferma()
      document.removeEventListener('visibilitychange', visibilita)
    }
  }, [imp?.attivo, pos])

  const st: Stato | null = useMemo(() => {
    if (!imp?.attivo || !pos) return null
    try {
      return calcolaStato(pos, imp, new Date(adesso))
    } catch {
      /* Coordinate impossibili salvate a mano, o una latitudine polare dove
         certi metodi non danno un Isha: meglio un widget che chiede di nuovo
         dove siamo che una schermata bianca. */
      return null
    }
  }, [imp, pos, adesso])

  /* ── la notifica ───────────────────────────────────────────────────────── */
  /**
   * All'entrata dell'orario: una notifica, e il widget che cambia stato.
   *
   * La memoria di «già avvisato» sta in `localStorage` e non in un ref, per due
   * ragioni: un ricaricamento della pagina due minuti dopo Dhuhr non deve
   * riavvisare, e se un giorno questo componente finisse montato due volte (la
   * pill del telefono e il pannello del desktop) la notifica resterebbe una.
   * La chiave è l'istante esatto della preghiera, quindi cambia da sé.
   */
  useEffect(() => {
    if (!imp?.attivo || !imp.notifiche || !st) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    const chiave = st.attuale.at.toISOString()
    /* Più di dieci minuti dopo l'entrata non si notifica: aprendo la dashboard
       alle quattro del pomeriggio non deve arrivare la notifica di Dhuhr. */
    if (Date.now() - st.attuale.at.getTime() > 600_000) return

    try {
      if (localStorage.getItem('lm_salat_avvisato') === chiave) return
      localStorage.setItem('lm_salat_avvisato', chiave)
    } catch {
      return
    }

    try {
      new Notification(`È l’ora di ${NOME_PREGHIERA[st.attuale.chiave]}`, {
        body: pos?.citta ? `${st.attuale.ora} · ${pos.citta}` : st.attuale.ora,
        tag: 'lm-salat',
        /* Nessun suono: la richiesta era esplicita, e una dashboard che suona in
           ufficio la si spegne il primo giorno. `silent` non è supportato
           dappertutto, ma dove non lo è il suono è quello di sistema, non uno
           nostro. */
        silent: true,
      })
    } catch {
      /* Su alcune piattaforme il costruttore lancia se la pagina non è in
         primo piano: la notifica salta, il widget cambia stato comunque. */
    }
  }, [imp?.attivo, imp?.notifiche, st, pos?.citta])

  /* ── l'ayah che gira ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!imp?.attivo || !imp.ayat) return
    const ms = Math.max(5, imp.intervalloAyah) * 60_000
    const id = window.setInterval(() => {
      /* Prima si sbiadisce, poi si cambia testo, poi si rientra: cambiare la
         stringa e la trasparenza nello stesso fotogramma si vede come un
         lampo, non come una dissolvenza. */
      setDissolve(true)
      window.setTimeout(() => {
        setGiro((g) => g + 1)
        setDissolve(false)
      }, 420)
    }, ms)
    return () => window.clearInterval(id)
  }, [imp?.attivo, imp?.ayat, imp?.intervalloAyah])

  /* ── azioni ────────────────────────────────────────────────────────────── */
  const salva = useCallback((patch: Partial<ImpostazioniSalat>) => {
    setImp((prima) => {
      const dopo = { ...(prima ?? IMPOSTAZIONI_DEFAULT), ...patch }
      scriviImpostazioni(dopo)
      return dopo
    })
  }, [])

  const rilevaPosizione = useCallback(async (silenzioso = false) => {
    if (!silenzioso) setInCorso(true)
    const coord = await chiediPosizione()
    if (!coord) {
      setInCorso(false)
      return false
    }
    /* Il nome della città vecchia non si porta dietro: con il ripiego da IP
       quel nome è «Venezia» mentre le coordinate nuove sono di Jesolo, e
       tenerlo vorrebbe dire scrivere sotto gli orari una città in cui non si è.
       Meglio nessun nome per il mezzo secondo che serve a Nominatim: gli orari,
       che sono la cosa che conta, sono già giusti. */
    const salvata: Posizione = { ...coord, citta: '', at: Date.now(), fonte: 'gps' }
    setPos(salvata)
    scriviPosizione(salvata)
    setInCorso(false)
    /* Il permesso c'è: se era stato negato in passato, quella memoria non vale
       più. Senza questa riga chi lo concede dopo averlo negato non si vedrebbe
       più rinfrescare la posizione da sé. */
    segnaNegato(false)

    const citta = await cittaDaCoordinate(coord.lat, coord.lng)
    if (citta) {
      const conNome = { ...salvata, citta }
      setPos(conNome)
      scriviPosizione(conNome)
    }
    return true
  }, [])

  const scegliCitta = useCallback((c: CittaTrovata) => {
    /* `scelta` è la fonte che nessuno sovrascrive: chi ha scritto «Padova» non
       vuole vedersi correggere dal telefono che è a Ponte di Brenta. */
    const salvata: Posizione = {
      lat: c.lat,
      lng: c.lng,
      citta: c.nome,
      at: Date.now(),
      fonte: 'scelta',
    }
    setPos(salvata)
    scriviPosizione(salvata)
  }, [])

  const chiediNotifiche = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    try {
      await Notification.requestPermission()
      /* Un re-render per aggiornare la riga del permesso: `Notification.permission`
         non è uno stato React e non fa scattare niente da sé. */
      setAdesso(Date.now())
    } catch {
      /* Firefox lancia se la richiesta non parte da un gesto: qui parte da un
         clic, ma su una versione vecchia può comunque rifiutare. */
    }
  }, [])

  if (!pronto || !imp?.attivo) return null

  const ayah = ayahDelGiro(giro)
  /* Quindici minuti: la soglia oltre la quale la pill diventa nera. Non è
     decorazione — è l'unico momento in cui quel widget ha qualcosa di urgente da
     dire, e il nero è l'accento di questa interfaccia. Il resto del tempo resta
     vetro, come gli altri controlli. */
  const vicina = Boolean(st && st.mancano <= 900)

  const corpo = (
    <div
      className="lm-salat-panel"
      role="dialog"
      aria-label="Orari della preghiera"
      ref={pannelloRef}
      style={ancora ? { top: ancora.top, right: ancora.right } : undefined}
    >
          <div className="lm-salat-head">
            <span className="lm-label">
              {pos?.citta ? (
                <>
                  <MapPin aria-hidden="true" /> {pos.citta}
                  {/* Da dove viene la posizione, quando non è precisa. Un orario
                      di preghiera con due minuti di errore e un orario esatto si
                      scrivono uguali: se non si dice quale dei due è, si finisce
                      per fidarsi di quello sbagliato. «circa» è tutto lo spazio
                      che serve per dirlo, e il bottone per correggerlo è nelle
                      impostazioni accanto. */}
                  {eApprossimativa(pos) && <em className="lm-salat-circa">circa</em>}
                </>
              ) : (
                'Orari della preghiera'
              )}
            </span>
            <span className="lm-salat-head-azioni">
              <button
                type="button"
                className="lm-salat-icona"
                aria-pressed={pannello === 'impostazioni'}
                aria-label="Impostazioni del widget"
                onClick={() => setPannello((p) => (p === 'orari' ? 'impostazioni' : 'orari'))}
              >
                <Settings2 aria-hidden="true" />
              </button>
              <button
                type="button"
                className="lm-salat-icona"
                aria-label="Chiudi"
                onClick={() => setAperto(false)}
              >
                <X aria-hidden="true" />
              </button>
            </span>
          </div>

          {pannello === 'impostazioni' ? (
            <Impostazioni
              imp={imp}
              salva={salva}
              chiediNotifiche={chiediNotifiche}
              cittaCorrente={pos?.citta ?? ''}
              scegliCitta={scegliCitta}
              rileva={() => rilevaPosizione()}
              inCorso={inCorso}
            />
          ) : st ? (
            <>
              <p className="lm-salat-adesso">
                Adesso <b>{NOME_PREGHIERA[st.attuale.chiave]}</b>
                <span className="lm-salat-ar">{NOME_ARABO[st.attuale.chiave]}</span>
              </p>

              <ul className="lm-salat-lista">
                {st.oggi.map((o) => {
                  const passata = o.at.getTime() <= adesso
                  return (
                    <li
                      key={o.chiave}
                      data-stato={
                        o.chiave === st.prossima.chiave
                          ? 'prossima'
                          : o.chiave === st.attuale.chiave
                            ? 'attuale'
                            : passata
                              ? 'passata'
                              : 'futura'
                      }
                    >
                      <span className="lm-salat-nome">
                        {NOME_PREGHIERA[o.chiave]}
                        <small>{NOME_ARABO[o.chiave]}</small>
                      </span>
                      <span className="lm-salat-t">{o.ora}</span>
                    </li>
                  )
                })}
              </ul>

              {imp.ayat && (
                <figure className="lm-ayah" data-fade={dissolve}>
                  <p className="lm-ayah-ar" lang="ar" dir="rtl">
                    {ayah.parziale && <span aria-hidden="true">…</span>}
                    {ayah.ar}
                  </p>
                  <blockquote className="lm-ayah-it">
                    {ayah.parziale && '…'}
                    {ayah.it}
                  </blockquote>
                  <figcaption>
                    {ayah.sura} {ayah.rif}
                  </figcaption>
                </figure>
              )}
            </>
          ) : (
            <Dove
              rileva={() => rilevaPosizione()}
              scegliCitta={scegliCitta}
              inCorso={inCorso}
              negato={permessoNegato()}
            />
          )}
    </div>
  )

  return (
    <div className="lm-salat" data-aperto={aperto}>
      <button
        ref={pillRef}
        type="button"
        className="lm-salat-pill"
        data-vicina={vicina || undefined}
        aria-expanded={aperto}
        onClick={() => setAperto((v) => !v)}
      >
        {st ? (
          <>
            {/* Il punto pulsa solo quando la preghiera è vicina. Un indicatore
                che batte sempre non indica più niente: è l'animazione di fondo
                di un pannello, cioè esattamente ciò che questa interfaccia non
                vuole essere. Il resto del tempo è una luna ferma. */}
            {vicina ? (
              <span className="lm-salat-punto" aria-hidden="true" />
            ) : (
              <Moon aria-hidden="true" />
            )}
            <span className="lm-salat-pill-testo">
              <b>{NOME_PREGHIERA[st.prossima.chiave]}</b>
              <small>fra {contoAllaRovescia(st.mancano)}</small>
            </span>
            <span className="lm-salat-ora">{st.prossima.ora}</span>
          </>
        ) : (
          <>
            <Clock aria-hidden="true" />
            <span className="lm-salat-pill-testo">
              <b>Orari preghiera</b>
              {/* Tre stati diversi, tre frasi diverse. «dove siamo?» era una
                  domanda a cui l'utente non poteva rispondere da lì, e restava
                  scritta anche mentre il widget stava già cercando. */}
              <small>{chiedendo ? 'consenti la posizione' : inCorso ? 'cerco…' : 'scegli la città'}</small>
            </span>
          </>
        )}
      </button>

      {/* La spiegazione breve, sotto la pill e solo mentre la finestra del
          permesso è aperta. Sta qui e non dentro il pannello perché il pannello
          in quel momento è chiuso, e una spiegazione che compare dopo la
          risposta non spiega niente. */}
      {chiedendo && (
        <p className="lm-salat-spiega" role="status">
          Serve la posizione per calcolare gli orari esatti. Resta sul dispositivo.
        </p>
      )}

      {/* Il pannello esce dal flusso e va in fondo al body.
          Non è un vezzo: il pannello di vetro della shell ha `overflow-y: auto`
          sulla colonna del contenuto, e un elemento in posizione assoluta dentro
          un contenitore che scorre viene **tagliato** dal suo bordo — il menù si
          sarebbe aperto a metà. Portato sul body e messo in posizione fissa
          rispetto alla pill, si apre dove deve e non allunga l'area di
          scorrimento della pagina sotto. */}
      {aperto && montato && createPortal(corpo, ospitePortale() ?? document.body)}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/** Il primo montaggio è avvenuto: da qui `document` esiste. */
function useMontato(): boolean {
  const [montato, setMontato] = useState(false)
  useEffect(() => setMontato(true), [])
  return montato
}

/**
 * Dove disegnare il pannello, in coordinate di finestra.
 *
 * Il pannello è figlio del `body` (vedi il commento sul portale) quindi la sua
 * posizione non può venire dal CSS: la si misura dalla pill. `useLayoutEffect` e
 * non `useEffect` perché la misura deve essere pronta **prima** che il browser
 * disegni, altrimenti il pannello compare per un fotogramma in alto a sinistra e
 * poi salta al suo posto.
 *
 * Si riallinea allo scorrimento e al ridimensionamento. Il `true` in
 * `addEventListener('scroll', …)` è la fase di cattura, e serve: la colonna del
 * contenuto scorre per conto suo e i suoi eventi di scorrimento **non salgono**
 * fino a `window`. Senza quel terzo argomento il pannello resterebbe appeso in
 * aria mentre la pagina sotto scorre.
 *
 * Si ancora al bordo destro e non al sinistro perché la pill sta a destra: con
 * `left` un pannello più largo della pill uscirebbe dallo schermo, con `right`
 * cresce verso l'interno. Gli 8px di minimo sono il margine oltre il quale non
 * si va, per il caso in cui la pill sia quasi a filo del bordo.
 */
function useAncora(aperto: boolean, rif: React.RefObject<HTMLElement>) {
  const [ancora, setAncora] = useState<{ top: number; right: number } | null>(null)

  useLayoutEffect(() => {
    if (!aperto) {
      setAncora(null)
      return
    }
    const misura = () => {
      const el = rif.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setAncora({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) })
    }
    misura()
    window.addEventListener('resize', misura)
    window.addEventListener('scroll', misura, true)
    return () => {
      window.removeEventListener('resize', misura)
      window.removeEventListener('scroll', misura, true)
    }
  }, [aperto, rif])

  return ancora
}

/**
 * Si chiude cliccando fuori e con Esc.
 *
 * Prima si chiudeva solo con la ✕, e un pannello che resta aperto mentre si
 * clicca altrove è un pannello che copre la pagina su cui si sta lavorando —
 * tanto più adesso che sta in fondo al body, cioè sopra tutto.
 *
 * `pointerdown` e non `click`: il clic arriva dopo il rilascio, e nel frattempo
 * l'elemento sotto ha già ricevuto il focus. La pill si esclude a mano perché il
 * suo `onClick` fa già da interruttore: senza questa esclusione un clic sulla
 * pill aperta la chiuderebbe due volte, cioè la riaprirebbe.
 */
function useChiusura(
  aperto: boolean,
  chiudi: () => void,
  pill: React.RefObject<HTMLElement>,
  pannello: React.RefObject<HTMLElement>,
) {
  useEffect(() => {
    if (!aperto) return

    const fuori = (e: PointerEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (pill.current?.contains(t) || pannello.current?.contains(t)) return
      chiudi()
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') chiudi()
    }

    document.addEventListener('pointerdown', fuori)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', fuori)
      document.removeEventListener('keydown', esc)
    }
  }, [aperto, chiudi, pill, pannello])
}

/**
 * «Dove siamo?»
 *
 * Il primo schermo del widget, e l'unico posto da cui parte la richiesta del
 * permesso: chi la nega non resta a mani vuote, perché il campo della città è
 * lì accanto e non appare come premio di consolazione dopo un rifiuto.
 */
function Dove({
  rileva,
  scegliCitta,
  inCorso,
  negato: negatoPrima,
}: {
  rileva: () => Promise<boolean>
  scegliCitta: (c: CittaTrovata) => void
  inCorso: boolean
  /** Il permesso era già stato negato in una visita precedente. */
  negato: boolean
}) {
  /* Due sorgenti per lo stesso fatto: il rifiuto appena avvenuto in questo
     pannello, e quello ricordato dalle volte prima. La seconda serve perché ora
     il permesso lo chiede l'avvio del widget, non questo bottone: senza, chi ha
     detto no all'apertura della dashboard aprirebbe il pannello e troverebbe un
     bottone che sembra non aver mai provato niente. */
  const [negatoOra, setNegatoOra] = useState(false)
  const negato = negatoOra || negatoPrima

  return (
    <div className="lm-salat-dove">
      <p className="lm-sub">
        {negato
          ? 'Il browser non dà la posizione. Scrivi la città: gli orari si calcolano qui sul dispositivo, senza chiamare nessun servizio.'
          : 'Gli orari si calcolano sul posto, senza chiamare nessun servizio. Serve solo sapere dove siamo.'}
      </p>
      <button
        type="button"
        className="lm-btn"
        data-variant="dark"
        disabled={inCorso}
        onClick={async () => {
          const ok = await rileva()
          if (!ok) setNegatoOra(true)
        }}
      >
        <MapPin aria-hidden="true" />
        {inCorso ? 'Cerco…' : negato ? 'Riprova con la posizione' : 'Usa la mia posizione'}
      </button>
      {negatoOra && (
        <p className="lm-field-hint">
          Niente da fare. Se l’hai bloccata, il lucchetto accanto all’indirizzo la rimette.
        </p>
      )}
      <CercaCitta scegliCitta={scegliCitta} />
    </div>
  )
}

/**
 * La città a mano.
 *
 * Cerca dopo 450ms di silenzio e non a ogni tasto: Nominatim chiede al massimo
 * una richiesta al secondo, e «Jesolo» battuto a velocità normale sarebbero sei
 * richieste per una risposta.
 */
function CercaCitta({ scegliCitta }: { scegliCitta: (c: CittaTrovata) => void }) {
  const [testo, setTesto] = useState('')
  const [esiti, setEsiti] = useState<CittaTrovata[]>([])
  const [cerco, setCerco] = useState(false)

  useEffect(() => {
    const t = testo.trim()
    if (t.length < 3) {
      setEsiti([])
      return
    }
    setCerco(true)
    const id = window.setTimeout(async () => {
      const r = await cercaCitta(t)
      setEsiti(r)
      setCerco(false)
    }, 450)
    return () => {
      window.clearTimeout(id)
      setCerco(false)
    }
  }, [testo])

  return (
    <div className="lm-salat-cerca">
      <label className="lm-field">
        <span className="lm-label">Città</span>
        <span className="lm-salat-input">
          <Search aria-hidden="true" />
          <input
            type="text"
            value={testo}
            placeholder="Jesolo, Casablanca, Milano…"
            onChange={(e) => setTesto(e.target.value)}
          />
        </span>
      </label>
      {cerco && <p className="lm-field-hint">Cerco…</p>}
      {esiti.length > 0 && (
        <ul className="lm-salat-esiti">
          {esiti.map((c) => (
            <li key={`${c.nome}-${c.lat}-${c.lng}`}>
              <button type="button" onClick={() => scegliCitta(c)}>
                {c.nome}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Le impostazioni: metodo, madhab, notifiche, ayat, posizione. */
function Impostazioni({
  imp,
  salva,
  chiediNotifiche,
  cittaCorrente,
  scegliCitta,
  rileva,
  inCorso,
}: {
  imp: ImpostazioniSalat
  salva: (patch: Partial<ImpostazioniSalat>) => void
  chiediNotifiche: () => Promise<void>
  cittaCorrente: string
  scegliCitta: (c: CittaTrovata) => void
  rileva: () => Promise<boolean>
  inCorso: boolean
}) {
  const permesso = typeof Notification !== 'undefined' ? Notification.permission : 'denied'

  return (
    <div className="lm-salat-imp">
      <label className="lm-field">
        <span className="lm-label">Metodo di calcolo</span>
        <select value={imp.metodo} onChange={(e) => salva({ metodo: e.target.value as never })}>
          {Object.entries(METODI).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <label className="lm-field">
        <span className="lm-label">Madhab (per l’Asr)</span>
        <select value={imp.madhab} onChange={(e) => salva({ madhab: e.target.value as never })}>
          {Object.entries(MADHAB).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <div className="lm-salat-riga">
        <span>
          Notifica all’orario
          <small>
            {permesso === 'granted'
              ? 'il browser è autorizzato'
              : permesso === 'denied'
                ? 'il browser le ha bloccate'
                : 'da autorizzare, una volta sola'}
          </small>
        </span>
        {permesso === 'default' ? (
          <button type="button" className="lm-btn" data-size="sm" onClick={chiediNotifiche}>
            <Bell aria-hidden="true" />
            Autorizza
          </button>
        ) : (
          <button
            type="button"
            className="lm-salat-switch"
            role="switch"
            aria-checked={imp.notifiche && permesso === 'granted'}
            disabled={permesso === 'denied'}
            onClick={() => salva({ notifiche: !imp.notifiche })}
          >
            {imp.notifiche && permesso === 'granted' ? (
              <Bell aria-hidden="true" />
            ) : (
              <BellOff aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <div className="lm-salat-riga">
        <span>
          Ayah
          <small>nel pannello e nella home</small>
        </span>
        <button
          type="button"
          className="lm-salat-switch"
          role="switch"
          aria-checked={imp.ayat}
          onClick={() => salva({ ayat: !imp.ayat })}
        >
          {imp.ayat ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
        </button>
      </div>

      {imp.ayat && (
        <label className="lm-field">
          <span className="lm-label">Cambia ayah ogni</span>
          <span className="lm-salat-input">
            <input
              type="number"
              min={5}
              max={240}
              step={5}
              value={imp.intervalloAyah}
              onChange={(e) => salva({ intervalloAyah: Number(e.target.value) })}
            />
            <em>minuti</em>
          </span>
        </label>
      )}

      <div className="lm-salat-riga">
        <span>
          Posizione
          <small>{cittaCorrente || 'non impostata'}</small>
        </span>
        <button
          type="button"
          className="lm-btn"
          data-size="sm"
          disabled={inCorso}
          onClick={() => void rileva()}
        >
          <MapPin aria-hidden="true" />
          {inCorso ? 'Cerco…' : 'Rileva'}
        </button>
      </div>

      <CercaCitta scegliCitta={scegliCitta} />

      <p className="lm-field-hint">
        Il widget si spegne del tutto dalle impostazioni del profilo.
      </p>
    </div>
  )
}
