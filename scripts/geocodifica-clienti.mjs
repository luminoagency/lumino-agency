#!/usr/bin/env node
/**
 * Mette le coordinate ai clienti che non le hanno.
 *
 *   node scripts/geocodifica-clienti.mjs            # la coda: da_fare + non_trovato
 *   node scripts/geocodifica-clienti.mjs --tutti    # rifà tutti quelli con un indirizzo
 *   node scripts/geocodifica-clienti.mjs --prova    # dice cosa farebbe e non scrive
 *
 * ## Perché uno script e non una route
 *
 * Nominatim ammette **una richiesta al secondo**: trecento clienti sono cinque
 * minuti di attesa, e cinque minuti sono più del tempo massimo di una funzione
 * su Vercel. Una route che ci provasse verrebbe interrotta a metà, lasciando
 * metà archivio geocodificato e nessun modo di sapere quale metà. Qui il ritmo
 * si rispetta davvero (1,1 secondi fra una chiamata e l'altra, con un margine) e
 * l'interruzione non è un problema: ogni cliente si scrive appena si trova, e
 * rilanciando lo script riparte da dove si era fermato — la coda è una colonna
 * nel database, non una variabile in memoria.
 *
 * ## Cosa guarda
 *
 * `geo_stato = 'da_fare'` sono gli import CSV e i clienti che c'erano prima
 * della 0041. `non_trovato` si riprova volentieri: fra una settimana e l'altra
 * qualcuno può aver corretto l'indirizzo, e OpenStreetMap stessa cresce — un
 * civico aggiunto da un mappatore locale ieri oggi si trova. `assente` no: non
 * c'è niente da cercare, e ripassarci sopra sarebbe una chiamata per niente a
 * ogni giro.
 *
 * Con `--tutti` si rifanno anche quelli già a `ok`. Serve dopo un import che
 * portava dentro delle coordinate sbagliate: sono quelle che la mappa mostra
 * nel posto giusto-sbagliato, cioè le più difficili da accorgersene.
 */
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/* Lo stesso contatto della route del widget e di lib/staff/geocode.ts: la
   policy di Nominatim chiede uno User-Agent che identifichi l'applicazione. */
const UA = 'LuminoStaffDashboard/1.0 (+https://bylumino.com; staff@bylumino.com)'
const NOMINATIM = 'https://nominatim.openstreetmap.org'

/* Un secondo è il limite; 1,1 è il limite con un margine. Superarlo non dà un
   errore: dà un blocco dell'indirizzo IP, che si scopre il giorno dopo. */
const PAUSA_MS = 1100

/* Lo stesso elenco di lib/staff/geocode.ts, e la stessa ragione: fuori da qui
   Nominatim risponde il centro del comune con un 200 OK, e prenderlo
   vorrebbe dire scrivere nel database che il cliente sta in piazza. */
const TIPI_BUONI = new Set([
  'building',
  'house',
  'house_number',
  'road',
  'residential',
  'pedestrian',
  'amenity',
  'shop',
  'tourism',
  'leisure',
  'office',
  'place_of_worship',
])

async function leggiEnv() {
  const testo = await readFile(new URL('../.env.local', import.meta.url), 'utf8').catch(() => '')
  const env = { ...process.env }
  for (const riga of testo.split(/\r?\n/)) {
    const m = riga.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !env[m[1]]) env[m[1]] = m[2]
  }
  return env
}

const attendi = (ms) => new Promise((r) => setTimeout(r, ms))

async function cerca(params) {
  const q = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', limit: '1', ...params })
  try {
    const r = await fetch(`${NOMINATIM}/search?${q}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'it' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!r.ok) return { errore: `HTTP ${r.status}` }
    const righe = await r.json()
    return { riga: Array.isArray(righe) && righe.length ? righe[0] : null }
  } catch (e) {
    return { errore: String(e?.message ?? e) }
  }
}

/**
 * Le coordinate di un cliente, o il perché non ci sono.
 *
 * Due tentativi: prima la ricerca strutturata (`street` + `city`), che è quella
 * che non sbaglia; poi, solo se la prima non ha trovato niente, la stessa cosa
 * in testo libero — un indirizzo scritto con la frazione dentro la via fa
 * fallire la prima e passare la seconda. Il controllo sul tipo di risultato
 * vale per entrambe, quindi il ripiego non può far entrare un pin sul paese.
 */
async function coordinate(c) {
  const via = (c.indirizzo ?? '').trim()
  const comune = (c.citta ?? '').trim() || (c.zona ?? '').trim()
  if (!via && !comune) return { stato: 'assente' }

  const paese = (c.country ?? 'IT').toLowerCase()
  const base = { countrycodes: paese }

  let { riga, errore } = await cerca({
    ...base,
    ...(via ? { street: via } : {}),
    ...(comune ? { city: comune } : {}),
  })
  /* Un errore di rete **non** è «non trovato»: scriverlo come tale metterebbe
     l'avviso «controlla l'indirizzo» su una scheda con l'indirizzo giusto. Si
     lascia in coda e si riprova al prossimo giro. */
  if (errore) return { stato: null, errore }

  if (!riga && via && comune) {
    await attendi(PAUSA_MS)
    const secondo = await cerca({ ...base, q: `${via}, ${comune}` })
    if (secondo.errore) return { stato: null, errore: secondo.errore }
    riga = secondo.riga
  }

  if (!riga) return { stato: 'non_trovato' }

  const lat = Number(riga.lat)
  const lng = Number(riga.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { stato: 'non_trovato' }

  const tipo = (riga.addresstype || riga.category || '').toLowerCase()
  if (via && !TIPI_BUONI.has(tipo)) {
    return { stato: 'non_trovato', nota: `trovato solo «${tipo}»` }
  }

  return { stato: 'ok', lat, lng, nota: riga.display_name }
}

async function main() {
  const env = await leggiEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }

  const tutti = process.argv.includes('--tutti')
  const prova = process.argv.includes('--prova')

  const { createClient } = require('@supabase/supabase-js')
  const sb = createClient(url, key, { auth: { persistSession: false } })

  let q = sb
    .from('staff_clients')
    .select('id, nome, indirizzo, citta, zona, country, lat, lng, geo_stato')
    .order('created_at', { ascending: true })

  /* `in` e non `neq('geo_stato','ok')`: la differenza è `assente`, che con il
     secondo entrerebbe in coda a ogni giro per non trovare mai niente. */
  if (!tutti) q = q.in('geo_stato', ['da_fare', 'non_trovato'])

  const { data, error } = await q
  if (error) throw new Error(error.message)

  const coda = (data ?? []).filter((c) => (c.indirizzo ?? '').trim() || (c.citta ?? '').trim())
  const senzaNiente = (data ?? []).length - coda.length

  console.log(
    `${coda.length} client${coda.length === 1 ? 'e' : 'i'} da geocodificare` +
      (senzaNiente ? `, ${senzaNiente} senza indirizzo (passano a «assente»)` : '') +
      (prova ? ' — prova, non scrivo niente' : ''),
  )

  /* I clienti senza niente da cercare si chiudono subito, in una scrittura:
     sono già fuori dalla coda vera e tenerli a `da_fare` li farebbe ricontare a
     ogni lancio dello script. */
  if (!prova && senzaNiente) {
    const ids = (data ?? []).filter((c) => !coda.includes(c)).map((c) => c.id)
    await sb
      .from('staff_clients')
      .update({ geo_stato: 'assente', geo_at: new Date().toISOString() })
      .in('id', ids)
  }

  const conto = { ok: 0, non_trovato: 0, errore: 0 }

  for (const [i, c] of coda.entries()) {
    const r = await coordinate(c)
    const dove = [c.indirizzo, c.citta].filter(Boolean).join(', ')

    if (r.stato === null) {
      conto.errore += 1
      console.log(`  [${i + 1}/${coda.length}] ${c.nome} — rete: ${r.errore}, resta in coda`)
    } else if (r.stato === 'ok') {
      conto.ok += 1
      console.log(`  [${i + 1}/${coda.length}] ${c.nome} — ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`)
      if (!prova) {
        const { error: e } = await sb
          .from('staff_clients')
          .update({ lat: r.lat, lng: r.lng, geo_stato: 'ok', geo_at: new Date().toISOString() })
          .eq('id', c.id)
        if (e) console.log(`      non salvato: ${e.message}`)
      }
    } else {
      conto.non_trovato += 1
      console.log(
        `  [${i + 1}/${coda.length}] ${c.nome} — non trovato (${dove})${r.nota ? `: ${r.nota}` : ''}`,
      )
      if (!prova) {
        /* Le coordinate vecchie si **cancellano**: se erano sbagliate, lasciarle
           vorrebbe dire un pin nel posto errato con accanto l'avviso che la
           posizione non è stata trovata. Due informazioni che si contraddicono
           sulla stessa scheda. */
        const { error: e } = await sb
          .from('staff_clients')
          .update({
            lat: null,
            lng: null,
            geo_stato: 'non_trovato',
            geo_at: new Date().toISOString(),
          })
          .eq('id', c.id)
        if (e) console.log(`      non salvato: ${e.message}`)
      }
    }

    if (i < coda.length - 1) await attendi(PAUSA_MS)
  }

  console.log(
    `\nFatto: ${conto.ok} trovati, ${conto.non_trovato} da correggere a mano, ${conto.errore} rimasti in coda per la rete.`,
  )
  if (conto.non_trovato) {
    console.log(
      'I «non trovati» hanno l’avviso nella scheda cliente: si corregge l’indirizzo e il pin si rifà al salvataggio.',
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
