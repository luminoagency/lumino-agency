/**
 * Lumino — dati aziendali e di contatto.
 * FONTE UNICA per pagine istituzionali e legali (footer, contatti, privacy, termini…).
 *
 * Lumino è un brand di EMYRA LTD. Nessun dato fiscale italiano (P.IVA, CF, REA, PEC, sede IT).
 *
 * ⚠️ `email` è il SEGNAPOSTO `[EMAIL_DA_DEFINIRE]`: sostituirlo con l'indirizzo reale
 *    in un colpo solo quando disponibile.
 */

export const COMPANY = {
  /** Nome commerciale / brand mostrato ovunque. */
  brand: 'Lumino',

  /** Società titolare del brand. */
  legalName: 'EMYRA LTD',

  /** Contatti pubblici — segnaposto da sostituire. */
  email: '[EMAIL_DA_DEFINIRE]',
  supportEmail: '[EMAIL_DA_DEFINIRE]',
  privacyEmail: '[EMAIL_DA_DEFINIRE]',

  /** Web. */
  website: 'https://bylumino.com',
  domain: 'bylumino.com',

  /** Orari di assistenza (mostrati in Contatti). */
  hours: 'Lun–Ven, 9:00–18:00',
  responseTime: 'Rispondiamo via email entro 1 giorno lavorativo.',

  /** Provider del pagamento. */
  paymentProvider: 'Mollie B.V.',

  /** Data ultimo aggiornamento dei documenti legali. */
  lastUpdated: '24 giugno 2026',
} as const

/** Email come link mailto pronto all'uso. */
export const MAILTO = `mailto:${COMPANY.email}`
