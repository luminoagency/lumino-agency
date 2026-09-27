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
export const FASE_VIVA = 3

export interface StaffNavItem {
  href: string
  label: string
  /** Etichetta corta per la barra in basso sul telefono. */
  short: string
  /** Fase del piano in cui la pagina viene costruita. Vedi FASE_VIVA. */
  fase: 1 | 2 | 3 | 4 | 5
  adminOnly?: boolean
  /** Le cinque voci che stanno nella barra mobile. */
  mobile?: boolean
}

export const STAFF_NAV: StaffNavItem[] = [
  { href: '/staff', label: 'Oggi', short: 'Oggi', fase: 1, mobile: true },
  { href: '/staff/pipeline', label: 'Pipeline', short: 'Pipeline', fase: 1, mobile: true },
  { href: '/staff/clienti', label: 'Clienti', short: 'Clienti', fase: 1, mobile: true },
  { href: '/staff/campo', label: 'Campo', short: 'Campo', fase: 3, mobile: true },
  { href: '/staff/soldi', label: 'Soldi', short: 'Soldi', fase: 4 },
  { href: '/staff/progetti', label: 'Progetti', short: 'Progetti', fase: 4 },
  { href: '/staff/statistiche', label: 'Statistiche', short: 'Stats', fase: 4 },
  { href: '/staff/team', label: 'Team', short: 'Team', fase: 4, adminOnly: true },
  { href: '/staff/risorse', label: 'Risorse', short: 'Risorse', fase: 5 },
  { href: '/staff/lab-ai', label: 'Lab AI', short: 'Lab', fase: 5 },
  { href: '/staff/agent', label: 'Ricerca Agent', short: 'Agent', fase: 5 },
]

export function visibleNav(isAdmin: boolean): StaffNavItem[] {
  return STAFF_NAV.filter((item) => !item.adminOnly || isAdmin)
}

/** La voce attiva: il match più lungo, così /staff non vince su /staff/soldi. */
export function activeHref(pathname: string): string {
  let best = ''
  for (const item of STAFF_NAV) {
    const hit = pathname === item.href || pathname.startsWith(item.href + '/')
    if (hit && item.href.length > best.length) best = item.href
  }
  return best
}
