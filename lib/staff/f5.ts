import { createAdminClient } from '@/lib/supabase/admin'
import { firmaAvatars } from './avatar'
import { staffDb } from './db'
import { senzaDemo } from './demo'
import type { Insight } from './lab-tipi'

/**
 * Le letture della F5: insight salvati, materiale, squadra.
 *
 * Sta a parte da `f4.ts` per la stessa ragione per cui quello sta a parte da
 * `queries.ts`: sono le query di tre pagine che si aprono insieme e cambiano
 * insieme, e un file unico da millecinquecento righe è un file che nessuno
 * apre per cambiare una colonna.
 */

export const BUCKET_RISORSE = 'staff-resources'

/** Un giorno. Un listino si apre, si guarda e si rimanda a un titolare. */
const DURATA_FIRMA = 86_400

export interface RisorsaVista {
  id: string
  titolo: string
  descrizione: string | null
  tipo: string | null
  settore: string | null
  /** L'indirizzo da aprire: la firma del file nostro, o il link esterno. */
  indirizzo: string | null
  /** È un file nel nostro bucket e non un link di qualcun altro. */
  nostro: boolean
  dimensione: number | null
  created_at: string
}

export interface MembroTeam {
  id: string
  nome: string
  email: string | null
  telefono: string | null
  role: 'admin' | 'sales'
  ruolo_titolo: string | null
  attivo: boolean
  obiettivo_mensile: number | null
  provvigione_pct: number | null
  foto: string | null
  /* Il lavoro, non solo l'anagrafica: una pagina Team che elenca nomi e ruoli
     è una rubrica, e una rubrica di nove persone non si apre mai. */
  clienti: number
  chiuse: number
  incassato: number
  /** Quanto manca all'obiettivo del mese, in percentuale. `null` senza obiettivo. */
  versoObiettivo: number | null
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Gli insight salvati.
 *
 * Il nome dell'autore non viene da una join: `staff_ai_insights.created_by`
 * punta a `auth.users`, non a `staff_profiles`, quindi PostgREST non sa
 * incastrarle da solo. Si leggono i profili una volta e si incrociano in
 * memoria — sono nove righe, e una join per ricavarne nove nomi sarebbe una
 * vista da mantenere.
 */
export async function caricaInsight(demo: boolean): Promise<{ insight: Insight[]; mancaSchema: boolean }> {
  const supabase = staffDb()

  const [righe, profili] = await Promise.all([
    supabase.from('staff_ai_insights').select('*').order('created_at', { ascending: false }).limit(60),
    supabase.from('staff_profiles').select('id, nome'),
  ])

  if (righe.error?.code === '42P01') return { insight: [], mancaSchema: true }

  const nomi = new Map(
    ((profili.data ?? []) as { id: string; nome: string }[]).map((p) => [p.id, p.nome]),
  )

  const lista = senzaDemo((righe.data ?? []) as (Insight & { is_demo?: boolean })[], demo)

  return {
    insight: lista.map((i) => ({
      id: i.id,
      tipo: i.tipo,
      titolo: i.titolo,
      contenuto: i.contenuto,
      created_at: i.created_at,
      created_by: i.created_by,
      autore: i.created_by ? (nomi.get(i.created_by) ?? null) : null,
    })),
    mancaSchema: false,
  }
}

/**
 * Il materiale.
 *
 * Le firme si fanno **in blocco**, non una per riga: una pagina con dodici PDF
 * farebbe dodici viaggi a Storage per disegnare un elenco. È la stessa scelta
 * di `firmaFoto`, e per lo stesso motivo.
 *
 * Una risorsa con un link esterno non passa da Storage affatto: `indirizzo` è
 * già il suo `file_url`. Le due cose convivono nello stesso elenco perché a chi
 * cerca il listino non importa dove sta.
 */
export async function caricaRisorse(demo: boolean): Promise<{
  risorse: RisorsaVista[]
  mancaSchema: boolean
}> {
  const supabase = staffDb()
  const { data, error } = await supabase
    .from('staff_resources')
    .select('*')
    .order('created_at', { ascending: false })

  if (error?.code === '42P01') return { risorse: [], mancaSchema: true }

  type Riga = {
    id: string
    titolo: string
    descrizione?: string | null
    tipo: string | null
    settore: string | null
    file_url: string | null
    file_path?: string | null
    dimensione?: number | null
    created_at: string
    is_demo?: boolean
  }

  const righe = senzaDemo((data ?? []) as Riga[], demo)
  const percorsi = righe.map((r) => r.file_path).filter((p): p is string => Boolean(p))
  const firme = percorsi.length ? await firmaRisorse(percorsi) : {}

  return {
    risorse: righe.map((r) => ({
      id: r.id,
      titolo: r.titolo,
      descrizione: r.descrizione ?? null,
      tipo: r.tipo,
      settore: r.settore,
      indirizzo: r.file_path ? (firme[r.file_path] ?? null) : r.file_url,
      nostro: Boolean(r.file_path),
      dimensione: r.dimensione ?? null,
      created_at: r.created_at,
    })),
    mancaSchema: false,
  }
}

export async function firmaRisorse(paths: string[]): Promise<Record<string, string>> {
  const puliti = Array.from(new Set(paths.filter(Boolean)))
  if (!puliti.length) return {}
  try {
    const { data, error } = await createAdminClient()
      .storage.from(BUCKET_RISORSE)
      .createSignedUrls(puliti, DURATA_FIRMA)
    if (error || !data) return {}
    const mappa: Record<string, string> = {}
    for (const r of data) if (r.path && r.signedUrl) mappa[r.path] = r.signedUrl
    return mappa
  } catch {
    /* Il bucket può non esistere ancora: è documentato in
       supabase/storage-buckets.md. Fino a quel momento la riga c'è e il
       bottone per aprirla no, che è meglio di una pagina che non si apre. */
    return {}
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * La squadra, con accanto il lavoro fatto.
 *
 * Solo l'admin arriva qui — lo controlla la pagina, e lo ricontrolla la RLS, che
 * a un venditore mostra la sola riga sua.
 *
 * I clienti e le chiusure si contano **in memoria** e non con tre query di
 * aggregazione per persona: le righe sono al massimo qualche migliaio e sono già
 * tutte necessarie per un motivo o per l'altro. Con `group by` servirebbe una
 * vista SQL, cioè una cosa in più da tenere allineata alla RLS ogni volta che
 * cambia una regola.
 */
export async function caricaTeam(): Promise<{ membri: MembroTeam[]; mancaSchema: boolean }> {
  const supabase = staffDb()

  const [profili, clienti, deals] = await Promise.all([
    supabase.from('staff_profiles').select('*').order('nome'),
    supabase.from('staff_clients').select('*'),
    supabase.from('staff_deals').select('*'),
  ])

  if (profili.error?.code === '42P01') return { membri: [], mancaSchema: true }

  type RigaProfilo = {
    id: string
    nome: string
    email: string | null
    telefono: string | null
    role: 'admin' | 'sales'
    attivo: boolean
    obiettivo_mensile: number | null
    provvigione_pct: number | null
    ruolo_titolo?: string | null
    foto_url?: string | null
  }
  type RigaCliente = { id: string; assegnato_a: string | null; is_demo?: boolean }
  type RigaDeal = {
    client_id: string
    prezzo_chiuso: number | null
    data_chiusura: string | null
    acconto_30_pagato: boolean
    saldo_70_pagato: boolean
    is_demo?: boolean
  }

  const righeProfilo = (profili.data ?? []) as RigaProfilo[]
  /* Il team non nasconde i dati demo: è la pagina di chi amministra, e i numeri
     accanto ai nomi devono corrispondere a quello che le altre pagine stanno
     mostrando in quel momento — compreso il finto, se l'interruttore è acceso.
     Passare `false` a `senzaDemo` qui sarebbe stato più "pulito" e avrebbe reso
     questa pagina l'unica che dice numeri diversi da tutte le altre. */
  const righeCliente = (clienti.data ?? []) as RigaCliente[]
  const righeDeal = (deals.data ?? []) as RigaDeal[]

  const proprietario = new Map(righeCliente.map((c) => [c.id, c.assegnato_a]))
  const inizioMese = new Date()
  const primoDelMese = new Date(inizioMese.getFullYear(), inizioMese.getMonth(), 1)
    .toISOString()
    .slice(0, 10)

  const perPersona = new Map<string, { clienti: number; chiuse: number; incassato: number; mese: number }>()
  const vuoto = () => ({ clienti: 0, chiuse: 0, incassato: 0, mese: 0 })

  for (const c of righeCliente) {
    if (!c.assegnato_a) continue
    const v = perPersona.get(c.assegnato_a) ?? vuoto()
    v.clienti += 1
    perPersona.set(c.assegnato_a, v)
  }

  for (const d of righeDeal) {
    const chi = proprietario.get(d.client_id)
    if (!chi) continue
    const v = perPersona.get(chi) ?? vuoto()
    if (d.data_chiusura) {
      v.chiuse += 1
      /* «Incassato» qui vuol dire *entrato davvero*, non *firmato*: il 30% se
         l'acconto è pagato, il resto solo col saldo. È la stessa regola della
         pagina Soldi, e usarne una diversa qui farebbe due totali aziendali. */
      const prezzo = d.prezzo_chiuso ?? 0
      const entrato =
        (d.acconto_30_pagato ? prezzo * 0.3 : 0) + (d.saldo_70_pagato ? prezzo * 0.7 : 0)
      v.incassato += entrato
      if (d.data_chiusura >= primoDelMese) v.mese += entrato
    }
    perPersona.set(chi, v)
  }

  const firme = await firmaAvatars(righeProfilo.map((p) => p.foto_url))

  return {
    membri: righeProfilo.map((p) => {
      const v = perPersona.get(p.id) ?? vuoto()
      const obiettivo = p.obiettivo_mensile ?? null
      return {
        id: p.id,
        nome: p.nome,
        email: p.email,
        telefono: p.telefono,
        role: p.role,
        ruolo_titolo: p.ruolo_titolo ?? null,
        attivo: p.attivo,
        obiettivo_mensile: obiettivo,
        provvigione_pct: p.provvigione_pct,
        foto: p.foto_url ? (firme[p.foto_url] ?? null) : null,
        clienti: v.clienti,
        chiuse: v.chiuse,
        incassato: v.incassato,
        versoObiettivo: obiettivo && obiettivo > 0 ? Math.round((v.mese / obiettivo) * 100) : null,
      }
    }),
    mancaSchema: false,
  }
}
