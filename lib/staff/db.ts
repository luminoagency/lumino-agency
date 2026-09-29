import { createClient } from '@/lib/supabase/server'
import { PROFILO_DEMO, righeDemo, type RigheDemo } from './demo'

/**
 * L'anteprima di sviluppo.
 *
 * Il problema che risolve: le pagine di /staff sono tutte dietro un login, e
 * per guardare il design bisognerebbe avere una password vera e un database
 * pieno. Con questo interruttore le stesse pagine si aprono in locale con i
 * dati finti e nessuna sessione.
 *
 * **Due lucchetti, non uno.** `NODE_ENV !== 'production'` da solo basterebbe a
 * escludere sia la produzione sia le Preview di Vercel (che compilano in
 * produzione), ma un flag che apre un'area riservata non deve dipendere da una
 * variabile che qualcuno un giorno potrebbe impostare per sbaglio: serve anche
 * `STAFF_DEV_PREVIEW=1`, che sta solo in `.env.local` e non su Vercel.
 *
 * È **sola lettura**: le scritture continuano ad andare al database vero, dove
 * senza sessione la RLS le rifiuta. È voluto — un'anteprima che scrive è un
 * modo per sporcare i dati veri credendo di guardare un mockup.
 */
export const ANTEPRIMA =
  process.env.NODE_ENV !== 'production' && process.env.STAFF_DEV_PREVIEW === '1'

/* ─────────────────────────────────────────────────────────────────────────── */

type Client = ReturnType<typeof createClient>

/**
 * Il client da cui leggono tutte le pagine dell'area staff.
 *
 * In condizioni normali è il client Supabase vero, con i cookie di sessione e
 * la RLS. In anteprima è una finzione che legge dalle righe di `demo.ts`.
 */
export function staffDb(): Client {
  if (!ANTEPRIMA) return createClient()
  return finto() as unknown as Client
}

/* ─────────────────────────────────────────────────────────────────────────── */

type Riga = Record<string, unknown>

/**
 * Un finto PostgREST, largo quanto basta.
 *
 * Non emula Supabase: emula **le query che questa area scrive davvero** —
 * `eq`, `neq`, `lte`, `not is null`, `contains`, `textSearch`, `order`,
 * `limit`, `maybeSingle`. Un emulatore completo sarebbe una libreria da
 * mantenere, e servirebbe a guardare tre schermate.
 *
 * `select()` ignora l'elenco delle colonne e restituisce la riga intera: le
 * colonne di troppo non fanno danno a nessun componente, e ricalcolare la
 * proiezione sarebbe lavoro per niente. L'unica cosa che guarda della stringa
 * è se chiede la tabella collegata `staff_clients`, che è l'unica relazione
 * annidata di tutta l'area.
 */
function finto() {
  const dati: RigheDemo = righeDemo()
  const perId = new Map(dati.staff_clients.map((c) => [c.id as string, c]))

  return {
    auth: {
      async getUser() {
        return { data: { user: { id: PROFILO_DEMO.id, email: PROFILO_DEMO.email } }, error: null }
      },
      async signOut() {
        return { error: null }
      },
    },
    from(tabella: keyof RigheDemo) {
      return builder(dati[tabella] ?? [], perId)
    },
    storage: {
      from() {
        return {
          async createSignedUrls() {
            return { data: [], error: null }
          },
        }
      },
    },
  }
}

function builder(righe: Riga[], perId: Map<string, Riga>) {
  let filtrate = [...righe]
  let embed = false
  let ordini: { col: string; asc: boolean }[] = []
  let massimo = Infinity

  const risolvi = () => {
    let out = filtrate

    for (const o of [...ordini].reverse()) {
      out = [...out].sort((a, b) => {
        const va = a[o.col]
        const vb = b[o.col]
        if (va === vb) return 0
        if (va == null) return 1
        if (vb == null) return -1
        const segno = va < vb ? -1 : 1
        return o.asc ? segno : -segno
      })
    }

    out = out.slice(0, massimo)
    if (embed) {
      out = out.map((r) => ({ ...r, staff_clients: perId.get(r.client_id as string) ?? null }))
    }
    return out
  }

  const api = {
    select(cols?: string) {
      embed = Boolean(cols && cols.includes('staff_clients'))
      return api
    },
    eq(col: string, valore: unknown) {
      filtrate = filtrate.filter((r) => r[col] === valore)
      return api
    },
    neq(col: string, valore: unknown) {
      filtrate = filtrate.filter((r) => r[col] !== valore)
      return api
    },
    lte(col: string, valore: string) {
      filtrate = filtrate.filter((r) => typeof r[col] === 'string' && (r[col] as string) <= valore)
      return api
    },
    gte(col: string, valore: string) {
      filtrate = filtrate.filter((r) => typeof r[col] === 'string' && (r[col] as string) >= valore)
      return api
    },
    /* `contains` sui tag: un array che contiene tutti quelli chiesti. */
    contains(col: string, valori: unknown[]) {
      filtrate = filtrate.filter((r) => {
        const dentro = r[col]
        return Array.isArray(dentro) && valori.every((v) => dentro.includes(v))
      })
      return api
    },
    /* La ricerca a testo pieno, ridotta all'osso: le parole cercate devono
       comparire tutte, da qualche parte nella riga. Non è la `tsvector` di
       Postgres e non deve esserlo — non ci sono né pesi né stemming — ma è
       abbastanza perché l'anteprima di sviluppo mostri una ricerca che filtra
       invece di una che ignora quello che si scrive. */
    textSearch(_col: string, q: string) {
      const parole = q
        .toLowerCase()
        .replace(/["-]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
      filtrate = filtrate.filter((r) => {
        const tutto = JSON.stringify(r).toLowerCase()
        return parole.every((w) => tutto.includes(w))
      })
      return api
    },
    not(col: string, _op: string, _valore: unknown) {
      filtrate = filtrate.filter((r) => r[col] != null)
      return api
    },
    order(col: string, opzioni?: { ascending?: boolean }) {
      ordini.push({ col, asc: opzioni?.ascending !== false })
      return api
    },
    limit(n: number) {
      massimo = n
      return api
    },
    async maybeSingle() {
      return { data: risolvi()[0] ?? null, error: null }
    },
    async single() {
      const riga = risolvi()[0] ?? null
      return riga
        ? { data: riga, error: null }
        : { data: null, error: { code: 'PGRST116', message: 'nessuna riga' } }
    },
    /* Le scritture non esistono in anteprima, e lo dicono invece di far
       credere di aver salvato. */
    insert: () => scrittura(),
    update: () => scrittura(),
    delete: () => scrittura(),
    /* `await query` senza .single(): è così che PostgREST restituisce gli
       elenchi, e il builder deve essere "thenable" per reggerlo. */
    then(
      risolto: (v: { data: Riga[]; error: null }) => unknown,
      _fallito?: (e: unknown) => unknown,
    ) {
      return Promise.resolve({ data: risolvi(), error: null }).then(risolto)
    },
  }

  return api
}

function scrittura() {
  const errore = {
    data: null,
    error: { code: 'ANTEPRIMA', message: 'L’anteprima di sviluppo è in sola lettura.' },
  }
  const api = {
    select: () => api,
    eq: () => api,
    async single() {
      return errore
    },
    async maybeSingle() {
      return errore
    },
    then(risolto: (v: typeof errore) => unknown) {
      return Promise.resolve(errore).then(risolto)
    },
  }
  return api
}
