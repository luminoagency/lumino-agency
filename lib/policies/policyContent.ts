/**
 * Contenuti legali dei siti dei ristoratori: Cookie Policy (Garante 2021) e
 * Privacy Policy (GDPR). Generati con i dati del ristoratore, IT + EN.
 *
 * Il titolare del trattamento è il RISTORATORE, non Lumino. Formule standard
 * rielaborate (niente copia da terzi), voce di brand: frasi brevi, "tu", verbi
 * attivi, nessuna parola vietata.
 */

import type { Locale } from '@/lib/sites/i18n'

export type RestaurantPolicyData = {
  name: string
  address: string
  email: string
  city?: string
  vatNumber?: string
}

export type PolicyBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }

export type PolicySection = {
  heading: string
  blocks: PolicyBlock[]
}

/** Data ultimo aggiornamento, formattata nella lingua scelta. */
function formattedToday(locale: Locale): string {
  return new Date().toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Riga "titolare" con fallback su indirizzo/email mancanti. */
function ownerLine(d: RestaurantPolicyData, locale: Locale): string {
  const place = d.address
    ? d.address + (d.city && !d.address.includes(d.city) ? `, ${d.city}` : '')
    : d.city || ''
  if (locale === 'it') {
    const base = place ? `Il titolare del trattamento è ${d.name}, con sede in ${place}.` : `Il titolare del trattamento è ${d.name}.`
    const vat = d.vatNumber ? ` P.IVA ${d.vatNumber}.` : ''
    return base + vat
  }
  const base = place ? `The data controller is ${d.name}, based at ${place}.` : `The data controller is ${d.name}.`
  const vat = d.vatNumber ? ` VAT ${d.vatNumber}.` : ''
  return base + vat
}

/** Contatto per esercitare i diritti, con fallback se manca l'email. */
function contactLine(d: RestaurantPolicyData, locale: Locale): string {
  if (d.email) {
    return locale === 'it'
      ? `Per qualsiasi richiesta scrivi a ${d.email}.`
      : `For any request, write to ${d.email}.`
  }
  return locale === 'it'
    ? 'Per qualsiasi richiesta usa i contatti disponibili sul sito.'
    : 'For any request, use the contact details available on the site.'
}

// ─────────────────────────────── COOKIE POLICY ───────────────────────────────

export function getCookiePolicyContent(d: RestaurantPolicyData, locale: Locale): PolicySection[] {
  const updated = formattedToday(locale)
  if (locale === 'en') {
    return [
      { heading: 'Data controller', blocks: [
        { type: 'p', text: ownerLine(d, 'en') },
        { type: 'p', text: contactLine(d, 'en') },
      ]},
      { heading: 'What cookies are', blocks: [
        { type: 'p', text: 'Cookies are small text files the site saves on your device. They keep the site working and, with your consent, help us understand how it is used.' },
      ]},
      { heading: 'Cookies we use', blocks: [
        { type: 'ul', items: [
          'Technical cookies: needed for the site to work. They run without consent.',
          'Analytics cookies: help us read anonymous, aggregated visit data. Off until you allow them.',
          'Marketing cookies: used to show more relevant content and measure it. Off until you allow them.',
        ]},
      ]},
      { heading: 'Managing your consent', blocks: [
        { type: 'p', text: 'On your first visit a banner lets you accept, reject or choose each category. You can change your choice anytime from the "Manage cookies" link in the footer.' },
        { type: 'p', text: 'You can also block or delete cookies from your browser settings. Some features may then stop working.' },
      ]},
      { heading: 'Last updated', blocks: [
        { type: 'p', text: updated },
      ]},
    ]
  }
  return [
    { heading: 'Titolare del trattamento', blocks: [
      { type: 'p', text: ownerLine(d, 'it') },
      { type: 'p', text: contactLine(d, 'it') },
    ]},
    { heading: 'Cosa sono i cookie', blocks: [
      { type: 'p', text: 'I cookie sono piccoli file di testo che il sito salva sul tuo dispositivo. Servono a far funzionare il sito e, con il tuo consenso, ad aiutarci a capire come viene usato.' },
    ]},
    { heading: 'I cookie che usiamo', blocks: [
      { type: 'ul', items: [
        'Cookie tecnici: servono al funzionamento del sito. Restano attivi senza bisogno di consenso.',
        'Cookie di analisi: ci aiutano a leggere dati di visita anonimi e aggregati. Restano spenti finché non li attivi.',
        'Cookie di marketing: servono a mostrarti contenuti più rilevanti e a misurarli. Restano spenti finché non li attivi.',
      ]},
    ]},
    { heading: 'Come gestire il consenso', blocks: [
      { type: 'p', text: 'Alla prima visita un banner ti fa accettare, rifiutare o scegliere categoria per categoria. Puoi cambiare la scelta quando vuoi dal link "Gestisci cookie" in fondo al sito.' },
      { type: 'p', text: 'Puoi anche bloccare o cancellare i cookie dalle impostazioni del browser. Alcune funzioni potrebbero smettere di funzionare.' },
    ]},
    { heading: 'Ultimo aggiornamento', blocks: [
      { type: 'p', text: updated },
    ]},
  ]
}

// ─────────────────────────────── PRIVACY POLICY ───────────────────────────────

export function getPrivacyPolicyContent(d: RestaurantPolicyData, locale: Locale): PolicySection[] {
  const updated = formattedToday(locale)
  if (locale === 'en') {
    return [
      { heading: 'Data controller', blocks: [
        { type: 'p', text: ownerLine(d, 'en') },
        { type: 'p', text: contactLine(d, 'en') },
      ]},
      { heading: 'Data we collect', blocks: [
        { type: 'ul', items: [
          'Booking data: name and contact details you enter to reserve a table.',
          'Contact data: what you send us through forms or messages.',
          'Newsletter data: your email, if you sign up.',
        ]},
      ]},
      { heading: 'Why we process it', blocks: [
        { type: 'p', text: 'We use your data to manage bookings, answer you, and — only if you sign up — send our updates.' },
      ]},
      { heading: 'Legal basis', blocks: [
        { type: 'p', text: 'We rely on your consent for the newsletter, and on the performance of a service you request for bookings and replies.' },
      ]},
      { heading: 'How long we keep it', blocks: [
        { type: 'p', text: 'We keep your data only as long as needed for the purpose above, then delete it. Newsletter data stays until you unsubscribe.' },
      ]},
      { heading: 'Your rights', blocks: [
        { type: 'ul', items: [
          'Access your data.',
          'Correct it.',
          'Delete it.',
          'Object to its processing.',
        ]},
      ]},
      { heading: 'How to exercise your rights', blocks: [
        { type: 'p', text: contactLine(d, 'en') },
      ]},
      { heading: 'Changes to this policy', blocks: [
        { type: 'p', text: 'We may update this policy. We publish changes on this page with a new date.' },
      ]},
      { heading: 'Last updated', blocks: [
        { type: 'p', text: updated },
      ]},
    ]
  }
  return [
    { heading: 'Titolare del trattamento', blocks: [
      { type: 'p', text: ownerLine(d, 'it') },
      { type: 'p', text: contactLine(d, 'it') },
    ]},
    { heading: 'Dati che raccogliamo', blocks: [
      { type: 'ul', items: [
        'Dati di prenotazione: nome e contatti che inserisci per prenotare un tavolo.',
        'Dati di contatto: quello che ci scrivi tramite moduli o messaggi.',
        'Dati newsletter: la tua email, se ti iscrivi.',
      ]},
    ]},
    { heading: 'Perché li trattiamo', blocks: [
      { type: 'p', text: 'Usiamo i tuoi dati per gestire le prenotazioni, risponderti e — solo se ti iscrivi — inviarti i nostri aggiornamenti.' },
    ]},
    { heading: 'Base giuridica', blocks: [
      { type: 'p', text: 'Ci basiamo sul tuo consenso per la newsletter e sull’esecuzione di un servizio che chiedi tu per prenotazioni e risposte.' },
    ]},
    { heading: 'Per quanto li conserviamo', blocks: [
      { type: 'p', text: 'Teniamo i tuoi dati solo per il tempo necessario allo scopo indicato, poi li cancelliamo. I dati della newsletter restano finché non ti disiscrivi.' },
    ]},
    { heading: 'I tuoi diritti', blocks: [
      { type: 'ul', items: [
        'Accedere ai tuoi dati.',
        'Correggerli.',
        'Cancellarli.',
        'Opporti al loro trattamento.',
      ]},
    ]},
    { heading: 'Come esercitare i diritti', blocks: [
      { type: 'p', text: contactLine(d, 'it') },
    ]},
    { heading: 'Modifiche a questa policy', blocks: [
      { type: 'p', text: 'Possiamo aggiornare questa policy. Pubblichiamo le modifiche su questa pagina con una nuova data.' },
    ]},
    { heading: 'Ultimo aggiornamento', blocks: [
      { type: 'p', text: updated },
    ]},
  ]
}
