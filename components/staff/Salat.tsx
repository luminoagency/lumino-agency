'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, BellOff, Check, Clock, MapPin, Search, Settings2, X } from 'lucide-react'
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
  leggiImpostazioni,
  leggiPosizione,
  scriviImpostazioni,
  scriviPosizione,
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
 * **Non chiede il GPS all'apertura della pagina.** È la stessa decisione della
 * nuova visita in F3, per la stessa ragione: il permesso del browser è una
 * finestra che copre tutto, e chiederlo mentre qualcuno sta aprendo la pipeline
 * vuol dire vederlo negare per sempre. Al primo avvio il widget chiede *dove
 * siamo* con due bottoni, e il permesso arriva dopo che lo si è premuto. Se il
 * permesso c'è già da un'altra volta, la posizione si rinfresca in silenzio: è
 * così che la città cambia da sola cambiando posto.
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

  /* ── avvio ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const impostazioni = leggiImpostazioni()
    const salvata = leggiPosizione()
    setImp(impostazioni)
    setPos(salvata)
    setPronto(true)

    if (!impostazioni.attivo) return

    /* Il permesso già concesso si riusa senza chiedere niente: `permissions`
       non esiste su Safari vecchio, e in quel caso semplicemente non si
       rinfresca da sola — la posizione salvata resta buona. */
    let annullato = false
    void (async () => {
      try {
        const p = await navigator.permissions?.query({ name: 'geolocation' as PermissionName })
        if (annullato || p?.state !== 'granted') return
        await rilevaPosizione(true)
      } catch {
        /* niente: si resta con quella salvata */
      }
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
    /* La città arriva dopo le coordinate e non insieme: gli orari sono già
       giusti senza il nome, e far aspettare Nominatim per un'etichetta vorrebbe
       dire un widget vuoto per mezzo secondo. */
    const salvata: Posizione = { ...coord, citta: leggiPosizione()?.citta ?? '', at: Date.now() }
    setPos(salvata)
    scriviPosizione(salvata)
    setInCorso(false)

    const citta = await cittaDaCoordinate(coord.lat, coord.lng)
    if (citta) {
      const conNome = { ...salvata, citta }
      setPos(conNome)
      scriviPosizione(conNome)
    }
    return true
  }, [])

  const scegliCitta = useCallback((c: CittaTrovata) => {
    const salvata: Posizione = { lat: c.lat, lng: c.lng, citta: c.nome, at: Date.now() }
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

  return (
    <div className="lm-salat" data-aperto={aperto}>
      <button
        type="button"
        className="lm-salat-pill"
        aria-expanded={aperto}
        onClick={() => setAperto((v) => !v)}
      >
        {st ? (
          <>
            <span className="lm-salat-punto" aria-hidden="true" />
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
              <small>dove siamo?</small>
            </span>
          </>
        )}
      </button>

      {aperto && (
        <div className="lm-salat-panel" role="dialog" aria-label="Orari della preghiera">
          <div className="lm-salat-head">
            <span className="lm-label">
              {pos?.citta ? (
                <>
                  <MapPin aria-hidden="true" /> {pos.citta}
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
            />
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

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
}: {
  rileva: () => Promise<boolean>
  scegliCitta: (c: CittaTrovata) => void
  inCorso: boolean
}) {
  const [negato, setNegato] = useState(false)

  return (
    <div className="lm-salat-dove">
      <p className="lm-sub">
        Gli orari si calcolano sul posto, senza chiamare nessun servizio. Serve solo sapere dove
        siamo.
      </p>
      <button
        type="button"
        className="lm-btn"
        data-variant="dark"
        disabled={inCorso}
        onClick={async () => {
          const ok = await rileva()
          if (!ok) setNegato(true)
        }}
      >
        <MapPin aria-hidden="true" />
        {inCorso ? 'Cerco…' : 'Usa la mia posizione'}
      </button>
      {negato && (
        <p className="lm-field-hint">
          Il browser non l’ha data. Scrivi la città qui sotto: funziona uguale.
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
