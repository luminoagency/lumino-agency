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
      /* Sotto i cinque minuti una dissolvenza continua è un disturbo, sopra le
         quattro ore non cambia mai: il campo è un numero libero, i limiti no. */
      intervalloAyah: limita(Number(v.intervalloAyah) || IMPOSTAZIONI_DEFAULT.intervalloAyah, 5, 240),
    }
  } catch {
    return IMPOSTAZIONI_DEFAULT
  }
}

export function scriviImpostazioni(v: ImpostazioniSalat): void {
  try {
    localStorage.setItem(CHIAVE_IMPOSTAZIONI, JSON.stringify(v))
  } catch {
    /* Niente da fare e niente da dire: le preferenze valgono per questa
       sessione invece che per sempre, e il widget funziona uguale. */
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
