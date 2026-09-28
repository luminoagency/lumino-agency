import { cache } from 'react'
import { caricaSoldi, caricaStatistiche } from './f4'
import { staffDb } from './db'
import { senzaDemo } from './demo'
import { SETTORE_LABEL, STATO_LABEL, euro, type Stato } from './types'

/**
 * Il Lab AI: quello che il modello ha il diritto di sapere.
 *
 * ## La decisione che conta: al modello vanno i totali, non le righe
 *
 * Sarebbe stato più semplice passare a Gemini l'elenco dei clienti e lasciargli
 * fare i conti. Non si fa, per tre ragioni in ordine di importanza:
 *
 *  1. **Sono dati di persone.** Nomi di locali, titolari, telefoni, indirizzi e
 *     le frasi dette in privato durante una visita. Mandarli a un servizio
 *     esterno perché qualcuno ha chiesto «come sta andando?» è una cosa che non
 *     si può disfare. Un totale per settore non è di nessuno.
 *  2. **I conti fatti da un modello linguistico sono opinioni.** Il tasso di
 *     chiusura lo calcola `caricaStatistiche`, con le sue regole — il
 *     denominatore sono le trattative *decise*, e quella scelta è documentata e
 *     discutibile. Se il Lab ricontasse per conto suo direbbe un numero diverso
 *     da quello della pagina Statistiche, e quale dei due sia giusto non lo
 *     saprebbe nessuno. Qui il Lab **legge la stessa funzione della pagina**:
 *     non può contraddirla.
 *  3. Il piano gratuito ha un tetto di token, e ventimila righe lo bruciano in
 *     una domanda.
 *
 * Quello che resta è un foglio di una cinquantina di righe che dice tutto ciò
 * che serve per rispondere alle domande vere — quali settori chiudono, dove, a
 * che prezzo, cosa rispondono i titolari quando dicono di no.
 *
 * ## Una sola eccezione
 *
 * Le obiezioni e le frasi dei titolari passano, perché sono il contenuto su cui
 * si fanno le domande interessanti («cosa ci dicono più spesso quelli che non
 * comprano?») e senza di esse il Lab saprebbe solo contare. Passano **senza il
 * nome del locale**: la frase serve, chi l'ha detta no.
 */

/**
 * Il modello, e il modo di cambiarlo senza toccare il codice.
 *
 * Legge una variabile d'ambiente **perché l'elenco dei modelli disponibili si
 * accorcia da solo**. Il codice diceva `gemini-2.0-flash`; alla prima chiamata
 * vera l'API ha risposto 404 con «no longer available to new users» e ha indicato
 * il successore — e lo stesso vale ormai per la 2.5. Non è una cosa che si può
 * prevenire scrivendo il nome giusto una volta: si previene facendo sì che
 * cambiarlo non richieda un deploy. `GEMINI_MODEL` su Vercel e il Lab riparte.
 *
 * Non si usa l'alias `gemini-flash-latest`, che pure esiste, per due ragioni: si
 * sposta da solo — una mattina le risposte cambiano tono senza che nessuno abbia
 * toccato niente, e le regole in `ISTRUZIONI` sono calibrate su un modello
 * preciso — e in prova rispondeva 503 per carico mentre il modello nominato
 * rispondeva subito.
 */
export const MODELLO = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash'

/** La chiave c'è? È l'unica cosa che decide se la sezione è viva o spenta. */
export function labAttivo(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

/* Riesportati da `lab-tipi.ts`, che è l'unico pezzo di questo modulo che possa
   entrare in un componente client — questo file arriva a `next/headers` passando
   per f4.ts e db.ts. Vedi il commento là. */
export { TIPI_INSIGHT, eTipoInsight } from './lab-tipi'
export type { Insight, TipoInsight } from './lab-tipi'

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Il foglio dei dati, in italiano.
 *
 * Testo e non JSON. Un modello linguistico legge meglio una frase di una
 * struttura, e — cosa più importante — un foglio leggibile è un foglio
 * **ispezionabile**: la pagina lo mostra dietro un dettaglio richiudibile, così
 * chi fa la domanda vede esattamente cosa è partito. Un JSON di duecento righe
 * non lo guarderebbe nessuno, e «cosa ha visto il modello» tornerebbe a essere
 * una cosa da chiedere a uno sviluppatore.
 *
 * `cache()` perché la route lo costruisce e la pagina lo mostra nello stesso
 * render: senza, sarebbero due giri completi di query per lo stesso foglio.
 */
export const foglioDati = cache(async function foglioDati(
  demo: boolean,
  isAdmin: boolean,
): Promise<string> {
  const [stat, soldi, clienti] = await Promise.all([
    caricaStatistiche(demo),
    caricaSoldi(demo, isAdmin),
    contaClienti(demo),
  ])

  const r: string[] = []
  const pct = (v: number) => `${Math.round(v)}%`

  r.push(`Data di oggi: ${new Date().toISOString().slice(0, 10)}.`)
  r.push('')
  r.push('## Clienti in archivio')
  r.push(`Totale: ${clienti.totale}.`)
  for (const [stato, n] of clienti.perStato) r.push(`- ${STATO_LABEL[stato]}: ${n}`)
  if (clienti.perSettore.length) {
    r.push('Per settore: ' + clienti.perSettore.map(([s, n]) => `${s} ${n}`).join(', ') + '.')
  }

  r.push('')
  r.push('## Chiusure')
  r.push(
    `Tasso di chiusura ${pct(stat.tasso)} su ${stat.decise} trattative decise (${stat.chiuse} chiuse).`,
  )
  r.push(`Prezzo medio di una chiusura: ${euro(stat.prezzoMedio)}.`)
  if (stat.giorniMedi !== null) r.push(`Giorni medi dalla proposta alla firma: ${stat.giorniMedi}.`)

  r.push('')
  r.push('## Per settore (nome, trattative decise, chiuse, tasso, valore medio)')
  for (const t of stat.perSettore) {
    r.push(`- ${t.nome}: ${t.decise} decise, ${t.chiuse} chiuse, ${pct(t.tasso)}, ${euro(t.medio)}`)
  }

  r.push('')
  r.push('## Per zona')
  for (const t of stat.perZona) {
    r.push(`- ${t.nome}: ${t.decise} decise, ${t.chiuse} chiuse, ${pct(t.tasso)}, ${euro(t.medio)}`)
  }

  /* Il taglio per venditore va al modello solo per l'admin, che è l'unico a cui
     la RLS lo mostrerebbe comunque. Non è riservatezza verso Google: è che a un
     venditore quel dato non appartiene, e il Lab non deve diventare la porta di
     servizio da cui esce ciò che la pagina Statistiche non fa vedere. */
  if (isAdmin && stat.perVenditore.length) {
    r.push('')
    r.push('## Per venditore')
    for (const t of stat.perVenditore) {
      r.push(`- ${t.nome}: ${t.decise} decise, ${t.chiuse} chiuse, ${pct(t.tasso)}`)
    }
  }

  if (stat.obiezioni.length) {
    r.push('')
    r.push('## Obiezioni sentite in campo, dalla più frequente')
    for (const o of stat.obiezioni) r.push(`- ${o.nome}: ${o.n} volte`)
  }

  if (stat.frasi.length) {
    r.push('')
    r.push('## Frasi dei titolari (senza il nome del locale)')
    for (const f of stat.frasi.slice(0, 20)) r.push(`- «${f.testo}»`)
  }

  r.push('')
  r.push('## Soldi')
  r.push(`Incassato: ${euro(soldi.incassato)}. Da incassare: ${euro(soldi.daIncassare)}.`)
  if (soldi.extraDaIncassare > 0) r.push(`Modifiche extra da incassare: ${euro(soldi.extraDaIncassare)}.`)
  r.push(
    `Entrate ricorrenti mensili: ${euro(soldi.ricorrenti)} da ${soldi.abbonamenti.length} abbonamenti attivi.`,
  )

  if (stat.mesi.length) {
    r.push('')
    r.push('## Andamento per mese')
    r.push(stat.mesi.map((m) => `${m.label} ${euro(m.value)}`).join(', ') + '.')
  }

  if (demo) {
    r.push('')
    r.push(
      'ATTENZIONE: i dati finti sono accesi. Questi numeri comprendono clienti inventati e non descrivono l’azienda vera.',
    )
  }

  return r.join('\n')
})

/**
 * Le istruzioni al modello.
 *
 * Tre regole, e ognuna nasce da un modo specifico in cui un assistente sui dati
 * diventa dannoso:
 *  · **non inventare numeri** — un modello a cui manca un dato ne produce uno
 *    plausibile, e un numero plausibile in una dashboard è peggio di un vuoto;
 *  · **dire su quanti casi** — con nove trattative decise ogni percentuale è
 *    rumore, e chi legge deve saperlo prima di cambiare strategia;
 *  · **poche frasi** — la risposta si legge su un telefono, in macchina, fra
 *    due visite.
 */
export const ISTRUZIONI = `Sei l'assistente interno di Lumino, uno studio che vende siti su misura a ristoranti, bar, hotel e negozi del Veneto. Parli italiano, dai del tu, sei diretto e non cerimonioso.

Rispondi SOLO con i dati del foglio che ti viene dato. Regole:
- Non inventare mai un numero. Se un dato non c'è, dillo in una riga e fermati.
- Quando citi una percentuale, di' sempre su quanti casi è calcolata.
- Se un gruppo ha meno di tre trattative decise, avverti che il numero non è affidabile.
- Rispondi in poche frasi. Niente introduzioni, niente riepiloghi finali, niente elenchi lunghi.
- Se la domanda non riguarda questi dati, dillo in una riga.`

/* ─────────────────────────────────────────────────────────────────────────── */

async function contaClienti(demo: boolean) {
  const supabase = staffDb()
  /* `*` e non l'elenco delle colonne: serve `is_demo`, che arriva con la 0031.
     È la stessa ragione documentata sulla home. */
  const { data } = await supabase.from('staff_clients').select('*')
  const righe = senzaDemo((data ?? []) as { stato: Stato; settore: string | null }[], demo)

  const perStato = new Map<Stato, number>()
  const perSettore = new Map<string, number>()
  for (const riga of righe) {
    perStato.set(riga.stato, (perStato.get(riga.stato) ?? 0) + 1)
    const chiave = riga.settore as keyof typeof SETTORE_LABEL | null
    const nome = chiave ? (SETTORE_LABEL[chiave] ?? chiave) : 'non detto'
    perSettore.set(nome, (perSettore.get(nome) ?? 0) + 1)
  }

  return {
    totale: righe.length,
    perStato: [...perStato.entries()].sort((a, b) => b[1] - a[1]),
    perSettore: [...perSettore.entries()].sort((a, b) => b[1] - a[1]),
  }
}
