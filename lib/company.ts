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

  /** Registro imprese UK (Companies House). */
  companyNumber: '16999697',

  /** Sede legale registrata (UK). */
  address: {
    line1: '27 Old Gloucester Street',
    line2: 'Covent Garden',
    city: 'London',
    postalCode: 'WC1N 3AX',
    country: 'United Kingdom',
    full: '27 Old Gloucester Street, Covent Garden, London, WC1N 3AX, United Kingdom',
  },

  /** Contatti pubblici — tutti leggono dalla costante centrale. */
  email: PUBLIC_CONTACT_EMAIL,
  supportEmail: PUBLIC_CONTACT_EMAIL,
  privacyEmail: PUBLIC_CONTACT_EMAIL,

  /** WhatsApp pubblico — link wa.me PULITO, senza testo precompilato. */
  whatsapp: {
    /** Numero in formato wa.me (prefisso internazionale, niente + né spazi). */
    number: '447454751562',
    /** Link pronto all'uso. NESSUN ?text= (lo studio è fatto di persone reali). */
    waLink: 'https://wa.me/447454751562',
  },

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
