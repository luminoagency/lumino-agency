import { COMPANY } from './company'

/**
 * Fonte unica per l'indirizzo del sito e per i dati strutturati.
 *
 * Il dominio canonico è la versione CON www: sceglierne uno è obbligatorio,
 * perché www e non-www sono due indirizzi distinti per i motori di ricerca e
 * lasciarli entrambi raggiungibili significa dividere in due il valore di ogni
 * link. Il reindirizzamento dell'altro sta in next.config.js.
 */
export const SITE_URL = 'https://www.bylumino.com'

export const SITE_NAME = 'Lumino'

/** Massimo 155 caratteri: oltre, Google taglia. */
export const SITE_DESCRIPTION =
  'Studio digitale: progettiamo e costruiamo siti su misura per ristoranti, hotel, aziende e retail. Identità, interfacce e movimento.'

export const OG_IMAGE = {
  url: `${SITE_URL}/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: 'Lumino — Diamo forma al sito che il tuo brand merita',
}

/** URL assoluto di una pagina, per canonical e Open Graph. */
export function pageUrl(path = '/') {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`
}

/**
 * Dati strutturati dello studio.
 *
 * ProfessionalService (che discende da LocalBusiness) invece del semplice
 * Organization: dice che è un'attività che eroga un servizio, non un ente
 * generico, ed è ciò che permette a Google di associarci a una zona servita.
 */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE_URL}/#studio`,
    name: SITE_NAME,
    legalName: COMPANY.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    image: OG_IMAGE.url,
    description: SITE_DESCRIPTION,
    email: COMPANY.email,
    telephone: `+${COMPANY.whatsapp.number}`,
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${COMPANY.address.line1}, ${COMPANY.address.line2}`,
      addressLocality: COMPANY.address.city,
      postalCode: COMPANY.address.postalCode,
      addressCountry: 'GB',
    },
    areaServed: [
      { '@type': 'Country', name: 'Italia' },
      { '@type': 'Country', name: 'United Kingdom' },
    ],
    knowsLanguage: ['it', 'en'],
    serviceType: [
      'Progettazione siti web',
      'Identità visiva',
      'Motion design',
      'Manutenzione siti web',
    ],
    identifier: {
      '@type': 'PropertyValue',
      name: 'Companies House',
      value: COMPANY.companyNumber,
    },
  }
}
