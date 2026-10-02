import type { StaffProfile, StaffRole } from './types'

/**
 * Chi può cosa, in un posto solo.
 *
 * ## Due cancelli, e solo uno è vero
 *
 * Questo file è il cancello dell'**interfaccia**: decide quali voci di menù
 * esistono, quali card si disegnano, quali importi compaiono. Non protegge
 * niente, e va letto sapendolo: la chiave anon di Supabase sta nel bundle del
 * browser, quindi chiunque abbia una sessione valida può chiamare PostgREST a
 * mano. Il cancello vero è la RLS della migration 0040, che spegne le **righe**
 * — un membro senza `can_view_soldi` non riceve i canoni dal database nemmeno
 * chiedendoli direttamente.
 *
 * Perché allora esiste anche questo? Perché una dashboard che mostra una
 * sezione Soldi piena di zeri non dice «non ti è permesso»: dice «non hai
 * venduto niente». Nascondere e negare sono due lavori diversi e servono
 * entrambi, e si fanno in due posti diversi apposta.
 *
 * ## `eAdmin()` e non `role === 'admin'`
 *
 * Dalla 0040 i ruoli sono tre, e `owner` sta **sopra** admin. Un confronto
 * diretto con la stringa 'admin' risponde `false` all'owner, cioè toglie al
 * titolare i permessi che ha concesso a tutti gli altri. È già il motivo per
 * cui in SQL `is_staff_admin()` include l'owner: qui si fa la stessa cosa, con
 * lo stesso nome e la stessa ragione.
 */

export const PERMESSI = [
  'can_view_soldi',
  'can_view_incassi',
  'can_manage_clients',
  'can_view_trattative',
] as const

export type Permesso = (typeof PERMESSI)[number]

/** Il nome del permesso come lo legge chi lo accende. */
export const PERMESSO_LABEL: Record<Permesso, string> = {
  can_view_soldi: 'Soldi',
  can_view_incassi: 'Incassi',
  can_manage_clients: 'Gestire i clienti',
  can_view_trattative: 'Trattative',
}

/**
 * Cosa succede davvero spegnendolo.
 *
 * Una riga per permesso, e dice il **conseguenze** e non il nome della colonna:
 * chi sta per togliere qualcosa a un collega deve leggere cosa quel collega
 * smetterà di vedere, non ripetere l'etichetta dell'interruttore.
 */
export const PERMESSO_SPIEGA: Record<Permesso, string> = {
  can_view_soldi: 'La sezione Soldi, i canoni, gli extra e ogni importo che ne discende.',
  can_view_incassi: 'Segnare e annullare un incasso, e vedere i canoni già entrati.',
  can_manage_clients:
    'Creare, modificare, spostare di stato ed eliminare clienti. Vederli resta possibile.',
  can_view_trattative: 'Le trattative e le condizioni: prezzo, sconto, modalità di pagamento.',
}

/* ─────────────────────────────────────────────────────────────────────────── */

/** Il titolare: uno solo, e gestisce la squadra. */
export function eOwner(p: Pick<StaffProfile, 'role'>): boolean {
  return p.role === 'owner'
}

/**
 * Poteri da amministratore: vede il lavoro di tutti, non solo il proprio.
 *
 * Include l'owner. Vedi la nota in testa al file — non è una comodità, è la
 * differenza fra «owner è il grado più alto» e «owner è un grado a parte».
 */
export function eAdmin(p: Pick<StaffProfile, 'role'>): boolean {
  return p.role === 'admin' || p.role === 'owner'
}

/**
 * Il permesso di una persona.
 *
 * L'owner passa sempre, come in `staff_has_perm()`: chi assegna i permessi non
 * può chiudersi fuori da solo, perché non ha nessuno a cui chiedere di
 * riaprirlo. Un admin **no** — è il senso di tutta la 0040.
 */
export function puo(p: StaffProfile, perm: Permesso): boolean {
  if (eOwner(p)) return true
  return p[perm] === true
}

/** Quali dei quattro ha, come oggetto: comodo da passare a un componente. */
export function permessiDi(p: StaffProfile): Record<Permesso, boolean> {
  return {
    can_view_soldi: puo(p, 'can_view_soldi'),
    can_view_incassi: puo(p, 'can_view_incassi'),
    can_manage_clients: puo(p, 'can_manage_clients'),
    can_view_trattative: puo(p, 'can_view_trattative'),
  }
}

/** Chi apre il pannello Team. Due condizioni che dicono la stessa cosa. */
export function puoGestireTeam(p: StaffProfile): boolean {
  return eOwner(p) && p.puo_creare_membri
}

/** L'etichetta del ruolo, dove si mostra a una persona. */
export const RUOLO_LABEL: Record<StaffRole, string> = {
  owner: 'Titolare',
  admin: 'Amministratore',
  sales: 'Venditore',
}
