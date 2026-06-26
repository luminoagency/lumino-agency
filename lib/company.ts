/**
 * Lumino — dati aziendali e di contatto.
 * FONTE UNICA per pagine istituzionali e legali (footer, contatti, privacy, termini…).
 *
 * Lumino è un brand di EMYRA LTD. Nessun dato fiscale italiano (P.IVA, CF, REA, PEC, sede IT).
 *
 * Tutte le email pubbliche leggono da PUBLIC_CONTACT_EMAIL: per cambiarle basta
 * aggiornare quella costante (vedi PIANO_B_CHECKLIST.md, passo 4).
 */

/** Email pubblica usata ovunque sul sito (footer, contatti, legali). */
export const PUBLIC_CONTACT_EMAIL = 'studio.bylumino@gmail.com'

export const COMPANY = {
  /** Nome commerciale / brand mostrato ovunque. */
  brand: 'Lumino',

  /** Società titolare del brand. */
  legalName: 'EMYRA LTD',

  /** Contatti pubblici — tutti leggono dalla costante centrale. */
  email: PUBLIC_CONTACT_EMAIL,
  supportEmail: PUBLIC_CONTACT_EMAIL,
  privacyEmail: PUBLIC_CONTACT_EMAIL,

  /** Web. */
  website: 'https://bylumino.com',
  domain: 'bylumino.com',

  /** Orari di assistenza (mostrati in Contatti). */
  hours: 'Lun–Ven, 9:00–18:00',
  responseTime: 'Rispondiamo via email entro 1 giorno lavorativo.',

  /** Provider del pagamento — riferimento neutro, nessun nome specifico. */
  paymentProvider: 'certificato PCI-compliant',

  /** Data ultimo aggiornamento dei documenti legali. */
  lastUpdated: '24 giugno 2026',
} as const

/** Email come link mailto pronto all'uso. */
export const MAILTO = `mailto:${COMPANY.email}`
