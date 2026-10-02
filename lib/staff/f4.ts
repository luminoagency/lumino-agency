import { staffDb } from './db'
import { senzaDemo } from './demo'
import { vociPagamento, type VocePagamento } from './pagamenti'
import {
  FASI_PROGETTO,
  STAFF_COUNTRY,
  type FaseProgetto,
  type Pacchetto,
  type Settore,
  type Stato,
} from './types'

/**
 * Le letture della fase 4: Soldi, Progetti, Statistiche.
 *
 * Stanno in un file loro e non dentro `queries.ts` per un motivo pratico: quello
 * importa `storage.ts`, che importa la service-role per firmare le foto del
 * Campo. Tre pagine che non mostrano nemmeno una foto non devono portarsi dietro
 * quella dipendenza — e il giorno che una di queste diventa un endpoint pubblico
 * per sbaglio, la chiave non è nel grafo dei suoi import.
 *
 * Tutte le somme si fanno **in memoria e non in SQL**. Con `sum()` e `group by`
 * il conto lo farebbe Postgres, che è il posto giusto per milioni di righe; qui
 * si parla di centinaia, e in cambio si ottengono due cose che valgono più di
 * quei millisecondi: il filtro dei dati demo si applica dopo la lettura (vedi
 * `senzaDemo`, e la ragione sta in `demo.ts`), e la RLS resta l'unica regola su
 * chi vede cosa, senza una vista o una funzione da tenere in pari.
 */

/* `*` e non l'elenco delle colonne: serve `is_demo`, che su un database dove la
   0031 (o la 0032) non è passata non esiste, e nominarla farebbe fallire la
   query invece di una colonna in meno. */
const TUTTO = '*'

/** Il codice che Postgres restituisce quando la tabella non esiste. */
function mancano(...risposte: { error?: { code?: string } | null }[]): boolean {
  return risposte.some((r) => r.error?.code === '42P01')
}

/* ═══════════════════════════════════════════════════════════════════════════
   Soldi
   ═══════════════════════════════════════════════════════════════════════════ */

export interface RigaIncasso {
  /** L'id della trattativa: serve ai bottoni «ricevuto». */
  id: string
  cliente: string
  clientId: string
  /** Le voci ancora da incassare, con la chiave che il bottone deve mandare. */
  daSegnare: VocePagamento[]
  pacchetto: Pacchetto | null
  /** Quanto vale la trattativa: il chiuso, o il proposto se non è chiusa. */
  totale: number
  /** La quota che manca: 30, 70 o 100 per cento di `totale`. */
  mancante: number
  /** Cosa manca, in parole e con l'articolo: «l'acconto», «l'acconto e il saldo». */
  cosa: string
  /** Da quanti giorni è chiusa. Serve a ordinare per anzianità del credito. */
  giorni: number
  dataChiusura: string | null
}

export interface RigaAbbonamento {
  id: string
  cliente: string
  clientId: string
  tipo: string
  importo: number
  rinnovo: string | null
  /** Il canone di questo mese risulta incassato. */
  pagatoQuestoMese: boolean
}

export interface RigaExtra {
  id: string
  cliente: string
  clientId: string | null
  descrizione: string | null
  prezzo: number
  pagato: boolean
  created_at: string
}

export interface DatiSoldi {
  /** Incassato e da incassare sulle trattative chiuse. */
  incassato: number
  daIncassare: number
  /** Solo la parte già consegnata e non pagata: è quella da sollecitare. */
  scoperti: RigaIncasso[]
  /** Entrate ricorrenti mensili. */
  ricorrenti: number
  abbonamenti: RigaAbbonamento[]
  extra: RigaExtra[]
  extraDaIncassare: number
  /** Per mese, negli ultimi dodici: quanto è entrato. */
  mesi: { label: string; value: number }[]
  /** Margine complessivo, solo per l'admin: `null` per un venditore. */
  margine: { costo: number; margine: number; su: number } | null
  mancaSchema: boolean
}

/**
 * Quello che serve alla pagina Soldi.
 *
 * Il modello di default è quello del piano — **30% all'ordine, 70% alla messa
 * online** — ma dalla 0038 una trattativa può anche essere a pagamento unico, e
 * in quante voci si divida lo dice `vociPagamento()` e non questa funzione:
 * cinque pagine facevano lo stesso conto a mano, e con due modalità sarebbero
 * diventate cinque occasioni di dire numeri diversi. Incassato e residuo si
 * ricavano comunque dalle spunte e non da un campo «pagato» tenuto in pari a
 * mano: un totale che si può aggiornare da solo non può andare fuori sincrono
 * con le sue parti.
 *
 * Gli extra si incrociano in memoria passando per i progetti, e non con una join
 * annidata: `staff_extra_changes` punta al progetto, il progetto al cliente, e
 * chiedere a PostgREST due livelli di relazione costringerebbe anche il finto
 * client dell'anteprima a saperli gestire. Sono tre `Map`.
 *
 * I margini si leggono **solo per l'admin**, e non per una `if` di cortesia: la
 * RLS di `staff_deal_margins` risponde con zero righe a un venditore, quindi la
 * richiesta si evita perché sarebbe inutile, non perché sia lei a proteggere il
 * dato. La protezione sta nel database (vedi il piano: admin e sales sono lo
 * stesso ruolo Postgres, l'unico modo serio di nascondere una colonna è non dare
 * le righe).
 */
export async function caricaSoldi(demo: boolean, isAdmin: boolean): Promise<DatiSoldi> {
  const supabase = staffDb()

  const [deals, subs, canoni, extras, progetti, clienti, margini] = await Promise.all([
    supabase.from('staff_deals').select(TUTTO),
    supabase.from('staff_subscriptions').select(TUTTO).eq('attivo', true),
    supabase.from('staff_subscription_payments').select(TUTTO),
    supabase.from('staff_extra_changes').select(TUTTO).order('created_at', { ascending: false }),
    supabase.from('staff_projects').select(TUTTO),
    supabase.from('staff_clients').select(TUTTO).eq('country', STAFF_COUNTRY),
    isAdmin
      ? supabase.from('staff_deal_margins').select(TUTTO)
      : Promise.resolve({ data: [], error: null }),
  ])

  const righeCliente = senzaDemo((clienti.data ?? []) as RigaCliente[], demo)
  const nomi = new Map(righeCliente.map((c) => [c.id, c.nome]))
  const righeDeal = senzaDemo((deals.data ?? []) as RigaDeal[], demo)
  const righeProgetto = senzaDemo((progetti.data ?? []) as RigaProgetto[], demo)
  const clientePerProgetto = new Map(righeProgetto.map((p) => [p.id, p.client_id]))

  let incassato = 0
  let daIncassare = 0
  const scoperti: RigaIncasso[] = []
  const perMese = new Map<string, number>()

  for (const d of righeDeal) {
    const voci = vociPagamento(d)
    if (!voci.length) continue
    const totale = voci.reduce((s, v) => s + v.importo, 0)

    let mancante = 0
    const manca: string[] = []

    for (const v of voci) {
      if (v.pagato) {
        incassato += v.importo
        segna(perMese, v.data ?? d.data_chiusura!, v.importo)
      } else {
        daIncassare += v.importo
        mancante += v.importo
        manca.push(v.nome)
      }
    }

    if (mancante > 0) {
      scoperti.push({
        id: d.id,
        daSegnare: voci.filter((v) => !v.pagato),
        cliente: nomi.get(d.client_id) ?? 'Cliente',
        clientId: d.client_id,
        pacchetto: d.pacchetto,
        totale,
        mancante,
        cosa: manca.join(' e '),
        giorni: giorniDa(d.data_chiusura!),
        dataChiusura: d.data_chiusura,
      })
    }
  }

  /* Il credito più vecchio per primo: è quello che va sollecitato, e in una lista
     di solleciti l'ordine è già metà della decisione. */
  scoperti.sort((a, b) => b.giorni - a.giorni)

  const righeAbb = senzaDemo((subs.data ?? []) as RigaSub[], demo)
  /* I canoni incassati: `{abbonamento}|{mese}` perché la domanda che la pagina
     fa è sempre «questo abbonamento, questo mese», e una chiave composta
     risponde senza scorrere l'elenco per ogni riga. */
  const righeCanone = senzaDemo((canoni.data ?? []) as RigaCanone[], demo)
  const canoniSegnati = new Set(
    righeCanone.map((c) => `${c.subscription_id}|${c.mese.slice(0, 7)}`),
  )
  const meseCorrente = new Date().toISOString().slice(0, 7)

  const abbonamenti: RigaAbbonamento[] = righeAbb
    .map((a) => ({
      id: a.id,
      cliente: nomi.get(a.client_id) ?? 'Cliente',
      clientId: a.client_id,
      tipo: a.tipo,
      importo: Number(a.importo_mensile ?? 0),
      rinnovo: a.data_rinnovo,
      pagatoQuestoMese: canoniSegnati.has(`${a.id}|${meseCorrente}`),
    }))
    .sort((a, b) => (a.rinnovo ?? '9999').localeCompare(b.rinnovo ?? '9999'))

  const righeExtra = senzaDemo((extras.data ?? []) as RigaExtraDb[], demo)
  const extra: RigaExtra[] = righeExtra.map((e) => {
    const clientId = clientePerProgetto.get(e.project_id) ?? null
    return {
      id: e.id,
      cliente: (clientId && nomi.get(clientId)) || 'Progetto',
      clientId,
      descrizione: e.descrizione,
      prezzo: Number(e.prezzo ?? 0),
      pagato: e.pagato,
      created_at: e.created_at,
    }
  })

  /* Gli extra pagati entrano negli incassi del loro mese: sono soldi entrati
     come gli altri, e tenerli fuori farebbe sembrare il mese più magro di
     com'è stato. **Stessa cosa per i canoni**, e per loro conta `incassato_il`
     e non il mese di competenza: un canone di settembre pagato a ottobre è un
     incasso di ottobre, come un saldo. */
  for (const e of extra) if (e.pagato) segna(perMese, e.created_at, e.prezzo)
  for (const c of righeCanone) segna(perMese, c.incassato_il, Number(c.importo ?? 0))

  const idDemo = new Set(righeDeal.map((d) => d.id))
  const righeMargine = ((margini.data ?? []) as RigaMargine[]).filter((m) => idDemo.has(m.deal_id))
  const margine = isAdmin
    ? righeMargine.reduce(
        (acc, m) => ({
          costo: acc.costo + Number(m.costo_interno ?? 0),
          margine: acc.margine + Number(m.margine ?? 0),
          su: acc.su + 1,
        }),
        { costo: 0, margine: 0, su: 0 },
      )
    : null

  return {
    incassato,
    daIncassare,
    scoperti,
    ricorrenti: abbonamenti.reduce((s, a) => s + a.importo, 0),
    abbonamenti,
    extra,
    extraDaIncassare: extra.filter((e) => !e.pagato).reduce((s, e) => s + e.prezzo, 0),
    mesi: ultimiDodiciMesi(perMese),
    margine,
    mancaSchema: mancano(deals, subs, progetti, clienti),
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Progetti
   ═══════════════════════════════════════════════════════════════════════════ */

export interface RigaProgettoVista {
  id: string
  cliente: string
  clientId: string
  settore: Settore | null
  citta: string | null
  fase: FaseProgetto
  previewUrl: string | null
  dominio: string | null
  scadenzaDominio: string | null
  /** Giorni che restano al dominio. Negativo vuol dire già scaduto. */
  giorniDominio: number | null
  extraAperti: number
  aggiornato: string
}

export interface DatiProgetti {
  progetti: RigaProgettoVista[]
  /** Quanti progetti in ogni fase, nell'ordine del piano. */
  perFase: { fase: FaseProgetto; n: number }[]
  /** I domini che scadono entro 60 giorni, o già scaduti. */
  domini: RigaProgettoVista[]
  mancaSchema: boolean
}

/**
 * Quello che serve alla pagina Progetti.
 *
 * Due cose che la pagina deve saper dire e che qui si preparano:
 *
 * - **dove è arrivato ogni sito** (la fase, che è un enum ordinato: brief →
 *   online), e quanti ce n'è in ognuna;
 * - **quali domini stanno scadendo**, con i già scaduti in cima e non in fondo.
 *   Un dominio scaduto è un sito offline, cioè un cliente che chiama: è la sola
 *   informazione urgente di tutta la sezione, e la soglia dei 60 giorni è la
 *   finestra in cui un rinnovo si può ancora fare senza fretta.
 *
 * Il nome del cliente arriva dall'embed (`staff_clients` è l'unica relazione
 * annidata che quest'area usa, e il finto client dell'anteprima la conosce), gli
 * extra aperti si contano in memoria.
 */
export async function caricaProgetti(demo: boolean): Promise<DatiProgetti> {
  const supabase = staffDb()

  const [progetti, extras] = await Promise.all([
    supabase
      .from('staff_projects')
      .select(`${TUTTO}, staff_clients ( nome, settore, citta )`)
      .order('updated_at', { ascending: false }),
    supabase.from('staff_extra_changes').select(TUTTO),
  ])

  const apertiPerProgetto = new Map<string, number>()
  for (const e of senzaDemo((extras.data ?? []) as RigaExtraDb[], demo)) {
    if (e.pagato) continue
    apertiPerProgetto.set(e.project_id, (apertiPerProgetto.get(e.project_id) ?? 0) + 1)
  }

  const righe: RigaProgettoVista[] = senzaDemo(
    (progetti.data ?? []) as RigaProgettoEmbed[],
    demo,
  ).map((p) => {
    const c = primo(p.staff_clients)
    return {
      id: p.id,
      cliente: c?.nome ?? 'Cliente',
      clientId: p.client_id,
      settore: c?.settore ?? null,
      citta: c?.citta ?? null,
      fase: p.fase,
      previewUrl: p.preview_url,
      dominio: p.dominio,
      scadenzaDominio: p.scadenza_dominio,
      giorniDominio: p.scadenza_dominio ? -giorniDa(p.scadenza_dominio) : null,
      extraAperti: apertiPerProgetto.get(p.id) ?? 0,
      aggiornato: p.updated_at ?? p.created_at,
    }
  })

  return {
    progetti: righe,
    perFase: FASI_PROGETTO.map((fase) => ({
      fase,
      n: righe.filter((p) => p.fase === fase).length,
    })),
    domini: righe
      .filter((p) => p.giorniDominio != null && p.giorniDominio <= 60)
      .sort((a, b) => (a.giorniDominio ?? 0) - (b.giorniDominio ?? 0)),
    mancaSchema: mancano(progetti),
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Statistiche
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Taglio {
  /** Come si chiama il gruppo: un settore, una zona, un venditore. */
  nome: string
  /** Quante trattative sono arrivate a una conclusione, in un senso o nell'altro. */
  decise: number
  chiuse: number
  /** Percentuale di chiusura sulle decise. Non sul totale: vedi sotto. */
  tasso: number
  /** Valore medio del chiuso, in euro. */
  medio: number
  incassato: number
}

export interface PuntoMappa {
  nome: string
  lat: number
  lng: number
  n: number
}

export interface DatiStatistiche {
  /** Tasso di chiusura complessivo, sulle trattative decise. */
  tasso: number
  decise: number
  chiuse: number
  /** Prezzo medio di una chiusura. */
  prezzoMedio: number
  /* I prezzi chiusi, dal piu basso al piu alto. La media da sola non dice se
     sono tutti li intorno o se sono due a quattromila e otto a mille, ed e
     esattamente la differenza fra un listino che tiene e una media che non
     descrive nessuno.

   */

  prezzi: number[]
  /** Giorni medi fra la proposta e la firma. */
  giorniMedi: number | null
  perSettore: Taglio[]
  perZona: Taglio[]
  perVenditore: Taglio[]
  /** Le obiezioni sentite in campo, dalla più frequente. */
  obiezioni: { nome: string; n: number }[]
  /** Le ultime frasi dei titolari, con chi le ha dette. */
  frasi: { id: string; testo: string; cliente: string }[]
  zone: PuntoMappa[]
  mesi: { label: string; value: number }[]
  mancaSchema: boolean
}

/**
 * Quello che serve alla pagina Statistiche.
 *
 * ## Il tasso di chiusura si calcola sulle trattative *decise*
 *
 * È la scelta che conta di tutta questa funzione. Il denominatore sono i clienti
 * arrivati a un sì o a un no (`accettato` + `rifiutato`), non tutti i clienti in
 * archivio. Contare anche chi è ancora «da contattare» farebbe scendere il tasso
 * ogni volta che si importa una lista di lead — cioè peggiorerebbe il numero
 * proprio nel momento in cui si sta lavorando di più. Un tasso che punisce il
 * lavoro non lo guarda nessuno due volte.
 *
 * Il rovescio è che con pochi dati il numero balla, e la pagina lo dice: accanto
 * alla percentuale c'è sempre «su quante», che è l'unico modo onesto di mostrare
 * una percentuale calcolata su nove casi.
 *
 * ## I tre tagli
 *
 * Settore, zona e venditore, cioè le tre domande vere: cosa conviene vendere,
 * dove, e chi sta chiudendo. I gruppi con **meno di tre decise** si tengono ma
 * finiscono in fondo: un settore con una sola trattativa vinta mostrerebbe il
 * 100% e starebbe in cima a una classifica di cui non fa parte.
 */
export async function caricaStatistiche(demo: boolean): Promise<DatiStatistiche> {
  const supabase = staffDb()

  const [clienti, deals, profili, reports] = await Promise.all([
    supabase.from('staff_clients').select(TUTTO).eq('country', STAFF_COUNTRY),
    supabase.from('staff_deals').select(TUTTO),
    supabase.from('staff_profiles').select('id, nome'),
    supabase
      .from('staff_field_reports')
      .select(`${TUTTO}, staff_clients ( nome )`)
      .order('created_at', { ascending: false }),
  ])

  const righeCliente = senzaDemo((clienti.data ?? []) as RigaCliente[], demo)
  const righeDeal = senzaDemo((deals.data ?? []) as RigaDeal[], demo)
  const nomiStaff = new Map(
    ((profili.data ?? []) as { id: string; nome: string }[]).map((p) => [p.id, p.nome]),
  )
  const dealPerCliente = new Map<string, RigaDeal>()
  for (const d of righeDeal) dealPerCliente.set(d.client_id, d)

  const decise = righeCliente.filter((c) => c.stato === 'accettato' || c.stato === 'rifiutato')
  const chiuse = decise.filter((c) => c.stato === 'accettato')

  const prezzi = chiuse
    .map((c) => Number(dealPerCliente.get(c.id)?.prezzo_chiuso ?? 0))
    .filter((v) => v > 0)

  /* Giorni fra proposta e firma: solo dove ci sono entrambe le date. Riempire i
     buchi con la data di creazione del cliente gonfierebbe la media di tutti i
     lead vecchi mai toccati. */
  const durate = righeDeal
    .filter((d) => d.data_proposta && d.data_chiusura)
    .map(
      (d) =>
        (new Date(`${d.data_chiusura}T12:00:00`).getTime() -
          new Date(`${d.data_proposta}T12:00:00`).getTime()) /
        86_400_000,
    )
    .filter((g) => g >= 0)

  const taglio = (chiave: (c: RigaCliente) => string | null): Taglio[] => {
    const gruppi = new Map<string, RigaCliente[]>()
    for (const c of decise) {
      const k = chiave(c)
      if (!k) continue
      const g = gruppi.get(k)
      if (g) g.push(c)
      else gruppi.set(k, [c])
    }

    return (
      Array.from(gruppi.entries())
        .map(([nome, righe]) => {
          const vinte = righe.filter((c) => c.stato === 'accettato')
          const valori = vinte
            .map((c) => Number(dealPerCliente.get(c.id)?.prezzo_chiuso ?? 0))
            .filter((v) => v > 0)
          return {
            nome,
            decise: righe.length,
            chiuse: vinte.length,
            tasso: righe.length ? (vinte.length / righe.length) * 100 : 0,
            medio: media(valori),
            incassato: valori.reduce((s, v) => s + v, 0),
          }
        })
        /* I gruppi con meno di tre decise vanno in fondo: il loro tasso è rumore, e
         in cima a una classifica il rumore sembra un risultato. */
        .sort((a, b) => {
          const solidoA = a.decise >= 3 ? 1 : 0
          const solidoB = b.decise >= 3 ? 1 : 0
          if (solidoA !== solidoB) return solidoB - solidoA
          return b.tasso - a.tasso || b.decise - a.decise
        })
    )
  }

  const righeReport = senzaDemo((reports.data ?? []) as RigaReport[], demo)

  const conteggioObiezioni = new Map<string, number>()
  for (const r of righeReport) {
    if (!r.obiezione_principale) continue
    conteggioObiezioni.set(
      r.obiezione_principale,
      (conteggioObiezioni.get(r.obiezione_principale) ?? 0) + 1,
    )
  }

  /* Le frasi dei titolari, testuali. Sono il dato più prezioso che quest'area
     raccoglie e il solo che nessun CRM comprato avrebbe: un'obiezione contata è
     una statistica, la stessa obiezione detta con le parole di chi l'ha detta è
     un argomento di vendita. Le ultime tre, non le più lunghe — qui interessa
     cosa si sente dire adesso. */
  const frasi = righeReport
    .filter((r) => r.frase_titolare && r.frase_titolare.trim())
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      testo: r.frase_titolare as string,
      cliente: primo(r.staff_clients)?.nome ?? 'Un titolare',
    }))

  const perCitta = new Map<string, { lat: number; lng: number; n: number }>()
  for (const c of righeCliente) {
    if (!c.citta || c.lat == null || c.lng == null) continue
    const corrente = perCitta.get(c.citta)
    if (corrente) corrente.n += 1
    else perCitta.set(c.citta, { lat: c.lat, lng: c.lng, n: 1 })
  }

  const perMese = new Map<string, number>()
  for (const d of righeDeal) {
    if (!d.data_chiusura) continue
    segna(perMese, d.data_chiusura, 1)
  }

  return {
    tasso: decise.length ? (chiuse.length / decise.length) * 100 : 0,
    decise: decise.length,
    chiuse: chiuse.length,
    prezzoMedio: media(prezzi),
    prezzi: [...prezzi].sort((x, y) => x - y),
    giorniMedi: durate.length ? Math.round(media(durate)) : null,
    perSettore: taglio((c) => c.settore),
    perZona: taglio((c) => c.zona ?? c.citta),
    perVenditore: taglio((c) => (c.assegnato_a ? (nomiStaff.get(c.assegnato_a) ?? null) : null)),
    obiezioni: Array.from(conteggioObiezioni.entries())
      .map(([nome, n]) => ({ nome, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 5),
    frasi,
    zone: Array.from(perCitta.entries())
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.n - a.n),
    mesi: ultimiDodiciMesi(perMese).slice(-6),
    mancaSchema: mancano(clienti, deals),
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Utilità
   ═══════════════════════════════════════════════════════════════════════════ */

function media(valori: number[]): number {
  if (!valori.length) return 0
  return valori.reduce((s, v) => s + v, 0) / valori.length
}

/** Giorni passati da una data. Positivo per il passato, negativo per il futuro. */
function giorniDa(data: string): number {
  const oggi = new Date()
  oggi.setHours(12, 0, 0, 0)
  return Math.round(
    (oggi.getTime() - new Date(`${data.slice(0, 10)}T12:00:00`).getTime()) / 86_400_000,
  )
}

function segna(mappa: Map<string, number>, data: string | null, quanto: number) {
  if (!data) return
  const chiave = data.slice(0, 7)
  mappa.set(chiave, (mappa.get(chiave) ?? 0) + quanto)
}

/**
 * I dodici mesi fino a oggi, **zeri compresi**.
 *
 * I mesi vuoti devono esserci: saltarli farebbe leggere una curva che sale
 * sempre, perché l'asse delle X non sarebbe più il tempo ma solo i mesi buoni.
 */
function ultimiDodiciMesi(perMese: Map<string, number>): { label: string; value: number }[] {
  const oggi = new Date()
  const fuori: { label: string; value: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const mese = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1)
    const chiave = `${mese.getFullYear()}-${String(mese.getMonth() + 1).padStart(2, '0')}`
    fuori.push({
      label: new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(mese),
      value: Math.round(perMese.get(chiave) ?? 0),
    })
  }
  return fuori
}

/**
 * La relazione annidata, appiattita.
 *
 * supabase-js non conosce i vincoli del database e dichiara ogni relazione come
 * possibile array: qui si prende la prima riga e si va avanti, invece di
 * spargere `Array.isArray` dentro ogni componente.
 */
function primo(embed: unknown): { nome?: string; settore?: Settore; citta?: string } | null {
  if (!embed) return null
  const riga = Array.isArray(embed) ? embed[0] : embed
  return (riga ?? null) as { nome?: string; settore?: Settore; citta?: string } | null
}

/* ─────────────────────────────────────────────────────────────────────────── */

interface RigaCliente {
  id: string
  nome: string
  settore: Settore
  citta: string | null
  zona: string | null
  stato: Stato
  assegnato_a: string | null
  lat: number | null
  lng: number | null
}

interface RigaDeal {
  id: string
  client_id: string
  pacchetto: Pacchetto | null
  prezzo_proposto: number | null
  prezzo_chiuso: number | null
  modalita_pagamento: string | null
  acconto_30_pagato: boolean
  acconto_30_data: string | null
  saldo_70_pagato: boolean
  saldo_70_data: string | null
  data_proposta: string | null
  data_chiusura: string | null
}

interface RigaCanone {
  subscription_id: string
  mese: string
  importo: number | null
  incassato_il: string
  is_demo?: boolean
}

interface RigaSub {
  id: string
  client_id: string
  tipo: string
  importo_mensile: number | null
  data_rinnovo: string | null
}

interface RigaProgetto {
  id: string
  client_id: string
}

interface RigaProgettoEmbed {
  id: string
  client_id: string
  fase: FaseProgetto
  preview_url: string | null
  dominio: string | null
  scadenza_dominio: string | null
  created_at: string
  updated_at: string | null
  staff_clients: unknown
}

interface RigaExtraDb {
  id: string
  project_id: string
  descrizione: string | null
  prezzo: number | null
  pagato: boolean
  created_at: string
}

interface RigaMargine {
  deal_id: string
  costo_interno: number | null
  margine: number | null
}

interface RigaReport {
  id: string
  obiezione_principale: string | null
  frase_titolare: string | null
  staff_clients: unknown
}
