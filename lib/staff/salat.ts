import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
  type CalculationParameters,
} from 'adhan'

/**
 * Gli orari della preghiera, calcolati qui.
 *
 * **Nessuna API.** `adhan` è la libreria di riferimento per gli algoritmi
 * astronomici (la stessa che sta dietro a mezze app di preghiera): sono formule,
 * non dati, quindi il calcolo è offline, istantaneo e non ha un servizio che
 * possa spegnersi. Un'API degli orari vorrebbe dire una chiamata di rete per
 * aprire una dashboard, una chiave da rinnovare e un widget che si rompe in
 * viaggio, che è esattamente il momento in cui serve.
 *
 * Tutto ciò che è preferenza sta in `localStorage` e non nel database: sono
 * scelte del dispositivo (la posizione, il metodo, se le notifiche sono
 * accese), non dati dell'azienda. Una colonna in più su `staff_profiles` per
 * l'intervallo delle ayat sarebbe una query in più a ogni apertura, per un
 * numero che si cambia una volta nella vita.
 */

/* ─────────────────────────────────────────────────────────────────────────────
   Il vocabolario
   ───────────────────────────────────────────────────────────────────────────── */

export const PREGHIERE = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
export type Preghiera = (typeof PREGHIERE)[number]

/** I nomi in trascrizione: sono quelli che si usano parlando, anche in italiano. */
export const NOME_PREGHIERA: Record<Preghiera, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
}

/** Il nome arabo, in piccolo accanto a quello trascritto. */
export const NOME_ARABO: Record<Preghiera, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
}

/**
 * I metodi di calcolo.
 *
 * Non tutti quelli che `adhan` conosce: solo quelli che qualcuno in Italia o in
 * Marocco userebbe davvero. Un menù con quattordici convenzioni astronomiche è
 * un modo di non far scegliere nessuno.
 *
 * Il default è Muslim World League, che è la convenzione più usata in Europa.
 */
export const METODI = {
  MuslimWorldLeague: 'Muslim World League',
  Egyptian: 'Autorità egiziana',
  Karachi: 'Università di Karachi',
  UmmAlQura: 'Umm al-Qura (Mecca)',
  Dubai: 'Dubai',
  MoonsightingCommittee: 'Moonsighting Committee',
  NorthAmerica: 'ISNA (Nord America)',
  Turkey: 'Diyanet (Turchia)',
} as const

export type Metodo = keyof typeof METODI

export const MADHAB = {
  shafi: 'Shafi’i, Maliki, Hanbali',
  hanafi: 'Hanafi',
} as const

export type MadhabScelto = keyof typeof MADHAB

/* ─────────────────────────────────────────────────────────────────────────────
   Le preferenze
   ───────────────────────────────────────────────────────────────────────────── */

export interface Posizione {
  lat: number
  lng: number
  /** La città risolta da Nominatim, o quella scelta a mano. */
  citta: string
  /** Quando è stata rilevata: serve a sapere quando vale la pena richiederla. */
  at: number
  /**
   * Da dove viene, e quindi quanto fidarsi.
   *
   * `gps` è precisa al metro, `scelta` è quella che ha detto l'utente (che è la
   * verità per definizione), `ip` è il comune visto dal bordo della rete —
   * giusto in città, sbagliato di venti chilometri con un operatore mobile — e
   * `ripiego` è la costante del server, cioè «non lo sappiamo».
   *
   * Non è un'informazione di servizio: decide **se si può sovrascrivere**. Una
   * posizione da `ip` la rimpiazza il GPS appena arriva; una `scelta` no, perché
   * chi ha scritto «Padova» non vuole vedersi correggere dal telefono che è a
   * Ponte di Brenta. E decide se l'interfaccia deve dire da dove viene: sotto un
   * orario di preghiera, «circa, da Venezia» e «Jesolo» non sono la stessa
   * promessa.
   *
   * Opzionale perché nel `localStorage` di chi usa la dashboard da prima non
   * c'è: chi la legge tratta l'assenza come `scelta`, che è il caso in cui non
   * si sovrascrive niente — l'ipotesi prudente.
   */
  fonte?: 'gps' | 'scelta' | 'ip' | 'ripiego'
}

/** Una posizione che il GPS ha il diritto di correggere. */
export function eApprossimativa(p: Posizione | null): boolean {
  return p?.fonte === 'ip' || p?.fonte === 'ripiego'
}

export interface ImpostazioniSalat {
  /** Il widget acceso. Spento, di lui non resta niente sullo schermo. */
  attivo: boolean
  metodo: Metodo
  madhab: MadhabScelto
  /** La notifica del browser all'entrata dell'orario. */
  notifiche: boolean
  /** Le ayat: nel pannello e nella card della home. */
  ayat: boolean
  /** Ogni quanti minuti cambia l'ayah. */
  intervalloAyah: number
}

export const IMPOSTAZIONI_DEFAULT: ImpostazioniSalat = {
  attivo: true,
  metodo: 'MuslimWorldLeague',
  madhab: 'shafi',
  notifiche: true,
  ayat: true,
  intervalloAyah: 30,
}

const CHIAVE_IMPOSTAZIONI = 'lm_salat'
const CHIAVE_POSIZIONE = 'lm_salat_pos'
/**
 * «Il permesso me l'hanno già negato».
 *
 * `navigator.permissions.query({name:'geolocation'})` sarebbe il posto giusto per
 * saperlo, ma su Safari non esiste e su Firefox il rifiuto «solo per questa
 * volta» torna a `prompt`: chiedere di nuovo fa ricomparire la finestra a ogni
 * apertura della dashboard, che è il modo più sicuro di farsi negare il permesso
 * per sempre. Segnato qui, la richiesta automatica si fa **una volta** e poi si
 * chiede la città a parole. Il bottone «usa la mia posizione» nelle impostazioni
 * continua a funzionare: quello è un gesto, e a un gesto si risponde sempre.
 */
const CHIAVE_NEGATO = 'lm_salat_negato'

export function permessoNegato(): boolean {
  try {
    return localStorage.getItem(CHIAVE_NEGATO) === '1'
  } catch {
    return false
  }
}

export function segnaNegato(negato: boolean): void {
  try {
    if (negato) localStorage.setItem(CHIAVE_NEGATO, '1')
    else localStorage.removeItem(CHIAVE_NEGATO)
  } catch {
    /* Finestra privata: si richiederà la prossima volta. Pazienza. */
  }
}

/**
 * La posizione vista dal server, dalle intestazioni di Vercel.
 *
 * Non costa una chiamata a un servizio di geolocalizzazione: l'IP l'ha già
 * risolto il bordo della rete, la route legge un'intestazione. Serve a **non
 * restare mai** sul messaggio «dove siamo?»: parte insieme alla richiesta del
 * permesso, e se il permesso tarda o non arriva gli orari ci sono comunque, con
 * scritto accanto da dove vengono.
 */
export async function posizioneDaIp(): Promise<Posizione | null> {
  try {
    const r = await fetch('/api/staff/geo?ip=1')
    if (!r.ok) return null
    const d = (await r.json()) as { citta?: string; lat?: number; lng?: number; fonte?: string }
    if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return null
    return {
      lat: d.lat as number,
      lng: d.lng as number,
      citta: d.citta ?? '',
      at: Date.now(),
      fonte: d.fonte === 'ip' ? 'ip' : 'ripiego',
    }
  } catch {
    return null
  }
}

/**
 * Legge le preferenze, e non si fida di quello che trova.
 *
 * `localStorage` è modificabile a mano e sopravvive ai cambi di versione: un
 * `metodo` che non esiste più farebbe lanciare `CalculationMethod[...]` e
 * porterebbe giù tutto il widget. Ogni campo viene quindi validato contro
 * l'elenco vero, e quello che non passa torna al default.
 *
 * In lettura non lancia mai: in una finestra privata l'accesso a
 * `localStorage` può dare un'eccezione al solo tocco.
 */
export function leggiImpostazioni(): ImpostazioniSalat {
  try {
    const raw = localStorage.getItem(CHIAVE_IMPOSTAZIONI)
    if (!raw) return IMPOSTAZIONI_DEFAULT
    const v = JSON.parse(raw) as Partial<ImpostazioniSalat>
    return {
      attivo: v.attivo !== false,
      metodo: v.metodo && v.metodo in METODI ? v.metodo : IMPOSTAZIONI_DEFAULT.metodo,
      madhab: v.madhab && v.madhab in MADHAB ? v.madhab : IMPOSTAZIONI_DEFAULT.madhab,
      notifiche: v.notifiche !== false,
      ayat: v.ayat !== false,
      /* **Il minimo è un minuto, e prima era cinque.** Era il pavimento di
         un'ayah *ferma in pagina*, dove un cambio ogni minuto sarebbe stato un
         testo che si riscrive sotto gli occhi mentre si legge un'altra cosa.
         Da quando le ayat sono una notifica che entra e se ne va, un minuto è
         una scelta legittima — e prima di questa riga era una scelta
         **impossibile**: il numero si salvava e si rileggeva come 5, quindi
         chi scriveva 1 vedeva il campo tornare a 5 e concludeva che non
         funzionava niente. Il tetto resta a quattro ore: oltre, non cambia
         mai. */
      intervalloAyah: limita(Number(v.intervalloAyah) || IMPOSTAZIONI_DEFAULT.intervalloAyah, 1, 240),
    }
  } catch {
    return IMPOSTAZIONI_DEFAULT
  }
}

/**
 * «Le preferenze sono cambiate».
 *
 * Esiste perché le preferenze si cambiano da **due** posti — il pannello del
 * rail e `/staff/io` — e le legge un terzo che non si smonta mai: le notifiche
 * vivono nella shell, cioè restano montate per tutta la sessione, e leggere
 * `localStorage` una volta al montaggio vorrebbe dire che l'intervallo nuovo
 * entra in vigore al prossimo ricaricamento della pagina. È lo stesso difetto
 * dell'ayah che non cambiava: un valore salvato che nessuno rilegge.
 *
 * `storage` da solo non basta: il browser lo manda alle **altre** schede, non a
 * quella che ha scritto. Servono entrambi — l'evento nostro per questa scheda,
 * `storage` per le altre.
 */
export const EVENTO_IMPOSTAZIONI = 'lm:salat'

export function scriviImpostazioni(v: ImpostazioniSalat): void {
  try {
    localStorage.setItem(CHIAVE_IMPOSTAZIONI, JSON.stringify(v))
  } catch {
    /* Niente da fare e niente da dire: le preferenze valgono per questa
       sessione invece che per sempre, e il widget funziona uguale. */
  }
  try {
    window.dispatchEvent(new Event(EVENTO_IMPOSTAZIONI))
  } catch {
    /* Fuori da un browser non c'è niente da avvisare. */
  }
}

/**
 * Chi vuole sapere quando cambiano. Restituisce la funzione per smettere.
 *
 * Il filtro sulla chiave di `storage` non è pignoleria: in questa stessa origine
 * ci scrivono la posizione, il permesso negato, la coda delle visite offline e i
 * flag dell'adhan già visto. Senza il filtro, ogni visita salvata senza rete
 * farebbe ricalcolare le notifiche.
 */
export function ascoltaImpostazioni(quando: () => void): () => void {
  const daAltraScheda = (e: StorageEvent) => {
    if (e.key === null || e.key === CHIAVE_IMPOSTAZIONI) quando()
  }
  window.addEventListener(EVENTO_IMPOSTAZIONI, quando)
  window.addEventListener('storage', daAltraScheda)
  return () => {
    window.removeEventListener(EVENTO_IMPOSTAZIONI, quando)
    window.removeEventListener('storage', daAltraScheda)
  }
}

export function leggiPosizione(): Posizione | null {
  try {
    const raw = localStorage.getItem(CHIAVE_POSIZIONE)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<Posizione>
    if (typeof v.lat !== 'number' || typeof v.lng !== 'number') return null
    if (!Number.isFinite(v.lat) || !Number.isFinite(v.lng)) return null
    return { lat: v.lat, lng: v.lng, citta: v.citta || '', at: Number(v.at) || 0 }
  } catch {
    return null
  }
}

export function scriviPosizione(p: Posizione): void {
  try {
    localStorage.setItem(CHIAVE_POSIZIONE, JSON.stringify(p))
  } catch {
    /* vedi sopra */
  }
}

function limita(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)))
}

/* ─────────────────────────────────────────────────────────────────────────────
   Il calcolo
   ───────────────────────────────────────────────────────────────────────────── */

export interface OrarioPreghiera {
  chiave: Preghiera
  /** L'istante esatto di entrata. */
  at: Date
  /** `HH:MM` nel fuso del dispositivo. */
  ora: string
}

function parametri(imp: ImpostazioniSalat): CalculationParameters {
  const p = CalculationMethod[imp.metodo]()
  p.madhab = imp.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi
  return p
}

/** I cinque orari di un giorno, in ordine. */
export function orariDelGiorno(
  pos: Pick<Posizione, 'lat' | 'lng'>,
  imp: ImpostazioniSalat,
  giorno = new Date(),
): OrarioPreghiera[] {
  const t = new PrayerTimes(new Coordinates(pos.lat, pos.lng), giorno, parametri(imp))
  const mappa: Record<Preghiera, Date> = {
    fajr: t.fajr,
    dhuhr: t.dhuhr,
    asr: t.asr,
    maghrib: t.maghrib,
    isha: t.isha,
  }
  return PREGHIERE.map((chiave) => ({ chiave, at: mappa[chiave], ora: hhmm(mappa[chiave]) }))
}

export interface Stato {
  /** I cinque orari di oggi, sempre nell'ordine del giorno. */
  oggi: OrarioPreghiera[]
  /** Quella in corso: l'ultima entrata. Di notte, prima di Fajr, è Isha di ieri. */
  attuale: OrarioPreghiera
  /** La prossima: dopo Isha è il Fajr di domani. */
  prossima: OrarioPreghiera
  /** Secondi che mancano alla prossima. */
  mancano: number
}

/**
 * Dove siamo adesso nel giorno.
 *
 * Il caso da non sbagliare è la notte: fra Isha e il Fajr del giorno dopo,
 * «attuale» è Isha di **ieri** e «prossima» è Fajr di **domani**. Calcolare solo
 * il giorno corrente darebbe «prossima: Fajr» con un conto alla rovescia
 * negativo di venti ore, che è il bug classico di questi widget. Per questo si
 * calcolano tre giorni e si cerca dentro l'elenco unito.
 */
export function stato(
  pos: Pick<Posizione, 'lat' | 'lng'>,
  imp: ImpostazioniSalat,
  adesso = new Date(),
): Stato {
  const giorno = 86_400_000
  const oggi = orariDelGiorno(pos, imp, adesso)
  const ieri = orariDelGiorno(pos, imp, new Date(adesso.getTime() - giorno))
  const domani = orariDelGiorno(pos, imp, new Date(adesso.getTime() + giorno))

  const tutti = [...ieri, ...oggi, ...domani].sort((a, b) => a.at.getTime() - b.at.getTime())
  const ms = adesso.getTime()

  let attuale = tutti[0]
  for (const o of tutti) if (o.at.getTime() <= ms) attuale = o
  const prossima = tutti.find((o) => o.at.getTime() > ms) ?? tutti[tutti.length - 1]

  return {
    oggi,
    attuale,
    prossima,
    mancano: Math.max(0, Math.round((prossima.at.getTime() - ms) / 1000)),
  }
}

function hhmm(d: Date): string {
  return new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' }).format(d)
}

/** `1h 24m` o `4m 12s`: i secondi compaiono solo nell'ultima ora, dove contano. */
export function contoAllaRovescia(secondi: number): string {
  const h = Math.floor(secondi / 3600)
  const m = Math.floor((secondi % 3600) / 60)
  const s = secondi % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

/* ─────────────────────────────────────────────────────────────────────────────
   La città
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Da coordinate a nome di città.
 *
 * **Passa da una route nostra e non da Nominatim diretto**, e non è un vezzo
 * architetturale: la policy d'uso di Nominatim chiede un `User-Agent` che
 * identifichi l'applicazione, e `User-Agent` è un header che `fetch` nel browser
 * **non permette di impostare** — è nell'elenco dei forbidden header names.
 * Chiamandolo dal browser si manderebbe l'UA di Chrome, cioè esattamente ciò che
 * la policy vieta, e gli indirizzi IP degli utenti finirebbero uno per uno nei
 * loro log. Dal server l'header si mette, e la cache la fa una volta per tutti.
 *
 * Le coordinate si arrotondano a due decimali prima di partire: sono circa un
 * chilometro, e dentro un chilometro la città è la stessa. Serve a far centrare
 * la cache — senza, ogni metro camminato sarebbe una richiesta nuova.
 */
export async function cittaDaCoordinate(lat: number, lng: number): Promise<string> {
  const q = `lat=${lat.toFixed(2)}&lng=${lng.toFixed(2)}`
  try {
    const r = await fetch(`/api/staff/geo?${q}`)
    if (!r.ok) return ''
    const d = (await r.json()) as { citta?: string }
    return d.citta ?? ''
  } catch {
    return ''
  }
}

export interface CittaTrovata {
  nome: string
  lat: number
  lng: number
}

/** La ricerca a mano, per chi ha detto no al GPS. Stessa route, stesso perché. */
export async function cercaCitta(testo: string): Promise<CittaTrovata[]> {
  const t = testo.trim()
  if (t.length < 3) return []
  try {
    const r = await fetch(`/api/staff/geo?q=${encodeURIComponent(t)}`)
    if (!r.ok) return []
    const d = (await r.json()) as { risultati?: CittaTrovata[] }
    return d.risultati ?? []
  } catch {
    return []
  }
}

/**
 * La posizione dal browser.
 *
 * `maximumAge` di un'ora: entrando in dashboard dieci volte al giorno non serve
 * riaccendere il GPS dieci volte, e una posizione vecchia di un'ora sposta gli
 * orari della preghiera di pochi secondi. La precisione alta non si chiede per
 * la stessa ragione — qui un chilometro di errore non si vede.
 */
export function chiediPosizione(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 3_600_000 },
    )
  })
}
