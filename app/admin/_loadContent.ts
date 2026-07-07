import { redirect } from 'next/navigation'
import { getMySite } from './actions/site'

/**
 * Helper comune alle sotto-route del pannello: carica il sito dell'utente e ne
 * estrae il record `site_content` (il join può tornare array o oggetto).
 * Se non loggato/senza sito → redirect al login (lo shell in layout non monta
 * la sidebar in quel caso). `tierGate: true` → 404-like redirect al pannello
 * per i Basic (usato dalle sezioni Pro).
 */
export async function loadAdminContent(routePath: string) {
  const site = await getMySite()
  if (!site) {
    redirect('/login?next=' + encodeURIComponent(routePath) + '&error=' + encodeURIComponent('Accedi per gestire il tuo sito.'))
  }
  const content = Array.isArray((site as any).content) ? (site as any).content[0] : (site as any).content
  return { site: site as any, content: content || {} }
}
