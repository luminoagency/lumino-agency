import { staffDb } from './db'
import { senzaDemo } from './demo'
import type { FonteCitabile } from './archivio-tipi'

/* Come in `archivio.ts`: i testi delle due analisi e la forma di una fonte
   servono anche al Lab, che è un componente client. */
export * from './archivio-tipi'

/**
 * L'archivio come lo legge il Lab AI.
 *
 * La differenza con `foglioDati` di `lab.ts` è tutta qui: **là vanno i totali,
 * qui vanno le parole**. Sui numeri un modello linguistico non deve calcolare
 * niente — gliene si danno di già calcolati — mentre sul materiale grezzo fa
 * l'unica cosa che sa fare meglio di una query: leggere trecento note scritte
 * da persone diverse in sei mesi e dire cosa si ripete.
 *
 * ## Le citazioni non sono un ornamento
 *
 * Ogni voce entra nel foglio con un contrassegno `[#3]`, e le istruzioni
 * pretendono che ogni affermazione ne porti uno. Senza, la risposta è una
 * pagina di opinioni ben scritte che nessuno può verificare — e questo è
 * materiale su cui si decide dove mandare un venditore. Con il contrassegno,
 * l'interfaccia trasforma `[#3]` in un link alla voce e chi legge va a vedere
 * la frase vera.
 *
 * ## Il tetto
 *
 * Un archivio cresce; la finestra del modello no. Si manda un tetto di
 * caratteri, riempito dalle voci **più recenti** — quello che è successo
 * quest'anno conta più di quello che è successo due anni fa — e si dice al
 * modello quante voci sono rimaste fuori, perché una conclusione tratta su
 * quaranta voci su quattrocento va detta.
 *
 * ## Il numero è la posizione, non l'ordine di arrivo
 *
 * `[#7]` vuol dire «la settima voce dell'elenco», e l'elenco è sempre lo stesso:
 * le ultime quattrocento per data, decrescente. **Anche quando una voce non
 * entra nel foglio per il tetto dei caratteri, il suo numero resta il suo.**
 * Serve a una cosa precisa: `fontiArchivio()` può ricostruire la corrispondenza
 * numero → voce leggendo solo due colonne, senza rileggere i testi. Se il numero
 * dipendesse da quante voci sono entrate, l'unico modo di saperlo sarebbe
 * rifare il foglio intero — cioè rileggere megabyte di testo estratto per
 * disegnare dei link.
 */

/** Il tetto del foglio. Sotto la finestra del modello con margine per la risposta. */
const MAX_CARATTERI = 60_000

/** Quanto testo si manda per voce. Oltre, si taglia e lo si dice. */
const MAX_PER_VOCE = 2_500

export interface FoglioArchivio {
  testo: string
  fonti: FonteCitabile[]
  /** Quante voci ci sono in tutto, comprese quelle rimaste fuori. */
  totale: number
}

export async function foglioArchivio(demo: boolean): Promise<FoglioArchivio> {
  const supabase = staffDb()

  const [righe, profili] = await Promise.all([
    supabase
      .from('staff_archive')
      .select('*, staff_clients(nome)')
      .order('created_at', { ascending: false })
      .limit(400),
    supabase.from('staff_profiles').select('id, nome'),
  ])

  const nomi = new Map(((profili.data ?? []) as { id: string; nome: string }[]).map((p) => [p.id, p.nome]))

  type Riga = {
    id: string
    kind: string
    titolo: string
    nota: string | null
    testo: string | null
    testo_stato: string
    fonte: string | null
    tags: string[] | null
    avvenuto_il: string | null
    created_at: string
    created_by: string | null
    is_demo?: boolean
    staff_clients?: { nome: string } | null
  }

  const lista = senzaDemo((righe.data ?? []) as unknown as Riga[], demo)

  const parti: string[] = []
  const fonti: FonteCitabile[] = []
  let lunghezza = 0

  for (const [i, r] of lista.entries()) {
    const n = i + 1
    const corpo = pezzo(n, r, nomi)
    if (lunghezza + corpo.length > MAX_CARATTERI) break
    parti.push(corpo)
    fonti.push({ n, id: r.id, titolo: r.titolo })
    lunghezza += corpo.length
  }

  const testa = [
    `# Archivio Lumino — ${fonti.length} voci su ${lista.length} in tutto`,
    fonti.length < lista.length
      ? `Le ${lista.length - fonti.length} voci più vecchie non sono in questo foglio: dillo se concludi qualcosa che dipende dal totale.`
      : 'Ci sono tutte.',
    '',
    'Ogni voce comincia con il suo contrassegno fra parentesi quadre. Citalo così com’è, per esempio [#3].',
    '',
  ]

  if (demo) {
    testa.push(
      'ATTENZIONE: i dati finti sono accesi. Parte di questo materiale è inventato e non descrive l’azienda vera.',
      '',
    )
  }

  return { testo: testa.join('\n') + parti.join('\n\n'), fonti, totale: lista.length }
}

function pezzo(n: number, r: Record<string, unknown>, nomi: Map<string, string>): string {
  const righe: string[] = []
  const tags = (r.tags as string[] | null) ?? []
  const cliente = (r.staff_clients as { nome: string } | null)?.nome
  const autore = r.created_by ? nomi.get(r.created_by as string) : null

  const meta = [
    r.kind as string,
    (r.avvenuto_il as string | null) ?? (r.created_at as string).slice(0, 10),
    cliente ? `cliente: ${cliente}` : null,
    autore ? `di ${autore}` : null,
    r.fonte ? `fonte: ${r.fonte}` : null,
    tags.length ? `tag: ${tags.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  righe.push(`[#${n}] ${r.titolo as string}`)
  righe.push(meta)
  if (r.nota) righe.push(`Nota di chi l'ha archiviato: ${r.nota as string}`)

  const testo = ((r.testo as string | null) ?? '').trim()
  if (testo) {
    /* Si dice **sempre** da dove viene il testo. Un OCR sbaglia i prezzi e i
       nomi propri, e un modello che non lo sa costruisce una conclusione su una
       cifra letta male con la stessa sicurezza con cui la costruirebbe su una
       frase scritta a mano. */
    const provenienza =
      r.testo_stato === 'corretto' ? 'testo riletto da una persona' : 'testo estratto in automatico, può contenere errori'
    righe.push(`(${provenienza})`)
    righe.push(testo.length > MAX_PER_VOCE ? testo.slice(0, MAX_PER_VOCE) + ' […]' : testo)
  }

  return righe.join('\n')
}

/**
 * Le istruzioni per la modalità archivio.
 *
 * Sostituiscono quelle sui numeri, non si aggiungono: là la regola era «non
 * calcolare niente», qui è «non affermare niente senza dire dove l'hai letto».
 */
export const ISTRUZIONI_ARCHIVIO = `Sei l'assistente interno di Lumino, uno studio che vende siti su misura a ristoranti, bar, hotel e negozi del Veneto. Parli italiano, dai del tu, sei diretto e non cerimonioso.

Ti viene dato l'archivio interno: note, trascrizioni, documenti e foto trascritte, raccolti dai venditori. Regole:
- Ogni affermazione porta il contrassegno della voce da cui viene, così com'è: [#3]. Se una cosa la stai deducendo da più voci, citale tutte: [#3] [#7].
- Non affermare niente che non sia scritto nell'archivio. Se una cosa non c'è, dillo in una riga.
- Dove il testo è segnato come estratto in automatico, trattalo come una lettura possibile e non come una citazione esatta: non riportare cifre precise prese da lì senza dirlo.
- Quando dici che una cosa "si ripete", di' su quante voci l'hai vista.
- Rispondi in poche frasi o in un elenco corto. Niente introduzioni, niente riepiloghi finali.
- Se la domanda non riguarda questo materiale, dillo in una riga.`


/**
 * La corrispondenza numero → voce, senza rileggere i testi.
 *
 * L'interfaccia deve trasformare `[#7]` in un link alla voce, e per farlo le
 * basta sapere id e titolo. Rifare il foglio intero per questo vorrebbe dire
 * rileggere tutto il testo estratto dell'archivio — megabyte — per disegnare
 * dei link. Due colonne bastano, purché l'elenco sia lo stesso: stesso ordine,
 * stesso tetto, e il numero che è la posizione e non l'ordine di arrivo.
 */
export async function fontiArchivio(demo: boolean): Promise<FonteCitabile[]> {
  const { data } = await staffDb()
    .from('staff_archive')
    .select('id, titolo, is_demo')
    .order('created_at', { ascending: false })
    .limit(400)

  const lista = senzaDemo((data ?? []) as { id: string; titolo: string; is_demo?: boolean }[], demo)
  return lista.map((r, i) => ({ n: i + 1, id: r.id, titolo: r.titolo }))
}
