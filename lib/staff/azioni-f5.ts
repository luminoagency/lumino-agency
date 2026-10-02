'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireStaff } from './auth'
import { eAdmin } from './permessi'
import { BUCKET_RISORSE } from './f5'
import { eTipoInsight } from './lab-tipi'
import type { Esito } from './actions'

/**
 * Le scritture della F5.
 *
 * Un file a parte da `actions.ts` — che è già a settecento righe — e non perché
 * la F5 sia speciale: perché queste tre scritture hanno una cosa in comune che
 * le altre non hanno, cioè il bucket delle risorse, e tenere l'import di
 * `BUCKET_RISORSE` fuori dal file che importa già mezzo modulo è l'unico modo di
 * non far crescere quel file di un altro terzo.
 *
 * Valgono le stesse regole di lì: `requireStaff()` in cima a tutte, e la RLS a
 * decidere davvero chi può cosa.
 */

/* ── Insight ───────────────────────────────────────────────────────────────── */

/**
 * Salva una risposta del Lab come insight.
 *
 * `created_by` lo scrive il server dalla sessione e **non** lo prende dal
 * chiamante: la policy della 0034 accetta solo righe intestate a sé, quindi un
 * `created_by` che arrivasse dal browser sarebbe o inutile o un tentativo.
 *
 * La scrittura passa dal client con i **cookie**, non dal service-role. È la
 * differenza che conta: col service-role la policy `with check` non verrebbe
 * nemmeno valutata, e questa è l'unica scrittura dell'area in cui la regola
 * «ognuno intesta a sé» vive solo lì. Il service-role si usa dove la RLS non può
 * arrivare — le colonne del profilo, i bucket — non dove può.
 */
export async function salvaInsight(dati: {
  tipo: string
  titolo: string
  contenuto: string
}): Promise<Esito> {
  const me = await requireStaff()

  const titolo = dati.titolo.trim()
  const contenuto = dati.contenuto.trim()

  if (!titolo) return { ok: false, error: 'Serve un titolo: è come lo ritroverai.' }
  if (titolo.length > 120) return { ok: false, error: 'Il titolo sta in centoventi caratteri.' }
  if (!contenuto) return { ok: false, error: 'Non c’è niente da salvare.' }
  if (!eTipoInsight(dati.tipo)) return { ok: false, error: 'Tipo di insight sconosciuto.' }

  const { error } = await createClient()
    .from('staff_ai_insights')
    .insert({ tipo: dati.tipo, titolo, contenuto, created_by: me.id })

  if (error) return { ok: false, error: messaggio(error) }

  revalidatePath('/staff/lab-ai')
  return { ok: true }
}

/** Si cancella il proprio; l'admin cancella tutto. Lo decide la policy, non qui. */
export async function eliminaInsight(id: string): Promise<Esito> {
  await requireStaff()

  const { error } = await createClient().from('staff_ai_insights').delete().eq('id', id)
  if (error) return { ok: false, error: messaggio(error) }

  revalidatePath('/staff/lab-ai')
  return { ok: true }
}

/* ── Risorse ───────────────────────────────────────────────────────────────── */

/** Dieci mega: un listino in PDF ne pesa uno, un video sta su un link. */
const MAX_RISORSA = 10_000_000

/**
 * I tipi ammessi.
 *
 * È un elenco di inclusione e non un controllo sull'estensione: l'estensione la
 * sceglie chi carica, il tipo lo dichiara il browser, e nessuno dei due è una
 * garanzia — ma un elenco chiuso di tipi che il bucket accetterà comunque
 * impedisce che questa diventi la via per mettere un eseguibile su un dominio
 * nostro e mandarne il link in giro.
 */
const TIPI_FILE: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'immagine',
  'image/png': 'immagine',
  'image/webp': 'immagine',
  'video/mp4': 'video',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'slide',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'documento',
}

/**
 * Aggiunge una risorsa: un file caricato **o** un link.
 *
 * Il vincolo «l'uno o l'altro» sta nel database (0034) e non solo qui, per la
 * solita ragione: una regola che vive solo nell'interfaccia non è una regola. Il
 * controllo qui serve a dare un messaggio in italiano invece di un errore di
 * Postgres.
 *
 * Solo l'admin: il listino e il manuale sono documenti dell'azienda, e un elenco
 * a cui tutti possono aggiungere diventa in un mese un elenco in cui non si
 * trova più il listino. Lo impone la policy della 0030, che non è cambiata.
 */
export async function creaRisorsa(form: FormData): Promise<Esito> {
  const me = await requireStaff()
  if (!eAdmin(me)) return { ok: false, error: 'Il materiale lo aggiunge un amministratore.' }

  const titolo = String(form.get('titolo') ?? '').trim()
  const descrizione = String(form.get('descrizione') ?? '').trim()
  const settore = String(form.get('settore') ?? '').trim()
  const link = String(form.get('link') ?? '').trim()
  const file = form.get('file')
  const haFile = file instanceof File && file.size > 0

  if (!titolo) return { ok: false, error: 'Serve un titolo.' }
  if (titolo.length > 120) return { ok: false, error: 'Il titolo sta in centoventi caratteri.' }
  if (!haFile && !link) return { ok: false, error: 'Serve un file o un link: una voce che non si apre non serve a niente.' }
  if (haFile && link) return { ok: false, error: 'O il file o il link, non tutti e due.' }

  if (link && !linkValido(link)) {
    return { ok: false, error: 'Il link deve cominciare con https://' }
  }

  let file_path: string | null = null
  let dimensione: number | null = null
  let tipo: string | null = link ? 'link' : null

  if (haFile) {
    const f = file as File
    if (f.size > MAX_RISORSA) return { ok: false, error: 'Massimo 10 MB. Per i video usa un link.' }
    const etichetta = TIPI_FILE[f.type]
    if (!etichetta) return { ok: false, error: 'Formato non ammesso: PDF, immagini, MP4, docx o pptx.' }

    const est = (f.name.split('.').pop() ?? 'bin').toLowerCase().slice(0, 5)
    const path = `${crypto.randomUUID()}.${est}`

    const { error } = await createAdminClient()
      .storage.from(BUCKET_RISORSE)
      .upload(path, await f.arrayBuffer(), { contentType: f.type, upsert: false })

    if (error) return { ok: false, error: `File non caricato: ${error.message}` }

    file_path = path
    dimensione = f.size
    tipo = etichetta
  }

  const { error } = await createClient().from('staff_resources').insert({
    titolo,
    descrizione: descrizione || null,
    settore: settore || null,
    tipo,
    file_path,
    file_url: link || null,
    dimensione,
    created_by: me.id,
  })

  if (error) {
    /* Il file è già nel bucket e la riga non è entrata: senza questa pulizia
       resterebbe là dentro senza nessuna riga che lo nomini, cioè invisibile e
       incancellabile dall'interfaccia. */
    if (file_path) await createAdminClient().storage.from(BUCKET_RISORSE).remove([file_path])
    return { ok: false, error: messaggio(error) }
  }

  revalidatePath('/staff/risorse')
  return { ok: true }
}

/** Toglie la riga e, se il file era nostro, anche il file. */
export async function eliminaRisorsa(id: string): Promise<Esito> {
  const me = await requireStaff()
  if (!eAdmin(me)) return { ok: false, error: 'Il materiale lo gestisce un amministratore.' }

  const supabase = createClient()

  /* Prima si legge il percorso, poi si cancella la riga, poi il file. In
     quest'ordine: cancellando prima il file, un errore sulla riga lascerebbe una
     voce in elenco che non si apre più. Così il peggio che può succedere è un
     file orfano nel bucket, che non si vede e non fa danno. */
  const { data } = await supabase
    .from('staff_resources')
    .select('file_path')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('staff_resources').delete().eq('id', id)
  if (error) return { ok: false, error: messaggio(error) }

  const path = (data as { file_path?: string | null } | null)?.file_path
  if (path) await createAdminClient().storage.from(BUCKET_RISORSE).remove([path])

  revalidatePath('/staff/risorse')
  return { ok: true }
}

/* ─────────────────────────────────────────────────────────────────────────── */

/** Solo http(s), e niente `javascript:` travestito da link. */
function linkValido(v: string): boolean {
  try {
    return new URL(v).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Gli errori di Postgres che vale la pena tradurre.
 *
 * `42P01` e `42703` sono sempre la stessa cosa: una migration non ancora
 * eseguita. È l'errore che incontra chiunque apra queste pagine il primo giorno,
 * e «relation "staff_resources" does not exist» non dice a nessuno cosa fare.
 */
function messaggio(error: { code?: string; message: string }): string {
  if (error.code === '42P01' || error.code === '42703') {
    return 'Manca la migration 0034: eseguila su Supabase e riprova.'
  }
  if (error.code === '42501') {
    return 'Il database ha rifiutato la scrittura: non hai i permessi per questa riga.'
  }
  return error.message
}
