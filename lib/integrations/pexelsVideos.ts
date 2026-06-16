/**
 * Pexels Videos — hero video gratis (signup gratis, no credit card).
 *
 * Docs: https://www.pexels.com/api/documentation/#videos-search
 * Limiti free tier: 200 req/h, 20.000 req/mese.
 *
 * Env var: PEXELS_API_KEY
 *
 * Usage:
 *   const v = await searchHeroVideo('fine dining restaurant cinematic')
 *   if (v) site_content.video_url = v.url
 */

export interface PexelsHeroVideo {
  url: string         // MP4 link diretto, pronto da mettere in <video src>
  posterUrl: string   // thumbnail per poster del video
  duration: number    // secondi
  width: number
  height: number
  source: 'pexels'
}

type TemplateKey = 'cinematico' | 'bento' | 'panoramico' | 'aurora' | 'mercato'

/** Query mappata per template, ottimizzata per atmosfera ristorante. */
const TEMPLATE_QUERIES: Record<TemplateKey, string> = {
  cinematico: 'fine dining restaurant cinematic',
  bento:      'burger sizzle close up',
  panoramico: 'seaside restaurant ocean view',
  aurora:     'sushi neon lounge',
  mercato:    'italian market vintage',
}

/**
 * Cerca su Pexels un hero video adatto al template.
 * Fallback: ritorna null se Pexels non risponde o se manca API key (mai blocca).
 */
export async function searchHeroVideoForTemplate(template: TemplateKey): Promise<PexelsHeroVideo | null> {
  return searchHeroVideo(TEMPLATE_QUERIES[template])
}

/**
 * Cerca un video orizzontale 1080p (o vicino) data una query.
 * Ritorna il primo risultato accettabile (5-30 secondi, MP4).
 */
export async function searchHeroVideo(
  query: string,
  orientation: 'landscape' | 'portrait' | 'square' = 'landscape',
): Promise<PexelsHeroVideo | null> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[pexels] PEXELS_API_KEY non configurata, skip video')
    }
    return null
  }

  const url = new URL('https://api.pexels.com/videos/search')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '15')
  url.searchParams.set('orientation', orientation)
  url.searchParams.set('size', 'medium')

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: apiKey },
      // Cache 24h: hero video non cambia spesso
      next: { revalidate: 60 * 60 * 24 },
    })
    if (!res.ok) {
      console.warn(`[pexels] HTTP ${res.status} per query "${query}"`)
      return null
    }
    const json: any = await res.json()
    const videos: any[] = Array.isArray(json.videos) ? json.videos : []
    if (videos.length === 0) return null

    for (const v of videos) {
      // Durata accettabile: 5-30s (loop fluido senza essere troppo lungo)
      const duration = Number(v.duration) || 0
      if (duration < 5 || duration > 30) continue

      // Trova file MP4 con larghezza ≥ 1080 (preferenza per HD)
      const files: any[] = Array.isArray(v.video_files) ? v.video_files : []
      const mp4 = files
        .filter(f => (f.file_type || '').includes('mp4'))
        .sort((a, b) => (b.width || 0) - (a.width || 0))
      const best = mp4.find(f => (f.width || 0) >= 1280) || mp4[0]
      if (!best?.link) continue

      const pictures: any[] = Array.isArray(v.video_pictures) ? v.video_pictures : []
      const posterUrl = pictures[0]?.picture || v.image || ''

      return {
        url: best.link,
        posterUrl,
        duration,
        width: best.width || 1920,
        height: best.height || 1080,
        source: 'pexels',
      }
    }

    return null
  } catch (err: any) {
    console.warn('[pexels] errore richiesta:', err?.message || err)
    return null
  }
}
