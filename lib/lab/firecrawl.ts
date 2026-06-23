/**
 * Firecrawl scraping helper per il Lumino Lab (Step 1, Modalità A).
 * Richiede FIRECRAWL_API_KEY. Se manca o lo scrape fallisce, ritorna ok:false
 * e il caller fa fallback alla Modalità B (descrizione).
 */

export interface ScrapeResult {
  ok: boolean
  markdown?: string
  title?: string
  description?: string
  images?: string[]
  error?: string
}

function extractImages(markdown: string): string[] {
  const urls = new Set<string>()
  // ![alt](url)
  const mdImg = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g
  let m: RegExpExecArray | null
  while ((m = mdImg.exec(markdown)) !== null) urls.add(m[1])
  // bare <img src="...">
  const htmlImg = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi
  while ((m = htmlImg.exec(markdown)) !== null) urls.add(m[1])
  return [...urls].filter(u => /\.(jpe?g|png|webp|avif)(\?|$)/i.test(u) || u.includes('image'))
}

export async function scrapeUrl(rawUrl: string): Promise<ScrapeResult> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return { ok: false, error: 'FIRECRAWL_API_KEY non configurata' }

  let url = rawUrl.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 25000,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `Firecrawl ${res.status}: ${body.slice(0, 200)}` }
    }

    const json: any = await res.json()
    const data = json?.data ?? {}
    const markdown: string = data.markdown ?? ''
    const meta = data.metadata ?? {}

    const ogImage: string | undefined = meta.ogImage || meta.og_image
    const images = [ogImage, ...extractImages(markdown)]
      .filter((u): u is string => !!u)
      .filter((u, i, arr) => arr.indexOf(u) === i)
      .slice(0, 12)

    if (!markdown && !meta.title) {
      return { ok: false, error: 'Scrape vuoto: nessun contenuto utile.' }
    }

    return {
      ok: true,
      markdown: markdown.slice(0, 12000),
      title: meta.title,
      description: meta.description,
      images,
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore di rete Firecrawl' }
  }
}
