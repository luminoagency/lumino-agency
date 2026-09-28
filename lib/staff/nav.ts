/**
 * Le voci dell'area staff, in un posto solo.
 *
 * Le consumano tre viste diverse (rail desktop, barra mobile, pannello
 * "Altro"): con tre elenchi separati la quarta pagina finirebbe in due su tre.
 * `fase` è la fase del piano in cui la pagina viene davvero costruita, e
 * confrontata con FASE_VIVA distingue una voce viva da un segnaposto: alla
 * fine di ogni fase si alza quel numero di uno e le voci appena costruite
 * smettono di dire "in arrivo". Il valore resta quello vero, così il piano
 * resta leggibile dal codice.
 */

/** L'ultima fase costruita. Si alza a fine fase, non prima. */
export const FASE_VIVA = 5

/**
 * I tre blocchi del rail.
 *
 * Undici voci in fila sono un elenco; undici voci in tre gruppi sono un menù.
 * La divisione non è per argomento ma **per momento della giornata**: `giorno` è
 * quello che si apre entrando e si usa in strada, `gestione` è quello che si
 * guarda una volta la settimana stando fermi, `futuro` è quello che si apre
 * quando serve qualcosa. Tre blocchi da quattro, quattro e tre voci: chi cerca
 * una voce sa in quale terzo guardare prima di leggere le etichette.
 */
export const GRUPPI = ['giorno', 'gestione', 'futuro'] as const
export type Gruppo = (typeof GRUPPI)[number]

/** Il titolino sopra ogni blocco, visibile solo a rail espanso. */
export const GRUPPO_LABEL: Record<Gruppo, string> = {
  giorno: 'ogni giorno',
  gestione: 'gestione',
  futuro: 'risorse',
}

export interface StaffNavItem {
  href: string
  label: string
  /** Etichetta corta per la barra in basso sul telefono. */
  short: string
  /** Fase del piano in cui la pagina viene costruita. Vedi FASE_VIVA. */
  fase: 1 | 2 | 3 | 4 | 5
  /** Il blocco del rail a cui appartiene. */
  gruppo: Gruppo
  adminOnly?: boolean
  /** Le cinque voci che stanno nella barra mobile. */
  mobile?: boolean
}

export const STAFF_NAV: StaffNavItem[] = [
  { href: '/staff', label: 'Oggi', short: 'Oggi', fase: 1, gruppo: 'giorno', mobile: true },
  { href: '/staff/pipeline', label: 'Pipeline', short: 'Pipeline', fase: 1, gruppo: 'giorno', mobile: true },
  { href: '/staff/clienti', label: 'Clienti', short: 'Clienti', fase: 1, gruppo: 'giorno', mobile: true },
  { href: '/staff/campo', label: 'Campo', short: 'Campo', fase: 3, gruppo: 'giorno', mobile: true },
  { href: '/staff/soldi', label: 'Soldi', short: 'Soldi', fase: 4, gruppo: 'gestione' },
  { href: '/staff/progetti', label: 'Progetti', short: 'Progetti', fase: 4, gruppo: 'gestione' },
  { href: '/staff/statistiche', label: 'Statistiche', short: 'Stats', fase: 4, gruppo: 'gestione' },
  /* Team dichiarava `fase: 4`, ma la F4 del piano è «soldi + progetti +
     statistiche»: non c'era dentro, e lasciarla a 4 l'avrebbe fatta apparire
     come voce viva alzando FASE_VIVA — cioè un'icona che porta a una pagina
     «in arrivo». Vale 5, come le altre ancora da costruire. */
  { href: '/staff/team', label: 'Team', short: 'Team', fase: 5, gruppo: 'gestione', adminOnly: true },
  { href: '/staff/risorse', label: 'Risorse', short: 'Risorse', fase: 5, gruppo: 'futuro' },
  { href: '/staff/lab-ai', label: 'Lab AI', short: 'Lab', fase: 5, gruppo: 'futuro' },
  { href: '/staff/agent', label: 'Ricerca Agent', short: 'Agent', fase: 5, gruppo: 'futuro' },
]

/**
 * Le voci raggruppate, nell'ordine dei blocchi, senza i blocchi vuoti.
 *
 * Il filtro dei gruppi vuoti serve davvero: a `FASE_VIVA` = 4 il blocco
 * «risorse» non ha nessuna voce viva, e senza questo controllo il rail
 * disegnerebbe un separatore con niente sotto — il classico dettaglio che fa
 * sembrare rotta una barra che funziona.
 */
export function navPerGruppi(items: StaffNavItem[]): { gruppo: Gruppo; voci: StaffNavItem[] }[] {
  return GRUPPI.map((gruppo) => ({ gruppo, voci: items.filter((i) => i.gruppo === gruppo) })).filter(
    (g) => g.voci.length > 0,
  )
}

/**
 * La pagina delle impostazioni personali.
 *
 * Non sta in STAFF_NAV e non è una dimenticanza: le voci di quell'elenco sono le
 * sezioni del lavoro, e finiscono nel rail, nella barra del telefono e nel
 * pannello «Altro». Le impostazioni si aprono dal proprio nome, che è il posto
 * dove tutti le cercano, e metterle anche fra le sezioni vorrebbe dire una
 * dodicesima icona per una pagina che si apre tre volte l'anno.
 */
export const HREF_IMPOSTAZIONI = '/staff/io'

export function visibleNav(isAdmin: boolean): StaffNavItem[] {
  return STAFF_NAV.filter((item) => !item.adminOnly || isAdmin)
}

/**
 * La voce attiva: il match più lungo, così /staff non vince su /staff/soldi.
 *
 * `/staff` fa eccezione e vale **solo esatto**. Come prefisso è il prefisso di
 * tutta l'area, quindi su una pagina che non è in questo elenco — le
 * impostazioni personali, domani una pagina qualsiasi — il rail accenderebbe
 * «Oggi», cioè indicherebbe una pagina su cui non si è. Meglio nessuna voce
 * accesa che la voce sbagliata: dire «sei qui» dove non si è è peggio che non
 * dirlo.
 */
export function activeHref(pathname: string): string {
  let best = ''
  for (const item of STAFF_NAV) {
    const hit =
      item.href === '/staff'
        ? pathname === '/staff'
        : pathname === item.href || pathname.startsWith(item.href + '/')
    if (hit && item.href.length > best.length) best = item.href
  }
  return best
}
