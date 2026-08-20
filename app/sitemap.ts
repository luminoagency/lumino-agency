import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Mappa del sito: SOLO le pagine pubbliche.
 *
 * Elenco esplicito e non generato dalla struttura delle cartelle, di proposito:
 * app/ contiene anche dashboard, pannello, checkout e autenticazione, e una
 * generazione automatica prima o poi ne pubblicherebbe una. Aggiungere una riga
 * a mano è il prezzo giusto per non finire con /lumino-admin indicizzato.
 */

const PUBLIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/chi-siamo', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/portfolio', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/come-funziona', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/pricing', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contatti', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/cookie-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/termini-condizioni', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/gdpr', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/resi-rimborsi', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/disclaimer', priority: 0.3, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return PUBLIC_PAGES.map(({ path, priority, changeFrequency }) => ({
    url: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
