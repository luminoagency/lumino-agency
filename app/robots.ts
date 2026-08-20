import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Cosa possono guardare i motori di ricerca.
 *
 * Le aree escluse non sono "segrete" — sono già protette da autenticazione —
 * ma non hanno alcun motivo di finire in un indice: sono strumenti di lavoro e
 * pagine di pagamento, e comparire in una ricerca le espone soltanto.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
          '/lumino-admin',
          '/lumino-dashboard',
          '/pay/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/auth/',
          '/preview',
          '/lab-preview',
          /* Demo e anteprime dei siti clienti: vivono sui domini dei clienti,
             qui sarebbero contenuto duplicato che compete col loro. */
          '/demo/',
          '/sites/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
