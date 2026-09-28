'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { requireStaff } from './auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { COOKIE_DEMO_NOME } from './demo'
import { BUCKET_AVATAR } from './avatar'
import { BUCKET_CAMPO } from './storage'
import {
  SETTORI,
  SITI,
  STATI,
  TIPI_ATTIVITA,
  type Settore,
  type SitoAttuale,
  type Stato,
  type TipoAttivita,
} from './types'

/**
 * Le scritture dell'area staff.
 *
 * Tutte passano da requireStaff(): non per decidere *cosa* può fare chi — quello
 * lo decide la RLS nel database, che non si può dimenticare — ma per non
 * lasciare che una POST senza sessione arrivi fino a Postgres.
 *
 * Nessuna di queste funzioni sceglie `assegnato_a` per conto proprio quando
 * chi scrive è un venditore: la policy di insert accetta solo righe intestate a
 * sé, quindi qui si scrive l'unico valore che passerebbe comunque.
 */

export interface Esito {
  ok: boolean
  error?: string
  /** Quante righe sono entrate davvero (import). */
  n?: number
}

/**
 * Sposta un cliente di stato — è quello che fa il drag & drop del kanban.
 *
 * Il motivo del rifiuto è obbligatorio e lo è due volte: qui, per dare un
 * messaggio comprensibile, e nel check constraint della tabella, perché una
 * regola che vive solo nell'interfaccia non è una regola. Uscendo da
 * "rifiutato" il motivo si azzera: tenerselo appiccicato a un cliente tornato
 * in trattativa è il modo più rapido di leggere lo storico al contrario.
 */
export async function cambiaStato(id: string, stato: Stato, motivo?: string): Promise<Esito> {
  await requireStaff()

  if (!STATI.includes(stato)) return { ok: false, error: 'Stato non valido.' }

  const pulito = (motivo ?? '').trim()
  if (stato === 'rifiutato' && !pulito) {
    return { ok: false, error: 'Serve il motivo del rifiuto.' }
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('staff_clients')
    .update({
      stato,
      motivo_rifiuto: stato === 'rifiutato' ? pulito.slice(0, 500) : null,
    })
    .eq('id', id)

  if (error) return { ok: false, error: messaggio(error.message) }

  revalidatePath('/staff/pipeline')
  revalidatePath('/staff/clienti')
  revalidatePath(`/staff/clienti/${id}`)
  revalidatePath('/staff')
  return { ok: true }
}

export interface NuovoCliente {
  nome: string
  settore: string
  citta?: string
  zona?: string
  indirizzo?: string
  referente?: string
  telefono?: string
  email?: string
  instagram?: string
  sito_attuale?: string
  note_sito?: string
  stato?: string
  prezzo_consigliato?: string
  assegnato_a?: string
}

export async function creaCliente(dati: NuovoCliente): Promise<Esito & { id?: string }> {
  const me = await requireStaff()

  const nome = (dati.nome ?? '').trim()
  if (!nome) return { ok: false, error: 'Il nome è obbligatorio.' }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('staff_clients')
    .insert(riga(dati, me.id, me.role === 'admin'))
    .select('id')
    .single()

  if (error) return { ok: false, error: messaggio(error.message) }

  revalidatePath('/staff/pipeline')
  revalidatePath('/staff/clienti')
  return { ok: true, id: data?.id }
}

/**
 * Import CSV.
 *
 * Il file lo legge e lo mappa il browser: mandare qui un CSV grezzo vorrebbe
 * dire riscrivere un parser sul server per un dato che l'utente ha già visto
 * in anteprima. Qui arrivano righe già in colonne, e vengono comunque
 * ricontrollate — i valori fuori vocabolario diventano il default invece di
 * far fallire tutto l'import per una cella scritta male.
 *
 * L'inserimento è unico: 300 righe in una insert invece di 300 chiamate, e
 * soprattutto o entrano tutte o nessuna. Un import a metà è peggio di un
 * import fallito, perché non si sa da dove ripartire.
 */
export async function importaClienti(righe: NuovoCliente[]): Promise<Esito> {
  const me = await requireStaff()

  if (!Array.isArray(righe) || righe.length === 0) {
    return { ok: false, error: 'Nessuna riga da importare.' }
  }
  if (righe.length > 500) {
    return { ok: false, error: 'Massimo 500 righe per import. Dividi il file.' }
  }

  const admin = me.role === 'admin'
  const valide = righe
    .filter((r) => (r.nome ?? '').trim().length > 0)
    .map((r) => riga(r, me.id, admin))

  if (!valide.length) return { ok: false, error: 'Nessuna riga ha un nome.' }

  const supabase = createClient()
  const { error } = await supabase.from('staff_clients').insert(valide)

  if (error) return { ok: false, error: messaggio(error.message) }

  revalidatePath('/staff/pipeline')
  revalidatePath('/staff/clienti')
  return { ok: true, n: valide.length }
}

/* ─────────────────────────────────────────────────────────────────────────── */

/** Una riga pulita e dentro il vocabolario, pronta per l'insert. */
function riga(dati: NuovoCliente, meId: string, admin: boolean) {
  const stato = dentro(dati.stato, STATI, 'da_contattare') as Stato
  const prezzo = Number(String(dati.prezzo_consigliato ?? '').replace(',', '.'))

  return {
    nome: (dati.nome ?? '').trim().slice(0, 200),
    settore: dentro(dati.settore, SETTORI, 'altro') as Settore,
    citta: testo(dati.citta),
    zona: testo(dati.zona),
    indirizzo: testo(dati.indirizzo),
    referente: testo(dati.referente),
    telefono: testo(dati.telefono),
    email: testo(dati.email),
    instagram: testo(dati.instagram),
    sito_attuale: dati.sito_attuale
      ? (dentro(dati.sito_attuale, SITI, 'nessuno') as SitoAttuale)
      : null,
    note_sito: testo(dati.note_sito),
    /* Un import non può creare rifiuti: il motivo è obbligatorio e in un CSV
       non c'è. Lo stato scivola all'inizio del funnel. */
    stato: stato === 'rifiutato' ? 'da_contattare' : stato,
    prezzo_consigliato: Number.isFinite(prezzo) && prezzo > 0 ? prezzo : null,
    /* Un venditore può intestare solo a sé: la policy di insert rifiuterebbe
       qualunque altro valore, quindi non si prova nemmeno. */
    assegnato_a: admin ? (testo(dati.assegnato_a) ?? meId) : meId,
  }
}

function testo(value: string | undefined | null): string | null {
  const v = (value ?? '').trim()
  return v ? v.slice(0, 500) : null
}

function dentro(value: string | undefined, valori: readonly string[], fallback: string): string {
  const v = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_')
  return valori.includes(v) ? v : fallback
}

/** Gli errori di Postgres tradotti nelle due cose che possono succedere qui. */
function messaggio(raw: string): string {
  if (raw.includes('42P01')) {
    return 'Le tabelle dell’area staff non esistono ancora: esegui la migration 0030.'
  }
  if (raw.toLowerCase().includes('row-level security')) {
    return 'Non hai i permessi per questa operazione.'
  }
  if (raw.includes('staff_clients_motivo_rifiuto')) {
    return 'Serve il motivo del rifiuto.'
  }
  return raw
}

/**
 * L'interruttore dei dati demo.
 *
 * Un cookie e non una colonna sul profilo: è una preferenza di *questa
 * finestra*, non una proprietà dell'utente. L'admin lo accende per far vedere
 * la dashboard piena a qualcuno, e quando chiude il browser è finita lì.
 *
 * Il controllo del ruolo è qui e non solo nell'interfaccia: nascondere un
 * interruttore non impedisce a nessuno di chiamare l'azione.
 */
export async function impostaDemo(acceso: boolean): Promise<Esito> {
  const me = await requireStaff()
  if (me.role !== 'admin') return { ok: false, error: 'Solo un amministratore.' }

  cookies().set(COOKIE_DEMO_NOME, acceso ? '1' : '0', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/staff',
    /* Di sessione: si spegne da solo chiudendo il browser, che è esattamente
       quello che serve per non ritrovarsi i clienti finti il lunedì mattina. */
  })

  revalidatePath('/staff', 'layout')
  return { ok: true }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Campo, follow-up e modifica della scheda (F3)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Modifica dei dati di un cliente dalla scheda.
 *
 * Non riusa `riga()` apposta. Quella funzione serve a *creare*: riempie di
 * default tutto quello che manca, e su un update vorrebbe dire che aprire la
 * modale e salvare senza toccare niente azzera i campi che l'utente non ha
 * davanti. Qui si scrive solo quello che il modulo mostra.
 *
 * Lo stato non passa di qui: si cambia dal kanban o dalla scheda, col motivo
 * quando serve. Due strade per lo stesso dato sono due strade per dimenticarsi
 * il motivo del rifiuto in una delle due.
 */
export async function aggiornaCliente(id: string, dati: NuovoCliente): Promise<Esito> {
  const me = await requireStaff()

  const nome = (dati.nome ?? '').trim()
  if (!nome) return { ok: false, error: 'Il nome è obbligatorio.' }

  const prezzo = Number(String(dati.prezzo_consigliato ?? '').replace(',', '.'))

  const campi: Record<string, unknown> = {
    nome: nome.slice(0, 200),
    settore: dentro(dati.settore, SETTORI, 'altro'),
    citta: testo(dati.citta),
    zona: testo(dati.zona),
    indirizzo: testo(dati.indirizzo),
    referente: testo(dati.referente),
    telefono: testo(dati.telefono),
    email: testo(dati.email),
    instagram: testo(dati.instagram),
    sito_attuale: dati.sito_attuale ? dentro(dati.sito_attuale, SITI, 'nessuno') : null,
    note_sito: testo(dati.note_sito),
    prezzo_consigliato: Number.isFinite(prezzo) && prezzo > 0 ? prezzo : null,
  }

  /* Riassegnare un cliente è cosa da admin: la policy di update di un
     venditore accetta solo righe che restano sue, quindi il campo non si
     manda nemmeno. */
  if (me.role === 'admin' && dati.assegnato_a) campi.assegnato_a = dati.assegnato_a

  const supabase = createClient()
  const { error } = await supabase.from('staff_clients').update(campi).eq('id', id)
  if (error) return { ok: false, error: messaggio(error.message) }

  revalidatePath(`/staff/clienti/${id}`)
  revalidatePath('/staff/clienti')
  revalidatePath('/staff/pipeline')
  return { ok: true }
}

export interface DatiVisita {
  client_id: string
  gestione_prenotazioni: string[]
  strumenti_usati: string[]
  lingue_clienti: string[]
  commissioni_pagate?: string
  turisti?: boolean | null
  problemi_dichiarati?: string
  reazione?: string
  obiezione_principale?: string
  frase_titolare?: string
  trascrizione_vocale?: string
  /** Percorsi già dentro il bucket, restituiti da caricaFoto(). */
  foto?: string[]
  lat?: number | null
  lng?: number | null
  /** Se la visita ha spostato il cliente, il nuovo stato. */
  nuovo_stato?: string
  motivo_rifiuto?: string
  /** Il richiamo, se se n'è preso uno. */
  followup_data?: string
  followup_nota?: string
}

/**
 * La visita, salvata in un colpo solo.
 *
 * Tre scritture diverse — il report, l'attività in timeline, il richiamo — più
 * un eventuale cambio di stato. Non sono una transazione: PostgREST non ne
 * offre una, e ottenerla vorrebbe dire una funzione SQL in più da tenere
 * allineata alla migration. La conseguenza è scelta, non subita: se cade una
 * delle scritture successive resta comunque il report, che è il dato che costa
 * raccogliere. Il resto si rifà dalla scheda in dieci secondi.
 *
 * Per questo il report va per primo: se fallisce lui, non si fa altro e si
 * dice perché.
 */
export async function salvaVisita(dati: DatiVisita): Promise<Esito & { id?: string }> {
  const me = await requireStaff()

  if (!dati.client_id) return { ok: false, error: 'Scegli il cliente della visita.' }

  const nuovoStato = dati.nuovo_stato ? dentro(dati.nuovo_stato, STATI, '') : ''
  const motivo = (dati.motivo_rifiuto ?? '').trim()
  if (nuovoStato === 'rifiutato' && !motivo) {
    return { ok: false, error: 'Serve il motivo del rifiuto.' }
  }

  const commissioni = Number(String(dati.commissioni_pagate ?? '').replace(',', '.'))
  const supabase = createClient()

  const { data, error } = await supabase
    .from('staff_field_reports')
    .insert({
      client_id: dati.client_id,
      user_id: me.id,
      gestione_prenotazioni: lista(dati.gestione_prenotazioni),
      strumenti_usati: lista(dati.strumenti_usati),
      lingue_clienti: lista(dati.lingue_clienti),
      commissioni_pagate: Number.isFinite(commissioni) && commissioni >= 0 ? commissioni : null,
      turisti: typeof dati.turisti === 'boolean' ? dati.turisti : null,
      problemi_dichiarati: testo(dati.problemi_dichiarati),
      reazione: testo(dati.reazione),
      obiezione_principale: testo(dati.obiezione_principale),
      frase_titolare: testo(dati.frase_titolare),
      trascrizione_vocale: lungo(dati.trascrizione_vocale),
      foto: lista(dati.foto ?? []),
      lat: coordinata(dati.lat, 90),
      lng: coordinata(dati.lng, 180),
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: messaggio(error.message) }

  /* La visita compare anche in timeline: la scheda cliente si rilegge di lì, e
     un report che non lasciasse traccia lì sarebbe un dato raccolto e perso. */
  await supabase.from('staff_activities').insert({
    client_id: dati.client_id,
    user_id: me.id,
    tipo: 'visita',
    testo: riassunto(dati),
  })

  if (nuovoStato) {
    await supabase
      .from('staff_clients')
      .update({
        stato: nuovoStato,
        motivo_rifiuto: nuovoStato === 'rifiutato' ? motivo.slice(0, 500) : null,
      })
      .eq('id', dati.client_id)
  }

  if (dati.followup_data) {
    await supabase.from('staff_followups').insert({
      client_id: dati.client_id,
      user_id: me.id,
      data: dati.followup_data,
      nota: testo(dati.followup_nota),
    })
  }

  revalidatePath('/staff/campo')
  revalidatePath('/staff')
  revalidatePath('/staff/pipeline')
  revalidatePath('/staff/clienti')
  revalidatePath(`/staff/clienti/${dati.client_id}`)
  return { ok: true, id: data?.id }
}

/** Un'attività scritta a mano dalla scheda: chiamata, messaggio, nota. */
export async function creaAttivita(
  clientId: string,
  tipo: string,
  corpoAttivita: string,
): Promise<Esito> {
  const me = await requireStaff()

  if (!TIPI_ATTIVITA.includes(tipo as TipoAttivita)) {
    return { ok: false, error: 'Tipo di attività non valido.' }
  }
  const corpo = (corpoAttivita ?? '').trim()
  if (!corpo) return { ok: false, error: 'Scrivi cosa è successo.' }

  const supabase = createClient()
  const { error } = await supabase.from('staff_activities').insert({
    client_id: clientId,
    user_id: me.id,
    tipo,
    testo: corpo.slice(0, 2000),
  })
  if (error) return { ok: false, error: messaggio(error.message) }

  revalidatePath(`/staff/clienti/${clientId}`)
  revalidatePath('/staff/campo')
  return { ok: true }
}

/** Un richiamo da prendere: quando, e se serve il perché. */
export async function creaFollowup(clientId: string, data: string, nota?: string): Promise<Esito> {
  const me = await requireStaff()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data ?? '')) {
    return { ok: false, error: 'Scegli quando richiamare.' }
  }

  const supabase = createClient()
  const { error } = await supabase.from('staff_followups').insert({
    client_id: clientId,
    user_id: me.id,
    data,
    nota: testo(nota),
  })
  if (error) return { ok: false, error: messaggio(error.message) }

  revalidatePath('/staff/campo')
  revalidatePath('/staff')
  revalidatePath(`/staff/clienti/${clientId}`)
  return { ok: true }
}

/**
 * Fatto, riaperto, o rimandato di N giorni.
 *
 * Rimandare non è modificare una data a mano: il gesto vero, in piedi davanti
 * a un locale chiuso, è «non adesso, fra tre giorni». La nuova data la conta
 * il server a partire da oggi e non dalla scadenza vecchia — un follow-up in
 * ritardo di due settimane, rimandato di tre giorni, deve tornare fra tre
 * giorni, non restare nel passato.
 */
export async function aggiornaFollowup(
  id: string,
  azione: 'fatto' | 'riapri' | 'rimanda',
  giorni = 0,
): Promise<Esito> {
  await requireStaff()

  const campi =
    azione === 'rimanda'
      ? { data: fraGiorni(Math.max(1, Math.min(90, Math.round(giorni)))), fatto: false }
      : { fatto: azione === 'fatto' }

  const supabase = createClient()
  const { error } = await supabase.from('staff_followups').update(campi).eq('id', id)
  if (error) return { ok: false, error: messaggio(error.message) }

  revalidatePath('/staff/campo')
  revalidatePath('/staff')
  revalidatePath('/staff/clienti')
  return { ok: true }
}

/**
 * La foto della vetrina.
 *
 * Passa dal service-role come le immagini dei siti generati (vedi
 * supabase/storage-buckets.md): il bucket `staff-field` è privato e non ha
 * policy di scrittura, e il controllo di chi può caricare si fa qui — si prova
 * a leggere il cliente con la sessione dell'utente, cioè attraverso la RLS. Se
 * quella lettura non torna niente, il cliente non è suo e la foto non parte.
 *
 * Il ridimensionamento lo fa il browser prima di inviare: qui arrivano già
 * poche centinaia di KB. È l'unico punto del piano in cui la dieta serve a due
 * cose insieme — il piano gratuito di Storage e il giga del venditore.
 */
export async function caricaFoto(
  clientId: string,
  form: FormData,
): Promise<Esito & { path?: string }> {
  await requireStaff()

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Nessuna foto.' }
  if (file.size > 6_000_000) return { ok: false, error: 'Foto troppo pesante.' }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { ok: false, error: 'Servono JPEG, PNG o WebP.' }
  }

  const supabase = createClient()
  const { data: cliente } = await supabase
    .from('staff_clients')
    .select('id')
    .eq('id', clientId)
    .maybeSingle()
  if (!cliente) return { ok: false, error: 'Cliente non trovato.' }

  const est = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${clientId}/${crypto.randomUUID()}.${est}`

  const { error } = await createAdminClient()
    .storage.from(BUCKET_CAMPO)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false })

  if (error) return { ok: false, error: `Foto non caricata: ${error.message}` }
  return { ok: true, path }
}

/**
 * La foto scartata, tolta anche dal bucket.
 *
 * Serve perché la foto si carica *prima* che la visita si salvi — è l'unico
 * modo di non far aspettare il venditore alla fine — e quindi una foto
 * ripensata resterebbe là dentro senza nessuna riga che la nomini. Su un piano
 * gratuito gli orfani si accumulano in silenzio finché lo Storage non è pieno.
 *
 * Il percorso comincia sempre con l'id del cliente: si verifica che sia
 * davvero così e che quel cliente si veda con la RLS, altrimenti un percorso
 * costruito a mano cancellerebbe la foto di un collega.
 */
export async function eliminaFoto(clientId: string, path: string): Promise<Esito> {
  await requireStaff()

  if (!path.startsWith(`${clientId}/`) || path.includes('..')) {
    return { ok: false, error: 'Percorso non valido.' }
  }

  const supabase = createClient()
  const { data: cliente } = await supabase
    .from('staff_clients')
    .select('id')
    .eq('id', clientId)
    .maybeSingle()
  if (!cliente) return { ok: false, error: 'Cliente non trovato.' }

  const { error } = await createAdminClient().storage.from(BUCKET_CAMPO).remove([path])
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/* ─────────────────────────────────────────────────────────────────────────── */

/** Un array di stringhe pulito: niente vuoti, niente doppioni, niente romanzi. */
function lista(valori: string[] | undefined): string[] {
  if (!Array.isArray(valori)) return []
  return Array.from(
    new Set(valori.map((v) => String(v).trim().slice(0, 60)).filter(Boolean)),
  ).slice(0, 30)
}

/** Il testo lungo: trascrizione e note, dove 500 caratteri sarebbero pochi. */
function lungo(value: string | undefined | null): string | null {
  const v = (value ?? '').trim()
  return v ? v.slice(0, 5000) : null
}

/** Una coordinata plausibile, o niente: un GPS negato manda `null`, non uno 0. */
function coordinata(value: number | null | undefined, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.abs(value) <= max ? value : null
}

function fraGiorni(giorni: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + giorni)
  return d.toISOString().slice(0, 10)
}

/**
 * La riga che la visita lascia in timeline.
 *
 * Non ripete tutto il report — quello sta nella sua card. Dice le tre cose che
 * servono a chi rilegge la scheda fra un mese: come ha reagito, cosa ha
 * obiettato, e cosa ha detto con parole sue.
 */
function riassunto(dati: DatiVisita): string {
  const pezzi: string[] = []
  if (dati.reazione) pezzi.push(`Reazione: ${dati.reazione.replace(/_/g, ' ')}`)
  if (dati.obiezione_principale) {
    pezzi.push(`Obiezione: ${dati.obiezione_principale.replace(/_/g, ' ')}`)
  }
  if (dati.frase_titolare) pezzi.push(`«${dati.frase_titolare.trim()}»`)
  if (!pezzi.length && dati.trascrizione_vocale) {
    pezzi.push(dati.trascrizione_vocale.trim().slice(0, 300))
  }
  return pezzi.join(' · ').slice(0, 2000) || 'Visita registrata dal campo.'
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Il proprio profilo: titolo, saluto, foto.
 *
 * **Passa dal service-role e non dalla sessione, ed è la parte che conta.** La
 * RLS della 0030 dà l'update su `staff_profiles` al solo admin. Aprirla a
 * «ognuno può modificare la propria riga» sembra la cosa naturale e invece è un
 * buco: la RLS decide per *righe*, non per colonne, quindi quella stessa policy
 * lascerebbe a un venditore anche `role`, `attivo` e `obiettivo_mensile` — cioè
 * gli darebbe modo di promuoversi ad admin e di leggere i margini.
 *
 * L'unico modo di permettere tre colonne e non le altre è scriverle da qui, con
 * un elenco fisso di campi e l'id preso da `requireStaff()` e **non** dal
 * chiamante. Chi chiama non può nemmeno nominare la riga su cui scrive.
 */
export async function aggiornaProfilo(dati: {
  ruolo_titolo?: string
  saluto_custom?: string
  foto_url?: string | null
}): Promise<Esito> {
  const me = await requireStaff()

  const titolo = (dati.ruolo_titolo ?? '').trim()
  const saluto = (dati.saluto_custom ?? '').trim()

  if (titolo.length > 40) return { ok: false, error: 'Il ruolo sta in quaranta caratteri.' }
  if (saluto.length > 160) return { ok: false, error: 'Il saluto sta in centosessanta caratteri.' }

  /* Il campo svuotato torna `null` e non stringa vuota: il check constraint
     della 0033 rifiuta la stringa vuota proprio perché l'interfaccia deve poter
     fare un solo controllo (`is null`) invece di due. */
  const patch: Record<string, string | null> = {
    ruolo_titolo: titolo || null,
    saluto_custom: saluto || null,
  }
  if (dati.foto_url !== undefined) patch.foto_url = dati.foto_url || null

  const { error } = await createAdminClient()
    .from('staff_profiles')
    .update(patch)
    .eq('id', me.id)

  if (error) {
    /* 42703: colonna inesistente. È l'unico errore che vale la pena raccontare
       per nome, perché lo incontra chiunque provi questa pagina prima di aver
       incollato la 0033. */
    if (error.code === '42703') {
      return { ok: false, error: 'Manca la migration 0033: esegui l’SQL e riprova.' }
    }
    return { ok: false, error: error.message }
  }

  /* L'avatar e il saluto stanno nel layout, che avvolge tutta l'area: senza
     questo il rail mostrerebbe la foto vecchia fino al prossimo hard reload. */
  revalidatePath('/staff', 'layout')
  return { ok: true }
}

/**
 * La foto profilo dentro il bucket.
 *
 * Il percorso è `{id}/{uuid}.jpg` con l'id preso dalla sessione: una foto non
 * può finire nella cartella di un collega perché il chiamante non decide dove
 * va.
 *
 * **Quella vecchia si cancella subito dopo**, e non è pulizia opzionale: un
 * bucket privato su un piano gratuito è un giga, e una persona che prova cinque
 * foto prima di scegliere ne lascerebbe quattro là dentro per sempre senza
 * nessuna riga che le nomini. Si cancella *dopo* aver scritto la nuova, così un
 * errore a metà lascia una foto in più e non zero.
 */
export async function caricaAvatar(form: FormData): Promise<Esito & { path?: string }> {
  const me = await requireStaff()

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Nessuna foto.' }
  /* Il browser ritaglia e ridimensiona a 512px prima di inviare: se arriva
     qualcosa di più grande di due mega, non è passato da lì. */
  if (file.size > 2_000_000) return { ok: false, error: 'Foto troppo pesante.' }
  if (!['image/jpeg', 'image/webp', 'image/png'].includes(file.type)) {
    return { ok: false, error: 'Servono JPEG, WebP o PNG.' }
  }

  const admin = createAdminClient()
  const est = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${me.id}/${crypto.randomUUID()}.${est}`

  const { error } = await admin.storage
    .from(BUCKET_AVATAR)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false })
  if (error) return { ok: false, error: `Foto non caricata: ${error.message}` }

  const esito = await aggiornaProfiloFoto(me.id, path)
  if (!esito.ok) {
    /* La riga non si è aggiornata: la foto appena caricata non la nominerà
       nessuno, quindi se ne va subito invece di restare orfana. */
    await admin.storage.from(BUCKET_AVATAR).remove([path])
    return esito
  }

  if (me.foto_url && me.foto_url !== path) {
    await admin.storage.from(BUCKET_AVATAR).remove([me.foto_url])
  }

  revalidatePath('/staff', 'layout')
  return { ok: true, path }
}

/** La foto togliata: si torna alle iniziali, e il file se ne va dal bucket. */
export async function togliAvatar(): Promise<Esito> {
  const me = await requireStaff()
  if (!me.foto_url) return { ok: true }

  const esito = await aggiornaProfiloFoto(me.id, null)
  if (!esito.ok) return esito

  await createAdminClient().storage.from(BUCKET_AVATAR).remove([me.foto_url])
  revalidatePath('/staff', 'layout')
  return { ok: true }
}

/** La sola colonna della foto, scritta a parte da titolo e saluto. */
async function aggiornaProfiloFoto(id: string, path: string | null): Promise<Esito> {
  const { error } = await createAdminClient()
    .from('staff_profiles')
    .update({ foto_url: path })
    .eq('id', id)

  if (error) {
    if (error.code === '42703') {
      return { ok: false, error: 'Manca la migration 0033: esegui l’SQL e riprova.' }
    }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
