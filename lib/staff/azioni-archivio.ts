'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireStaff } from './auth'
import { BUCKET_ARCHIVIO } from './archivio'
import { eGenere } from './archivio-tipi'
import type { Esito } from './actions'

/**
 * L'Archivio: le scritture.
 *
 * Tre sole, e una regola che vale per tutte: il testo estratto arriva **dal
 * browser**. È una scelta, non una scorciatoia. Estrarre lato server vorrebbe
 * dire un runtime che sa leggere i PDF, cioè una funzione serverless da qualche
 * secondo e qualche centinaio di MB per ogni file caricato — su un piano
 * gratuito è la via più rapida per esaurirlo. Il browser ce l'ha già tutto:
 * `pdfjs` legge i PDF, il dettato è nativo. Costa zero e succede mentre la
 * persona sta ancora scrivendo il titolo.
 *
 * Il prezzo è che il testo è **dichiarato dal client**, quindi non è un dato di
 * cui fidarsi ciecamente: vale per la ricerca e per l'analisi, non per decidere
 * niente. Ed è per questo che `testo_stato` distingue «automatico» da
 * «corretto» — chi legge una citazione del Lab AI ha diritto di sapere se
 * quella frase l'ha scritta una persona o un'estrazione.
 *
 * **Le immagini non hanno testo, e non lo prendono nemmeno se arriva.** Il
 * controllo è qui e non solo nel browser: un client vecchio in una scheda
 * aperta da ieri, o un `fetch` scritto a mano, manderebbero ancora l'OCR di
 * prima, e quel testo finirebbe nella `tsvector` — cioè nella ricerca di tutti.
 */

/** Venti mega: qui arrivano scansioni e foto non ritoccate. */
const MAX_FILE = 20_000_000

/* Centomila caratteri: una trentina di pagine fitte. Oltre, si taglia.
   Non esportato: in un file `'use server'` ogni `export` deve essere una
   funzione asincrona, perché quello che si esporta da qui diventa un endpoint.
   Il gemello lato browser sta in `estrai.ts`, e i due numeri devono restare
   uguali — se cambia questo, cambia anche quello. */
const MAX_TESTO = 100_000

/**
 * I tipi ammessi, con il genere che ne discende.
 *
 * Elenco di inclusione, come nelle Risorse: l'estensione la sceglie chi carica
 * e il tipo lo dichiara il browser, ma un elenco chiuso impedisce che questa
 * diventi la via per mettere un eseguibile su un dominio nostro.
 *
 * Niente audio: **le vocali non si salvano come file.** Si salva la
 * trascrizione. L'audio costa Storage e dentro c'è la voce di una persona che
 * non ha acconsentito a essere registrata.
 */
const TIPI_FILE: Record<string, 'pdf' | 'immagine' | 'testo'> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'immagine',
  'image/png': 'immagine',
  'image/webp': 'immagine',
  'image/heic': 'immagine',
  'text/plain': 'testo',
  'text/markdown': 'testo',
  'text/csv': 'testo',
}

/**
 * Aggiunge una voce.
 *
 * Il genere lo decide il server dal contenuto e non lo prende dal form: un
 * `kind` che arrivasse dal browser sarebbe un campo che descrive qualcosa di
 * diverso da ciò che è stato caricato, e l'unica cosa che ci si può costruire
 * sopra è un filtro che mente.
 */
export async function creaVoceArchivio(form: FormData): Promise<Esito & { id?: string }> {
  const me = await requireStaff()

  const titolo = String(form.get('titolo') ?? '').trim()
  const nota = String(form.get('nota') ?? '').trim()
  const fonte = String(form.get('fonte') ?? '').trim()
  const link = String(form.get('link') ?? '').trim()
  const clientId = String(form.get('cliente') ?? '').trim()
  const avvenuto = String(form.get('avvenuto_il') ?? '').trim()
  const vocale = form.get('vocale') === '1'
  const testoGrezzo = String(form.get('testo') ?? '').trim()
  const statoTesto = String(form.get('testo_stato') ?? '').trim()

  const file = form.get('file')
  const haFile = file instanceof File && file.size > 0

  if (!titolo) return { ok: false, error: 'Serve un titolo: è come lo ritroverai.' }
  if (titolo.length > 160) return { ok: false, error: 'Il titolo sta in centosessanta caratteri.' }
  if (haFile && link) return { ok: false, error: 'O il file o il link, non tutti e due.' }
  if (link && !linkValido(link)) return { ok: false, error: 'Il link deve cominciare con https://' }

  /* Il vincolo `staff_archive_ha_qualcosa` della 0035 dice la stessa cosa. Qui
     si ripete solo per rispondere in italiano invece che con un errore di
     Postgres — la regola vera sta nel database, dove non la si può aggirare. */
  if (!haFile && !link && !nota && !testoGrezzo) {
    return { ok: false, error: 'Una voce vuota non si apre: serve un file, un link, una nota o del testo.' }
  }

  const tags = leggiTag(form.get('tags'))
  if (tags.length > 12) return { ok: false, error: 'Dodici tag bastano: oltre, non filtrano più niente.' }

  /* Il testo si tronca invece di rifiutare il caricamento: un PDF di
     duecento pagine è comunque materiale che si vuole tenere, e le prime
     centomila battute dicono già di cosa parla. */
  let testo = testoGrezzo.slice(0, MAX_TESTO) || null

  let file_path: string | null = null
  let mime: string | null = null
  let dimensione: number | null = null
  let kind: string

  if (haFile) {
    const f = file as File
    if (f.size > MAX_FILE) return { ok: false, error: 'Massimo 20 MB. Per i file grossi usa un link.' }

    kind = TIPI_FILE[f.type] ?? ''
    if (!kind) {
      return { ok: false, error: 'Formato non ammesso: PDF, immagini o file di testo. Il resto va come link.' }
    }

    const est = (f.name.split('.').pop() ?? 'bin').toLowerCase().slice(0, 5)
    const path = `${crypto.randomUUID()}.${est}`

    const { error } = await createAdminClient()
      .storage.from(BUCKET_ARCHIVIO)
      .upload(path, await f.arrayBuffer(), { contentType: f.type, upsert: false })

    if (error) return { ok: false, error: `File non caricato: ${error.message}` }

    file_path = path
    mime = f.type
    dimensione = f.size

    /* Una foto non porta testo: si guarda. Vedi il commento in cima e
       `estrai.ts` — quello che il browser chiamava OCR era rumore, e il rumore
       entrava nella ricerca di tutti. La descrizione a mano sta nella nota, che
       è indicizzata come il testo. */
    if (kind === 'immagine') testo = null
  } else if (link) {
    kind = 'link'
  } else if (vocale) {
    kind = 'vocale'
  } else {
    kind = 'nota'
  }

  if (!eGenere(kind)) return { ok: false, error: 'Genere sconosciuto.' }

  const { data, error } = await createClient()
    .from('staff_archive')
    .insert({
      kind,
      titolo,
      nota: nota || null,
      file_path,
      file_url: link || null,
      mime,
      dimensione,
      testo,
      testo_stato: testo ? (statoTesto === 'corretto' ? 'corretto' : 'automatico') : 'assente',
      fonte: fonte || null,
      tags,
      client_id: clientId || null,
      avvenuto_il: avvenuto || null,
      created_by: me.id,
    })
    .select('id')
    .single()

  if (error) {
    /* Il file è già nel bucket e la riga non è entrata: senza questa pulizia
       resterebbe là dentro senza nessuna riga che lo nomini, cioè invisibile e
       incancellabile dall'interfaccia. */
    if (file_path) await createAdminClient().storage.from(BUCKET_ARCHIVIO).remove([file_path])
    return { ok: false, error: messaggio(error) }
  }

  revalidatePath('/staff/archivio')
  return { ok: true, id: (data as { id: string } | null)?.id }
}

/**
 * Corregge il testo estratto a mano.
 *
 * È la funzione che rende l'estrazione automatica accettabile: un OCR sbaglia i
 * nomi propri e i prezzi, e un dettato sbaglia il dialetto — cioè sbagliano
 * esattamente le cose per cui quel materiale è stato archiviato. Salvando, lo
 * stato passa a «corretto» e da lì in poi il Lab AI sa che dietro quella frase
 * c'è una persona.
 */
export async function correggiTesto(id: string, testo: string): Promise<Esito> {
  await requireStaff()

  const pulito = testo.trim().slice(0, MAX_TESTO)

  const supabase = createClient()

  /* Nemmeno a mano: su una foto il campo non esiste più, e se arriva lo stesso
     è un client vecchio in una scheda aperta da ieri. */
  const { data: riga } = await supabase
    .from('staff_archive')
    .select('kind, mime')
    .eq('id', id)
    .maybeSingle()

  const suFoto = (riga as { kind?: string; mime?: string | null } | null)
  if (suFoto?.kind === 'immagine' || suFoto?.mime?.startsWith('image/')) {
    return { ok: false, error: 'Una foto si guarda: il testo scrivilo nella nota.' }
  }

  const { error } = await supabase
    .from('staff_archive')
    .update({ testo: pulito || null, testo_stato: pulito ? 'corretto' : 'assente' })
    .eq('id', id)

  if (error) return { ok: false, error: messaggio(error) }

  revalidatePath('/staff/archivio')
  return { ok: true }
}

/** Toglie la riga e, se il file era nostro, anche il file. */
export async function eliminaVoceArchivio(id: string): Promise<Esito> {
  await requireStaff()

  const supabase = createClient()

  /* Prima si legge il percorso, poi si cancella la riga, poi il file: in
     quest'ordine, il peggio che può succedere è un file orfano nel bucket, che
     non si vede e non fa danno. Al contrario — file prima, riga poi — un errore
     lascerebbe in elenco una voce che non si apre più. */
  const { data } = await supabase.from('staff_archive').select('file_path').eq('id', id).maybeSingle()

  const { error } = await supabase.from('staff_archive').delete().eq('id', id)
  if (error) return { ok: false, error: messaggio(error) }

  const path = (data as { file_path?: string | null } | null)?.file_path
  if (path) await createAdminClient().storage.from(BUCKET_ARCHIVIO).remove([path])

  revalidatePath('/staff/archivio')
  return { ok: true }
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * I tag, normalizzati.
 *
 * Minuscoli e senza duplicati, e non per pignoleria: la `tsvector` della 0035
 * prende i tag **così come sono**, senza stemming (vedi il commento nella
 * migration), quindi `Prezzi` e `prezzi` sarebbero due lessemi diversi e due
 * voci nell'elenco dei filtri. Un archivio con due tag uguali scritti in modo
 * diverso è un archivio in cui il filtro dimezza i risultati in silenzio.
 */
function leggiTag(grezzo: FormDataEntryValue | null): string[] {
  return Array.from(
    new Set(
      String(grezzo ?? '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0 && t.length <= 32),
    ),
  )
}

/** Solo https, e niente `javascript:` travestito da link. */
function linkValido(v: string): boolean {
  try {
    return new URL(v).protocol === 'https:'
  } catch {
    return false
  }
}

function messaggio(error: { code?: string; message: string }): string {
  if (error.code === '42P01' || error.code === '42703') {
    return 'Manca la migration 0035: eseguila su Supabase e riprova.'
  }
  if (error.code === '42501') {
    return 'Il database ha rifiutato la scrittura: questa voce non è tua.'
  }
  if (error.code === '23514') {
    return 'Una voce vuota non si apre: serve un file, un link, una nota o del testo.'
  }
  return error.message
}
