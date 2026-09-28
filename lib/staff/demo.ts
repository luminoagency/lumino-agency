import { cookies } from 'next/headers'
import type { StaffRole } from './types'

/**
 * I dati finti.
 *
 * Esistono per una ragione sola: **un'interfaccia vuota non si può
 * giudicare**. Una dashboard con zero clienti, zero grafici e zero follow-up
 * sembra pulita anche quando è sbagliata, e sembra rotta anche quando è
 * giusta. Venticinque locali veneti con storie diverse — chi ha già detto di
 * no, chi ha pagato l'acconto, chi ha un abbonamento da rinnovare la settimana
 * prossima — sono l'unico modo di vedere se la gerarchia regge.
 *
 * Sono deterministici, niente `Math.random()`: il server e il browser devono
 * renderizzare gli stessi numeri, e due liste diverse nello stesso momento
 * sono un errore di idratazione, non una dashboard viva.
 *
 * Le date sono relative a oggi e calcolate al volo (`fra(-3)`): un seed con
 * date fisse invecchia, e fra due mesi mostrerebbe una dashboard di rinnovi
 * tutti scaduti.
 *
 * Nel database vivono con `is_demo = true` (migration 0031) e si vedono solo
 * se un admin accende l'interruttore. Qui dentro sono anche la sorgente
 * dell'anteprima di sviluppo, che non tocca Supabase per niente.
 */

const COOKIE_DEMO = 'lm_demo'

/**
 * L'interruttore dei dati demo.
 *
 * Spento di default, per tutti. Un venditore non deve poterli accendere né
 * vedere per sbaglio: un cliente finto in pipeline è una telefonata sprecata,
 * e peggio, è un numero sbagliato nel suo obiettivo del mese.
 */
export function demoAttivo(role: StaffRole): boolean {
  /* Nell'anteprima di sviluppo i dati finti sono gli unici che esistono, quindi
     partono **accesi**: chiedere anche di accendere l'interruttore vorrebbe dire
     aprire una dashboard vuota e non capire perché.
     Ma si possono spegnere, e serve: le schermate a zero clienti — quelle che
     vede chi entra il primo giorno — altrimenti non si potrebbero guardare senza
     un database vuoto, e sono proprio quelle che restano indietro. Acceso di
     default, spento solo se l'interruttore dice esplicitamente `0`.
     La condizione è ripetuta qui invece di importare ANTEPRIMA da db.ts, che
     importa questo file: sarebbe un ciclo, e per due `process.env` non vale la
     pena. */
  if (process.env.NODE_ENV !== 'production' && process.env.STAFF_DEV_PREVIEW === '1') {
    return cookies().get(COOKIE_DEMO)?.value !== '0'
  }
  if (role !== 'admin') return false
  return cookies().get(COOKIE_DEMO)?.value === '1'
}

export const COOKIE_DEMO_NOME = COOKIE_DEMO

/* ─────────────────────────────────────────────────────────────────────────── */

/** Giorni da oggi, in formato `date`. */
function fra(giorni: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + giorni)
  return d.toISOString().slice(0, 10)
}

/** Giorni da oggi, in formato `timestamptz`. */
function fraOre(giorni: number, ora = 10): string {
  const d = new Date()
  d.setHours(ora, 30, 0, 0)
  d.setDate(d.getDate() + giorni)
  return d.toISOString()
}

/**
 * Un uuid stabile e riconoscibile: comincia sempre per `de` — demo.
 *
 * Deve essere un uuid **valido**, non solo somigliargli: Postgres rifiuta
 * `dec0001-…` perché il primo gruppo vuole otto cifre esadecimali e `s`, `p`,
 * `r` non sono cifre esadecimali. Quindi la lettera che distingue la tabella
 * non entra nel testo dell'uuid: diventa un codice nel secondo gruppo.
 *
 * Stabile perché il seed deve poter essere rilanciato senza duplicare niente,
 * e perché in anteprima i link devono restare gli stessi fra un render e
 * l'altro.
 */
const CODICI: Record<string, string> = {
  c: '0001', // clienti
  d: '0002', // trattative
  s: '0003', // abbonamenti
  p: '0004', // progetti
  a: '0005', // attività (la visita)
  b: '0006', // attività (chiamata, messaggio, nota)
  f: '0007', // follow-up
  r: '0008', // report di campo
  e: '0009', // modifiche extra
  m: '0010', // margini delle trattative
}

function id(prefisso: string, n: number): string {
  const h = n.toString(16).padStart(6, '0')
  return `de${h}-${CODICI[prefisso]}-4000-8000-${h.padStart(12, '0')}`
}

/* Le coordinate dei capoluoghi in cui si vende: servono alla mappa delle
   zone, che senza lat/lng non ha niente da disegnare. Approssimate al
   centro abitato — qui l'errore di un chilometro non cambia niente. */
const COORD: Record<string, [number, number]> = {
  Jesolo: [45.53, 12.64],
  Treviso: [45.67, 12.24],
  Mestre: [45.49, 12.24],
  Cavallino: [45.46, 12.53],
  Padova: [45.41, 11.88],
  Venezia: [45.44, 12.33],
  Mogliano: [45.56, 12.24],
  Chioggia: [45.22, 12.28],
  Bibione: [45.64, 13.04],
  Udine: [46.06, 13.24],
  'San Donà': [45.63, 12.57],
  Caorle: [45.6, 12.89],
  Vicenza: [45.55, 11.55],
  Verona: [45.44, 10.99],
  Rovigo: [45.07, 11.79],
  Conegliano: [45.89, 12.3],
  Bassano: [45.77, 11.73],
  Lignano: [45.68, 13.13],
  Abano: [45.36, 11.79],
}

interface Semina {
  nome: string
  settore: string
  citta: string
  zona: string
  indirizzo: string
  referente: string
  stato: string
  sito: string | null
  prezzo: number | null
  voto: number | null
  motivo?: string
}

/* Venticinque locali, nessuno uguale all'altro: settori diversi, città diverse
   e soprattutto **stati diversi** — è la distribuzione lungo il funnel che fa
   vedere se la pipeline è leggibile, non il numero totale. */
const SEMI: Semina[] = [
  { nome: 'Trattoria da Gigi', settore: 'ristorante', citta: 'Jesolo', zona: 'Lido est', indirizzo: 'Via Bafile 214', referente: 'Luigi Trevisan', stato: 'accettato', sito: 'vecchio', prezzo: 1800, voto: 3 },
  { nome: 'Osteria del Ponte', settore: 'ristorante', citta: 'Treviso', zona: 'Centro', indirizzo: 'Riviera Garibaldi 8', referente: 'Anna Bortolin', stato: 'accettato', sito: 'solo_social', prezzo: 2200, voto: 2 },
  { nome: 'Bar Centrale', settore: 'bar', citta: 'Mestre', zona: 'Piazza Ferretto', indirizzo: 'Piazza Ferretto 31', referente: 'Marco Salviati', stato: 'in_trattativa', sito: 'nessuno', prezzo: 1200, voto: 1 },
  { nome: 'Hotel Rivamare', settore: 'hotel', citta: 'Cavallino', zona: 'Treporti', indirizzo: 'Via Fausta 90', referente: 'Elisa Fontana', stato: 'preventivo_inviato', sito: 'vecchio', prezzo: 4200, voto: 4 },
  { nome: 'Pizzeria Ai Platani', settore: 'ristorante', citta: 'Padova', zona: 'Guizza', indirizzo: 'Via Guizza 112', referente: 'Samir El Amrani', stato: 'accettato', sito: 'nessuno', prezzo: 1600, voto: 1 },
  { nome: 'Barberia Novecento', settore: 'barbiere', citta: 'Venezia', zona: 'Cannaregio', indirizzo: 'Fondamenta Ormesini 2745', referente: 'Nicola Zen', stato: 'contattato', sito: 'solo_social', prezzo: 900, voto: 3 },
  { nome: 'Estetica Luce', settore: 'estetista', citta: 'Mogliano', zona: 'Centro', indirizzo: 'Via Barbiero 14', referente: 'Giorgia Pavan', stato: 'in_trattativa', sito: 'solo_social', prezzo: 1100, voto: 2 },
  { nome: 'Ristorante Al Faro', settore: 'ristorante', citta: 'Chioggia', zona: 'Sottomarina', indirizzo: 'Lungomare Adriatico 44', referente: 'Paolo Boscolo', stato: 'rifiutato', sito: 'ok', prezzo: 2000, voto: 7, motivo: 'Ha rifatto il sito sei mesi fa con un’agenzia di Padova. Richiamare nel 2027.' },
  { nome: 'Caffè degli Specchi', settore: 'bar', citta: 'Treviso', zona: 'Borgo Cavour', indirizzo: 'Borgo Cavour 20', referente: 'Ilaria Marchetti', stato: 'da_contattare', sito: null, prezzo: 1000, voto: null },
  { nome: 'Hotel Belvedere', settore: 'hotel', citta: 'Bibione', zona: 'Spiaggia', indirizzo: 'Via Maja 6', referente: 'Roberto Cappellaro', stato: 'in_trattativa', sito: 'vecchio', prezzo: 3800, voto: 3 },
  { nome: 'Antica Osteria Zanon', settore: 'ristorante', citta: 'Udine', zona: 'Centro', indirizzo: 'Via Zanon 3', referente: 'Federica Deganutti', stato: 'preventivo_inviato', sito: 'solo_social', prezzo: 2400, voto: 2 },
  { nome: 'Bar Sport', settore: 'bar', citta: 'San Donà', zona: 'Stazione', indirizzo: 'Via Vizzotto 55', referente: 'Alessandro Rossi', stato: 'rifiutato', sito: 'nessuno', prezzo: 800, voto: 1, motivo: 'Il sito glielo fa il nipote. Dice che ci mette due settimane — sono due anni che lo dice.' },
  { nome: 'La Bottega del Pesce', settore: 'ristorante', citta: 'Caorle', zona: 'Porto', indirizzo: 'Rio Terrà 17', referente: 'Nadia Vio', stato: 'contattato', sito: 'nessuno', prezzo: 1700, voto: null },
  { nome: 'Hotel Aurora', settore: 'hotel', citta: 'Jesolo', zona: 'Lido ovest', indirizzo: 'Via Levantina 188', referente: 'Chiara Moretti', stato: 'accettato', sito: 'vecchio', prezzo: 5200, voto: 4 },
  { nome: 'Salone Marilù', settore: 'estetista', citta: 'Vicenza', zona: 'Ferrovieri', indirizzo: 'Via Rismondo 9', referente: 'Marilù Costa', stato: 'da_contattare', sito: 'solo_social', prezzo: 950, voto: null },
  { nome: 'Enoteca Sottoriva', settore: 'bar', citta: 'Verona', zona: 'Sottoriva', indirizzo: 'Via Sottoriva 11', referente: 'Tommaso Bianchi', stato: 'in_pausa', sito: 'ok', prezzo: 1400, voto: 6 },
  { nome: 'Trattoria alla Vecia', settore: 'ristorante', citta: 'Rovigo', zona: 'Centro', indirizzo: 'Corso del Popolo 62', referente: 'Sergio Pizzolato', stato: 'da_contattare', sito: null, prezzo: 1500, voto: null },
  { nome: 'Barber Shop 21', settore: 'barbiere', citta: 'Padova', zona: 'Arcella', indirizzo: 'Via Tiziano Aspetti 77', referente: 'Youssef Haddad', stato: 'contattato', sito: 'solo_social', prezzo: 850, voto: 3 },
  { nome: 'Hotel Laguna Blu', settore: 'hotel', citta: 'Lignano', zona: 'Sabbiadoro', indirizzo: 'Viale Centrale 30', referente: 'Monica Pittana', stato: 'preventivo_inviato', sito: 'vecchio', prezzo: 4600, voto: 3 },
  { nome: 'Pasticceria Dolce Vita', settore: 'bar', citta: 'Conegliano', zona: 'Centro', indirizzo: 'Via XX Settembre 40', referente: 'Enrico Dal Bo', stato: 'da_contattare', sito: 'nessuno', prezzo: 1100, voto: null },
  { nome: 'Ristorante Il Cortile', settore: 'ristorante', citta: 'Bassano', zona: 'Ponte Vecchio', indirizzo: 'Via Angarano 5', referente: 'Lucia Ferrari', stato: 'in_trattativa', sito: 'solo_social', prezzo: 2100, voto: 2 },
  { nome: 'Beauty Room', settore: 'estetista', citta: 'Mestre', zona: 'Carpenedo', indirizzo: 'Via Cà Rossa 18', referente: 'Sara Longhin', stato: 'in_pausa', sito: 'solo_social', prezzo: 1000, voto: 4, },
  { nome: 'Osteria ai Do Mori', settore: 'ristorante', citta: 'Venezia', zona: 'San Polo', indirizzo: 'Calle Do Mori 429', referente: 'Giacomo Sartori', stato: 'contattato', sito: 'vecchio', prezzo: 2600, voto: 3 },
  { nome: 'Camping Bar Dune', settore: 'bar', citta: 'Cavallino', zona: 'Ca’ Savio', indirizzo: 'Via delle Batterie 120', referente: 'Ivan Scarpa', stato: 'da_contattare', sito: null, prezzo: 900, voto: null },
  { nome: 'Hotel Cristallo', settore: 'hotel', citta: 'Abano', zona: 'Terme', indirizzo: 'Via Pietro d’Abano 22', referente: 'Daniela Boschetti', stato: 'accettato', sito: 'vecchio', prezzo: 4800, voto: 4 },
]

export interface RigheDemo {
  staff_clients: Record<string, unknown>[]
  staff_deals: Record<string, unknown>[]
  staff_subscriptions: Record<string, unknown>[]
  staff_projects: Record<string, unknown>[]
  staff_extra_changes: Record<string, unknown>[]
  staff_deal_margins: Record<string, unknown>[]
  staff_activities: Record<string, unknown>[]
  staff_followups: Record<string, unknown>[]
  staff_field_reports: Record<string, unknown>[]
  staff_profiles: Record<string, unknown>[]
}

export const PROFILO_DEMO = {
  id: 'de000000-0000-4000-8000-000000000000',
  nome: 'Marco Bianchi',
  email: 'demo@bylumino.com',
  telefono: null,
  role: 'admin' as StaffRole,
  attivo: true,
  obiettivo_mensile: 12000,
  provvigione_pct: 15,
  /* Il titolo c'è anche in anteprima: il saluto della home va guardato con un
     ruolo davanti al nome, che è come lo vedranno i co-founder. La foto no —
     `null` è il caso da verificare più spesso, perché è quello di chi non l'ha
     ancora caricata. */
  ruolo_titolo: 'CEO',
  saluto_custom: null,
  foto_url: null,
}

const COLLEGA_DEMO = {
  id: 'de000000-0000-4000-8000-000000000001',
  nome: 'Sofia Rinaldi',
  email: 'sofia@bylumino.com',
  telefono: null,
  role: 'sales' as StaffRole,
  attivo: true,
  obiettivo_mensile: 8000,
  provvigione_pct: 12,
  ruolo_titolo: 'Area manager',
  saluto_custom: null,
  foto_url: null,
}

const GESTIONI_DEMO = [
  ['telefono', 'di_persona'],
  ['telefono', 'whatsapp'],
  ['thefork', 'telefono'],
  ['booking', 'telefono'],
  ['whatsapp', 'instagram'],
  ['quaderno'],
]
const STRUMENTI_DEMO = [
  ['facebook', 'google_business'],
  ['instagram'],
  ['nessuno'],
  ['thefork', 'menu_qr'],
  ['booking', 'sito_proprio'],
  ['volantini', 'facebook'],
]
const LINGUE_DEMO = [
  ['italiano'],
  ['italiano', 'inglese'],
  ['italiano', 'inglese', 'tedesco'],
  ['italiano', 'tedesco'],
]
const REAZIONI_DEMO = ['entusiasta', 'interessato', 'tiepido', 'diffidente', 'chiuso']
const OBIEZIONI_DEMO = ['prezzo', 'non_ho_tempo', 'ho_gia_un_sito', 'ci_pensa_un_parente', 'decide_un_altro', 'fine_stagione']
const FRASI_DEMO = [
  'Il sito ce l’ho, me l’ha fatto mio nipote nel 2016.',
  'D’estate non ho tempo nemmeno di mangiare, figurati un sito.',
  'A TheFork gli do trecento euro al mese e mi porta gente che non torna.',
  'I tedeschi mi scrivono e io non li capisco.',
  'Se mi porti clienti ti pago volentieri, ma voglio vedere prima.',
  'Ho provato con uno di Milano, mi ha preso i soldi e sparito.',
]
/* Le modifiche extra: 80 euro, 120 per gli hotel. Non sono un dettaglio
   decorativo — sono la voce che in «Soldi» fa la differenza fra un mese in pari
   e un mese buono, e senza qualche riga qui la card resterebbe sempre vuota. */
const EXTRA_DEMO = [
  'Cambio foto della home e del menù di primavera.',
  'Aggiunta pagina eventi per le serate con musica.',
  'Tradotto il menù in tedesco.',
  'Sostituiti gli orari e i prezzi delle camere.',
  'Aggiunto il modulo prenotazioni sul sito.',
]

const PROBLEMI_DEMO = [
  'Fuori stagione lavora tre giorni su sette. Vuole allungare la stagione.',
  'Le recensioni gliele scrive la figlia quando ha tempo, cioè mai.',
  'Non risponde al telefono a pranzo e perde prenotazioni.',
  'Ha il menù solo in italiano e metà dei clienti sono stranieri.',
]

/**
 * Le righe finte, montate nella forma che il database restituirebbe.
 *
 * `venditoreId` esiste perché nel database vero le righe vanno intestate a
 * qualcuno di reale, altrimenti la RLS non le mostra a nessuno; nell'anteprima
 * di sviluppo resta il profilo finto.
 */
export function righeDemo(venditoreId = PROFILO_DEMO.id, collegaId = COLLEGA_DEMO.id): RigheDemo {
  const clients: Record<string, unknown>[] = []
  const deals: Record<string, unknown>[] = []
  const subs: Record<string, unknown>[] = []
  const projects: Record<string, unknown>[] = []
  const extras: Record<string, unknown>[] = []
  const margins: Record<string, unknown>[] = []
  const activities: Record<string, unknown>[] = []
  const followups: Record<string, unknown>[] = []
  const reports: Record<string, unknown>[] = []

  SEMI.forEach((s, i) => {
    const clientId = id('c', i + 1)
    /* Un cliente su quattro è del collega: senza, il filtro "assegnato a" e
       le statistiche per venditore non mostrerebbero mai niente. */
    const proprietario = i % 4 === 3 ? collegaId : venditoreId

    clients.push({
      id: clientId,
      nome: s.nome,
      settore: s.settore,
      citta: s.citta,
      zona: s.zona,
      indirizzo: s.indirizzo,
      lat: COORD[s.citta]?.[0] ?? null,
      lng: COORD[s.citta]?.[1] ?? null,
      referente: s.referente,
      telefono: `+39 3${(40 + (i % 9))} ${100 + i * 7} ${1000 + i * 13}`,
      email: `info@${s.nome.toLowerCase().replace(/[^a-z]+/g, '')}.it`,
      instagram: `@${s.nome.toLowerCase().replace(/[^a-z]+/g, '')}`,
      sito_attuale: s.sito,
      note_sito: s.sito === 'vecchio' ? 'Non è responsive, il menù è un PDF del 2019.' : null,
      stato: s.stato,
      motivo_rifiuto: s.motivo ?? null,
      assegnato_a: proprietario,
      country: 'IT',
      currency: 'EUR',
      prezzo_consigliato: s.prezzo,
      voto_sito: s.voto,
      problemi_recensioni: null,
      fonte: 'manuale',
      is_demo: true,
      created_at: fraOre(-(90 - i * 3)),
      updated_at: fraOre(-(10 - (i % 9))),
    })

    /* Le trattative solo da "in_trattativa" in poi: un cliente da contattare
       che ha già un prezzo chiuso è il tipo di incoerenza che fa perdere
       fiducia nei dati finti, e quindi nel design che ci sta sopra. */
    const avanzato = ['in_trattativa', 'preventivo_inviato', 'accettato'].includes(s.stato)
    if (avanzato && s.prezzo) {
      const chiuso = s.stato === 'accettato'
      deals.push({
        id: id('d', i + 1),
        client_id: clientId,
        pacchetto: s.prezzo > 3000 ? 'premium' : s.prezzo > 1500 ? 'pro' : 'basic',
        prezzo_proposto: s.prezzo,
        prezzo_chiuso: chiuso ? Math.round(s.prezzo * 0.92) : null,
        sconto: chiuso ? Math.round(s.prezzo * 0.08) : null,
        acconto_30_pagato: chiuso,
        acconto_30_data: chiuso ? fra(-(40 - i)) : null,
        /* Metà dei chiusi ha ancora il saldo aperto: è quello che alimenta
           "da incassare", ed è il numero che un titolare guarda per primo. */
        saldo_70_pagato: chiuso && i % 2 === 0,
        saldo_70_data: chiuso && i % 2 === 0 ? fra(-(12 - (i % 7))) : null,
        data_proposta: fra(-(50 - i)),
        data_chiusura: chiuso ? fra(-(42 - i * 2)) : null,
        is_demo: true,
        created_at: fraOre(-(50 - i)),
      })

      /* Il margine sta in una tabella a parte perché un venditore non deve
         vederlo (vedi il piano): qui il costo interno è un terzo del prezzo, che
         è l'ordine di grandezza vero di un sito fatto in casa. È `is_demo` per
         eredità dal deal, non per colonna propria — `staff_deal_margins` non ne
         ha una, e non serve: si legge sempre partendo dai deal. */
      if (chiuso) {
        const chiusoA = Math.round(s.prezzo * 0.92)
        const costo = Math.round(chiusoA * 0.32)
        margins.push({
          deal_id: id('d', i + 1),
          costo_interno: costo,
          margine: chiusoA - costo,
          note: null,
          updated_at: fraOre(-(40 - i)),
        })
      }
    }

    if (s.stato === 'accettato') {
      subs.push({
        id: id('s', i + 1),
        client_id: clientId,
        /* I quattro tipi del check constraint della tabella, a rotazione:
           un valore inventato qui fa fallire tutto il seed. */
        tipo: ['manutenzione', 'hosting', 'social', 'seo'][i % 4],
        importo_mensile: 39 + (i % 4) * 20,
        data_inizio: fra(-(35 - i)),
        data_rinnovo: fra((i % 5) * 7 - 4),
        attivo: true,
        is_demo: true,
        created_at: fraOre(-(35 - i)),
      })

      projects.push({
        id: id('p', i + 1),
        client_id: clientId,
        fase: ['brief', 'design', 'sviluppo', 'revisione', 'online'][i % 5],
        preview_url: `https://${s.nome.toLowerCase().replace(/[^a-z]+/g, '')}.vercel.app`,
        dominio: `${s.nome.toLowerCase().replace(/[^a-z]+/g, '')}.it`,
        scadenza_dominio: fra(20 + i * 9),
        materiale_ricevuto: {},
        is_demo: true,
        created_at: fraOre(-(30 - i)),
      })

      /* Un progetto su due ha una modifica extra, e una su tre è già pagata:
         serve a far vedere insieme la riga da sollecitare e quella chiusa, che
         è l'unico modo di capire se la card «Soldi» si legge. */
      if (i % 2 === 0) {
        extras.push({
          id: id('e', i + 1),
          project_id: id('p', i + 1),
          descrizione: EXTRA_DEMO[i % EXTRA_DEMO.length],
          prezzo: s.settore === 'hotel' ? 120 : 80,
          pagato: i % 3 === 0,
          is_demo: true,
          created_at: fraOre(-(18 - (i % 12))),
        })
      }
    }

    /* Le visite: una su due, così il Campo ha di che riempirsi senza che ogni
       cliente sembri già passato di persona. */
    if (i % 2 === 0) {
      reports.push({
        id: id('r', i + 1),
        client_id: clientId,
        user_id: proprietario,
        gestione_prenotazioni: GESTIONI_DEMO[i % GESTIONI_DEMO.length],
        strumenti_usati: STRUMENTI_DEMO[i % STRUMENTI_DEMO.length],
        lingue_clienti: LINGUE_DEMO[i % LINGUE_DEMO.length],
        commissioni_pagate: i % 3 === 0 ? 120 + (i % 5) * 60 : null,
        turisti: i % 3 !== 1,
        problemi_dichiarati: PROBLEMI_DEMO[i % PROBLEMI_DEMO.length],
        reazione: REAZIONI_DEMO[i % REAZIONI_DEMO.length],
        obiezione_principale: OBIEZIONI_DEMO[i % OBIEZIONI_DEMO.length],
        frase_titolare: FRASI_DEMO[i % FRASI_DEMO.length],
        trascrizione_vocale:
          i % 4 === 0
            ? 'Mi ha fatto vedere il retro, stanno rifacendo la sala. Dice che a marzo riaprono e vorrebbe il sito pronto per allora. Il figlio gestisce Instagram ma non ha tempo.'
            : null,
        foto: [],
        lat: 45.5 + (i % 9) * 0.06,
        lng: 12.4 + (i % 7) * 0.13,
        is_demo: true,
        created_at: fraOre(-(i % 14), 9 + (i % 6)),
      })

      activities.push({
        id: id('a', i + 1),
        client_id: clientId,
        user_id: proprietario,
        tipo: 'visita',
        testo: `Reazione: ${REAZIONI_DEMO[i % REAZIONI_DEMO.length]} · «${FRASI_DEMO[i % FRASI_DEMO.length]}»`,
        data: fraOre(-(i % 14), 9 + (i % 6)),
        is_demo: true,
        created_at: fraOre(-(i % 14), 9 + (i % 6)),
      })
    }

    activities.push({
      id: id('b', i + 1),
      client_id: clientId,
      user_id: proprietario,
      tipo: ['chiamata', 'messaggio', 'nota'][i % 3],
      testo: [
        'Richiamato, non risponde. Riprovo dopo pranzo.',
        'Mandato il preventivo su WhatsApp, letto ma non risposto.',
        'Il socio decide tutto lui, chiedere di parlare con lui.',
      ][i % 3],
      data: fraOre(-(i % 9) - 1, 15),
      is_demo: true,
      created_at: fraOre(-(i % 9) - 1, 15),
    })

    /* I follow-up si concentrano intorno a oggi, e qualcuno è in ritardo: è
       l'unico modo di vedere se il rosso del ritardo funziona. */
    if (['contattato', 'in_trattativa', 'preventivo_inviato', 'da_contattare'].includes(s.stato)) {
      followups.push({
        id: id('f', i + 1),
        client_id: clientId,
        user_id: proprietario,
        data: fra((i % 11) - 4),
        nota: [
          'Portare il preventivo stampato.',
          'Chiedere del socio che decide.',
          'Verificare se ha rinnovato il dominio.',
          'Mandare i tre esempi di siti per hotel.',
        ][i % 4],
        fatto: i % 7 === 0,
        is_demo: true,
        created_at: fraOre(-(i % 20)),
      })
    }
  })

  /* ── una chiusura e una visita **ieri** ────────────────────────────────────
     I dati finti esistono per far vedere la dashboard piena, e il caso migliore
     del saluto della home — «Ieri hai chiuso il tuo terzo locale a Treviso» — si
     accende solo se **ieri** è successo qualcosa. Con le date generate a
     intervalli regolari, ieri cade fra due passi e quella frase non si vedrebbe
     mai: la funzione esisterebbe e nessuno saprebbe che c'è.

     Si sposta l'ultima chiusura, non se ne aggiunge una: i totali di incassato e
     tasso di chiusura restano quelli, cambia solo la data. */
  const chiuseOrdinate = deals
    .filter((d) => d.data_chiusura)
    .sort((a, b) => String(a.data_chiusura).localeCompare(String(b.data_chiusura)))
  const ultima = chiuseOrdinate[chiuseOrdinate.length - 1]
  if (ultima) {
    ultima.data_chiusura = fra(-1)
    /* Anche il cliente risulta toccato ieri, o la scheda direbbe che la
       trattativa è ferma da un mese mentre la home la festeggia. */
    const suo = clients.find((c) => c.id === ultima.client_id)
    if (suo) suo.updated_at = fraOre(-1, 17)
  }

  /* Due visite ieri, così anche «Ieri hai girato due locali» esiste in demo. */
  for (const r of reports.slice(0, 2)) r.created_at = fraOre(-1, 11)

  return {
    staff_clients: clients,
    staff_deals: deals,
    staff_subscriptions: subs,
    staff_projects: projects,
    staff_extra_changes: extras,
    staff_deal_margins: margins,
    staff_activities: activities,
    staff_followups: followups,
    staff_field_reports: reports,
    staff_profiles: [
      { ...PROFILO_DEMO, id: venditoreId },
      { ...COLLEGA_DEMO, id: collegaId },
    ],
  }
}

/**
 * Il filtro dei dati finti, applicato **in memoria**.
 *
 * Non è una `.eq('is_demo', false)` sulla query, e la ragione è pratica: la
 * colonna arriva con la migration 0031, e fino a quando quella non è passata
 * una query che la nomina fa fallire ogni pagina dell'area. Filtrando qui, su
 * un database senza la colonna il campo è `undefined`, nessuna riga viene
 * scartata e non si rompe niente.
 *
 * Il costo è leggere qualche riga in più: le righe finte esistono solo se
 * qualcuno ha lanciato il seed, e sono venticinque.
 */
export function senzaDemo<T>(righe: T[], demo: boolean): T[] {
  if (demo) return righe
  return righe.filter((r) => (r as { is_demo?: boolean }).is_demo !== true)
}
