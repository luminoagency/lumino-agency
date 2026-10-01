import { incassatoDi } from './pagamenti'
import { euro, type Stato } from './types'

/**
 * Il saluto della home.
 *
 * ## Il problema che risolve
 *
 * Prima diceva «Buonasera. Si chiude la giornata.» — una frase scelta da un
 * `if` sull'ora, uguale per tutti e per sempre. Non era brutta: era **di
 * nessuno**. Chi apre la dashboard alle otto di sera dopo aver chiuso un locale
 * a Treviso e chi la apre senza aver fatto niente da tre giorni leggevano la
 * stessa riga, e una riga che vale per entrambi non parla a nessuno dei due.
 *
 * Qui la riga si costruisce su **tre cose insieme**:
 *  · *chi è* — il nome, il ruolo, e quindi di cosa gli importa: a un venditore
 *    dei suoi clienti, a un amministratore della squadra;
 *  · *il momento* — l'ora, il giorno della settimana, e se è il primo accesso
 *    della giornata o un rientro;
 *  · *i suoi dati veri* — una chiusura di ieri, le visite di ieri, i richiami di
 *    oggi, un traguardo appena passato.
 *
 * ## Come è fatta
 *
 * Due metà: **cos'è successo** e **cosa c'è adesso**. «Ieri hai chiuso il tuo
 * terzo locale a Treviso.» + «Oggi tre persone ti aspettano.» È la forma che
 * regge da sola: la prima metà riconosce, la seconda indirizza, e se una delle
 * due non ha niente da dire l'altra sta in piedi lo stesso.
 *
 * Ogni metà ha più varianti, e quale esce lo decide un seme costruito sul
 * giorno, sulla fascia oraria e sul fatto che sia il primo accesso: nella stessa
 * mattina non si ripete, e fra un giorno e l'altro nemmeno. Il seme è
 * **deterministico** e non casuale, perché il server e il browser devono
 * disegnare la stessa frase — `Math.random()` qui vorrebbe dire un errore di
 * idratazione a ogni caricamento.
 *
 * ## Quello che non fa
 *
 * Nessuna frase motivazionale. Niente «oggi è un ottimo giorno per vendere»,
 * niente «continua così»: sono le frasi che un pannello scrive quando non sa
 * niente di chi le legge, ed è esattamente ciò che questa pagina non deve
 * sembrare. Se non c'è niente di vero da dire, il saluto lo ammette in una riga
 * asciutta invece di riempire il silenzio.
 *
 * **Niente aggettivi con il genere.** «Bentornato» era la parola di prima, e dà
 * del maschile a chiunque: qui non si conserva il genere di nessuno, e
 * indovinarlo dal nome è il modo migliore di sbagliarlo su una persona vera. Le
 * aperture sono tutte neutre — «Buongiorno», «Ancora qui» — e non è un
 * ripiego: dicono anche l'ora, che è un'informazione in più rispetto a
 * «bentornato».
 */

export type Ruolo = 'admin' | 'sales'

export interface DatiSaluto {
  nome: string
  titolo: string | null
  role: Ruolo
  /** La riga scritta a mano nel profilo. Se c'è, vince su tutto. */
  salutoCustom: string | null
  adesso: Date
  obiettivoMensile: number | null

  /** Le chiusure di ieri: nome del locale e città. */
  chiusureIeri: { locale: string; citta: string | null }[]
  /** Quante chiusure in tutto, per dire «il tuo terzo». */
  chiusureTotali: number
  /** Quante nella stessa città dell'ultima di ieri. */
  chiusureStessaCitta: number
  /** Quanto è entrato questo mese, per il traguardo dell'obiettivo. */
  incassatoMese: number
  /** Visite di campo registrate ieri. */
  visiteIeri: number
  /** Richiami da fare oggi. */
  richiamiOggi: number
  /** Primo richiamo di oggi, per nominarlo. */
  primoRichiamo: string | null
  /** Abbonamenti in rinnovo nei prossimi sette giorni. */
  rinnoviVicini: number
  /** Clienti fermi in trattativa da più di due settimane. */
  fermi: number
  /** Quanti clienti in tutto: serve a riconoscere la dashboard vuota. */
  clientiTotali: number
  /** Solo per l'admin: quante visite ha fatto la squadra ieri. */
  visiteSquadraIeri: number
}

export interface Saluto {
  /** La parola grande, prima del nome. Neutra e legata all'ora. */
  apertura: string
  /** La riga personale al primo accesso della giornata. */
  prima: string
  /** La riga personale quando si torna sulla home più tardi. */
  rientro: string
  /** La riga di servizio: data, e obiettivo del mese se c'è. */
  meta: string
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * L'apertura.
 *
 * Quattro fasce, non ventiquattro: sono le fasce in cui si lavora
 * diversamente. Alle sei di sera si esce dalle visite, a mezzanotte si sta
 * ancora dietro a un preventivo, e le due parole non possono essere la stessa.
 * «Ancora qui» alle due di notte non è un rimprovero ed è l'unica delle quattro
 * che non si potrebbe dire a nessun'altra ora: è il tipo di dettaglio che fa
 * sembrare che qualcuno stia guardando.
 */
function apertura(d: Date, prima: boolean): string {
  const h = d.getHours()
  if (h < 6) return prima ? 'Ancora sveglio,' : 'Ancora qui,'
  if (h < 12) return 'Buongiorno,'
  if (h < 18) return 'Buon pomeriggio,'
  return prima ? 'Buonasera,' : 'Di nuovo qui,'
}

/** «terzo», «quarto»… Oltre il decimo torna al numero: «il tuo 23° locale». */
const ORDINALI = [
  '',
  'primo',
  'secondo',
  'terzo',
  'quarto',
  'quinto',
  'sesto',
  'settimo',
  'ottavo',
  'nono',
  'decimo',
]

function ordinale(n: number): string {
  return ORDINALI[n] ?? `${n}°`
}

/**
 * «a Treviso», ma «ad Abano».
 *
 * La d eufonica solo davanti ad `a`, che è la regola stretta: «ad Empoli» e «ad
 * Udine» erano corretti una volta e oggi suonano affettati, mentre «a Abano» è
 * sbagliato per chiunque legga ad alta voce. Una riga per non far sembrare
 * scritta da una macchina la frase più personale della schermata.
 */
function aCitta(citta: string): string {
  return `${/^[aA]/.test(citta.trim()) ? 'ad' : 'a'} ${citta}`
}

/** Quante persone, detto come lo direbbe una persona. */
const CONTATI = ['nessuno', 'una', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette']

function contati(n: number): string {
  return CONTATI[n] ?? String(n)
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * La prima metà: cos'è successo.
 *
 * L'ordine dei rami **è** la regola di priorità, e va dal più raro e più recente
 * al più comune. Una chiusura di ieri batte tutto perché succede poche volte al
 * mese ed è la cosa di cui si è più contenti; il traguardo viene dopo perché è
 * un conteggio, non un fatto; le visite di ieri dopo ancora. In fondo c'è il
 * caso di chi non ha fatto niente, e lì la frase **non finge**: non esiste una
 * versione entusiasta di «da ieri non è successo nulla».
 */
function cosaESuccesso(d: DatiSaluto, seme: number): string | null {
  const v = <T>(varianti: T[]): T => varianti[seme % varianti.length]

  /* 1. Una chiusura ieri. */
  if (d.chiusureIeri.length > 0) {
    const ultima = d.chiusureIeri[d.chiusureIeri.length - 1]
    const dove = ultima.citta ? ` ${aCitta(ultima.citta)}` : ''

    if (d.chiusureIeri.length > 1) {
      return v([
        `Ieri hai chiuso ${contati(d.chiusureIeri.length)} locali${dove ? `, l’ultimo${dove}` : ''}.`,
        `${contati(d.chiusureIeri.length)[0].toUpperCase()}${contati(d.chiusureIeri.length).slice(1)} chiusure in un giorno solo, ieri.`,
      ])
    }

    /* «il tuo terzo locale a Treviso» usa il conteggio **in quella città**, non
       quello assoluto: è il numero che chi ci lavora ha in testa, perché una
       zona la si apre locale dopo locale. Sopra il decimo si scrive la cifra,
       perché «il tuo ventitreesimo» non lo dice nessuno. */
    if (ultima.citta && d.chiusureStessaCitta > 1) {
      return v([
        `Ieri hai chiuso il tuo ${ordinale(d.chiusureStessaCitta)} locale${dove}.`,
        `${ultima.locale} ha firmato ieri: è il ${ordinale(d.chiusureStessaCitta)}${dove}.`,
      ])
    }

    return v([
      `Ieri ha firmato ${ultima.locale}${dove}.`,
      `${ultima.locale}${dove} è dentro da ieri.`,
    ])
  }

  /* 2. Un traguardo: l'obiettivo del mese superato, o una cifra tonda. */
  if (d.obiettivoMensile && d.incassatoMese >= d.obiettivoMensile) {
    return v([
      `L’obiettivo del mese è già passato: ${euro(d.incassatoMese)} su ${euro(d.obiettivoMensile)}.`,
      `Questo mese hai chiuso l’obiettivo e sei avanti di ${euro(d.incassatoMese - d.obiettivoMensile)}.`,
    ])
  }
  if (d.chiusureTotali > 0 && d.chiusureTotali % 10 === 0) {
    return v([
      `Sei a ${d.chiusureTotali} locali aperti da quando hai cominciato.`,
      `${d.chiusureTotali} clienti firmati in tutto: è una cifra tonda.`,
    ])
  }

  /* 3. Le visite di ieri. */
  if (d.visiteIeri > 0) {
    return v([
      `Ieri hai girato ${contati(d.visiteIeri)} ${d.visiteIeri === 1 ? 'locale' : 'locali'}.`,
      `${contati(d.visiteIeri)[0].toUpperCase()}${contati(d.visiteIeri).slice(1)} ${
        d.visiteIeri === 1 ? 'visita' : 'visite'
      } ieri, tutte registrate.`,
    ])
  }

  /* 4. L'admin guarda la squadra, non sé. */
  if (d.role === 'admin' && d.visiteSquadraIeri > 0) {
    return v([
      `Ieri la squadra ha fatto ${contati(d.visiteSquadraIeri)} ${
        d.visiteSquadraIeri === 1 ? 'visita' : 'visite'
      }.`,
      `${contati(d.visiteSquadraIeri)[0].toUpperCase()}${contati(d.visiteSquadraIeri).slice(1)} ${
        d.visiteSquadraIeri === 1 ? 'locale visitato' : 'locali visitati'
      } ieri dalla squadra.`,
    ])
  }

  return null
}

/**
 * La seconda metà: cosa c'è adesso.
 *
 * Qui l'ordine è quello di **cosa costa se non lo si fa**. Un richiamo saltato è
 * una trattativa che si raffredda; un rinnovo scaduto è un cliente che se ne
 * accorge prima di noi; una trattativa ferma da due settimane è già persa e non
 * lo sa nessuno. Le tre cose in quest'ordine.
 *
 * Il sabato e la domenica **non** si nominano i richiami: dire «tre persone ti
 * aspettano» a chi apre la dashboard di domenica sera è una frase che fa sentire
 * in ritardo su un lavoro che non si poteva fare.
 */
function cosaCEAdesso(d: DatiSaluto, seme: number): string | null {
  const v = <T>(varianti: T[]): T => varianti[seme % varianti.length]
  const giorno = d.adesso.getDay()
  const feriale = giorno >= 1 && giorno <= 5
  const h = d.adesso.getHours()

  if (d.richiamiOggi > 0 && feriale && h < 19) {
    if (d.richiamiOggi === 1 && d.primoRichiamo) {
      return v([
        `Oggi c’è da richiamare ${d.primoRichiamo}.`,
        `Un richiamo per oggi: ${d.primoRichiamo}.`,
      ])
    }
    return v([
      `Oggi ${contati(d.richiamiOggi)} persone ti aspettano.`,
      `Ci sono ${contati(d.richiamiOggi)} richiami per oggi.`,
    ])
  }

  if (d.rinnoviVicini > 0) {
    return v([
      `${contati(d.rinnoviVicini)[0].toUpperCase()}${contati(d.rinnoviVicini).slice(1)} ${
        d.rinnoviVicini === 1 ? 'abbonamento si rinnova' : 'abbonamenti si rinnovano'
      } entro la settimana.`,
      `Entro sette giorni ${d.rinnoviVicini === 1 ? 'c’è un rinnovo' : `ci sono ${contati(d.rinnoviVicini)} rinnovi`}.`,
    ])
  }

  if (d.fermi > 2) {
    return v([
      `${contati(d.fermi)[0].toUpperCase()}${contati(d.fermi).slice(1)} trattative sono ferme da più di due settimane.`,
      `Ci sono ${contati(d.fermi)} trattative che non si muovono da due settimane.`,
    ])
  }

  if (!feriale) {
    return v(['Oggi non c’è niente in calendario.', 'Il calendario di oggi è vuoto.'])
  }

  return null
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Il caso in cui non è successo niente, che è il più difficile.
 *
 * Una dashboard vuota è quella di chi ha appena cominciato, ed è il momento in
 * cui una frase generica fa più danno: «buon lavoro» a chi non ha nemmeno un
 * cliente in archivio è un pannello che non si è accorto di niente. Qui si dice
 * quello che si vede e si indica la porta.
 */
function silenzio(d: DatiSaluto, seme: number): string {
  const v = <T>(varianti: T[]): T => varianti[seme % varianti.length]

  if (d.clientiTotali === 0) {
    return v([
      'L’archivio è ancora vuoto: si comincia aggiungendo il primo locale.',
      'Non c’è ancora nessun cliente qui dentro. Il primo si aggiunge da «Nuovo cliente».',
    ])
  }

  return v([
    `${d.clientiTotali} locali in archivio, e niente in scadenza oggi.`,
    'Niente di urgente oggi: è il giorno buono per una visita a freddo.',
    'Nessun richiamo e nessun rinnovo in vista. Giornata libera.',
  ])
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Il seme.
 *
 * Giorno dell'anno, fascia oraria e primo accesso: tre numeri che cambiano
 * quando **deve** cambiare la frase, e non quando non deve. Due caricamenti
 * della home nella stessa mattina danno la stessa riga — è giusto, la giornata è
 * la stessa — ma fra la mattina e il pomeriggio cambia, e domani cambia di
 * nuovo. Niente `Math.random()`: server e browser devono disegnare la stessa
 * cosa, altrimenti è un errore di idratazione a ogni apertura.
 */
function seme(d: Date, prima: boolean): number {
  const inizioAnno = new Date(d.getFullYear(), 0, 0)
  const giorno = Math.floor((d.getTime() - inizioAnno.getTime()) / 86_400_000)
  const fascia = Math.floor(d.getHours() / 6)
  return giorno * 7 + fascia * 2 + (prima ? 0 : 1)
}

/** Le due metà, unite. Se manca una, l'altra sta in piedi da sola. */
function riga(d: DatiSaluto, prima: boolean): string {
  const s = seme(d.adesso, prima)
  const fatto = cosaESuccesso(d, s)
  const adesso = cosaCEAdesso(d, s + 1)

  if (fatto && adesso) return `${fatto} ${adesso}`
  if (fatto) return fatto
  if (adesso) return adesso
  return silenzio(d, s)
}

/**
 * Il saluto completo.
 *
 * `saluto_custom` vince su tutto: è la firma che la persona si è scelta in
 * `/staff/io`, e un sistema che la sovrascrive con una frase più intelligente
 * sta dicendo che sapeva meglio di lei cosa voleva leggere.
 */
export function costruisciSaluto(d: DatiSaluto): Saluto {
  const meta = [
    new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      d.adesso,
    ),
    d.obiettivoMensile ? `obiettivo del mese ${euro(d.obiettivoMensile)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  if (d.salutoCustom) {
    return {
      apertura: apertura(d.adesso, true),
      prima: d.salutoCustom,
      rientro: d.salutoCustom,
      meta,
    }
  }

  return {
    apertura: apertura(d.adesso, true),
    prima: riga(d, true),
    rientro: riga(d, false),
    meta,
  }
}

/**
 * Da righe di database a `DatiSaluto`.
 *
 * Sta qui e non nella pagina perché è la parte che si sbaglia: «ieri» va
 * calcolato in orario locale e non in UTC (alle due di notte `toISOString()`
 * darebbe l'altro ieri), e «la stessa città» va confrontata senza maiuscole e
 * senza spazi — `Treviso` e `treviso ` sono la stessa città per chi legge e due
 * città diverse per una `Map`.
 */
export function datiDaRighe(input: {
  nome: string
  titolo: string | null
  role: Ruolo
  salutoCustom: string | null
  obiettivoMensile: number | null
  adesso: Date
  clienti: {
    id: string
    nome: string
    citta: string | null
    stato: Stato
    updated_at?: string | null
  }[]
  deals: {
    client_id: string
    data_chiusura: string | null
    prezzo_chiuso: number | null
    modalita_pagamento: string | null
    acconto_30_pagato: boolean
    saldo_70_pagato: boolean
  }[]
  followup: { data: string; staff_clients?: { nome: string } | null }[]
  rinnovi: { data_rinnovo: string | null }[]
  visite: { created_at: string; user_id: string | null }[]
  ioSono: string
}): DatiSaluto {
  const g = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const oggi = g(input.adesso)
  const ieri = g(new Date(input.adesso.getTime() - 86_400_000))
  const primoDelMese = g(new Date(input.adesso.getFullYear(), input.adesso.getMonth(), 1))
  const fra7 = g(new Date(input.adesso.getTime() + 7 * 86_400_000))
  const dueSettimaneFa = new Date(input.adesso.getTime() - 14 * 86_400_000).toISOString()

  const perId = new Map(input.clienti.map((c) => [c.id, c]))
  const normalizza = (v: string | null | undefined) => (v ?? '').trim().toLowerCase()

  const chiuse = input.deals.filter((d) => d.data_chiusura)
  const chiusureIeri = chiuse
    .filter((d) => d.data_chiusura === ieri)
    .map((d) => {
      const c = perId.get(d.client_id)
      return { locale: c?.nome ?? 'un locale', citta: c?.citta ?? null }
    })

  const ultimaCitta = chiusureIeri.length
    ? normalizza(chiusureIeri[chiusureIeri.length - 1].citta)
    : ''
  const chiusureStessaCitta = ultimaCitta
    ? chiuse.filter((d) => normalizza(perId.get(d.client_id)?.citta) === ultimaCitta).length
    : 0

  const incassatoMese = chiuse
    .filter((d) => (d.data_chiusura as string) >= primoDelMese)
    .reduce((s, d) => s + incassatoDi(d), 0)

  const richiamiOggi = input.followup.filter((f) => f.data === oggi)

  return {
    nome: input.nome,
    titolo: input.titolo,
    role: input.role,
    salutoCustom: input.salutoCustom,
    adesso: input.adesso,
    obiettivoMensile: input.obiettivoMensile,
    chiusureIeri,
    chiusureTotali: chiuse.length,
    chiusureStessaCitta,
    incassatoMese,
    visiteIeri: input.visite.filter(
      (v) => v.created_at.slice(0, 10) === ieri && v.user_id === input.ioSono,
    ).length,
    visiteSquadraIeri: input.visite.filter((v) => v.created_at.slice(0, 10) === ieri).length,
    richiamiOggi: richiamiOggi.length,
    primoRichiamo: richiamiOggi[0]?.staff_clients?.nome ?? null,
    rinnoviVicini: input.rinnovi.filter((r) => r.data_rinnovo && r.data_rinnovo <= fra7).length,
    /* «Ferma» vuol dire: in trattativa, e non toccata da due settimane. Lo stato
       da solo non basta — un cliente «in trattativa» da ieri non è fermo — e la
       data da sola nemmeno, perché un cliente «accettato» non si tocca più per
       definizione. Servono tutte e due. */
    fermi: input.clienti.filter(
      (c) =>
        (c.stato === 'in_trattativa' || c.stato === 'preventivo_inviato') &&
        (c.updated_at ?? '') < dueSettimaneFa,
    ).length,
    clientiTotali: input.clienti.length,
  }
}
