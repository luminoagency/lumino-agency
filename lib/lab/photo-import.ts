/**
 * Photo Import multi-fonte (Layer 4.7) — SERVER ONLY. Solo fetch nativo, nessuna dipendenza.
 * Importa foto reali di un hotel da Booking/TripAdvisor/Google Places/sito, le categorizza
 * con Opus Vision e le carica nella galleria del progetto. Best-effort, graceful degradation.
 */

import 'server-only'
import { randomUUID } from 'crypto'
import { getClaude } from '@/lib/ai/claude'
import { uploadAssetFromBuffer } from '@/lib/lab/branding'
import type { ProjectAsset } from './builder'

export interface PhotoSource {
  name: 'booking' | 'tripadvisor' | 'google' | 'expedia' | 'website'
  url?: string
  query?: string
}
export interface PhotoCandidate {
  url: string
  width?: number
  height?: number
  source: string
  alt?: string
  hash?: string
}
export interface PhotoImportInput {
  projectId: string
  businessName: string
  businessAddress?: string
  sources: PhotoSource[]
  maxPhotos?: number
  minWidth?: number
}
export interface PhotoImportResult {
  found: number
  imported: number
  skipped: number
  categorized: Record<string, number>
  errors: string[]
}

const VALID_CATEGORIES = ['rooms', 'spa', 'restaurant', 'exterior', 'common-areas', 'amenities']

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; LuminoBot/1.0)' }
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function uniqByUrl(list: PhotoCandidate[]): PhotoCandidate[] {
  const seen = new Set<string>()
  const out: PhotoCandidate[] = []
  for (const p of list) {
    const key = p.hash || p.url.split('?')[0]
    if (seen.has(key)) continue
    seen.add(key)
    out.push(p)
  }
  return out
}
function mediaTypeFromUrl(u: string): string {
  if (/\.png(\?|$)/i.test(u)) return 'image/png'
  if (/\.webp(\?|$)/i.test(u)) return 'image/webp'
  if (/\.gif(\?|$)/i.test(u)) return 'image/gif'
  return 'image/jpeg'
}

/* ── Fonti ───────────────────────────────────────────────────────── */

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: UA })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function fetchBookingPhotos(bookingUrl: string): Promise<PhotoCandidate[]> {
  const html = await fetchHtml(bookingUrl)
  await sleep(1000) // rate limit cortese
  const urls = new Set<string>()
  const re = /https:\/\/cf\.bstatic\.com\/[^\s"'\\]+?\.(?:jpg|jpeg|png|webp)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    // upscale: max300/square60/... → max1024
    const hi = m[0].replace(/\/(?:max|square)\d+\//i, '/max1024/')
    urls.add(hi)
  }
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
  if (og) urls.add(og[1])
  return [...urls].map(u => ({ url: u, source: 'booking', width: /max1024/.test(u) ? 1024 : undefined }))
}

async function fetchTripAdvisorPhotos(tripadvisorUrl: string): Promise<PhotoCandidate[]> {
  const html = await fetchHtml(tripadvisorUrl)
  await sleep(1000)
  const urls = new Set<string>()
  const re = /https:\/\/(?:media-cdn|dynamic-media-cdn)\.tripadvisor\.com\/[^\s"'\\]+?\.(?:jpg|jpeg|png|webp)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) urls.add(m[0].replace(/\/photo-[a-z]\//i, '/photo-w/'))
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
  if (og) urls.add(og[1])
  return [...urls].map(u => ({ url: u, source: 'tripadvisor' }))
}

async function fetchGooglePhotos(businessName: string, address?: string): Promise<PhotoCandidate[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY mancante — Google Places saltato')
  const query = encodeURIComponent([businessName, address].filter(Boolean).join(' '))
  const search = await fetch(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${key}`)
  const sj = await search.json()
  const placeId = sj?.candidates?.[0]?.place_id
  if (!placeId) return []
  const det = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${key}`)
  const dj = await det.json()
  const photos = (dj?.result?.photos || []) as Array<{ photo_reference: string; width?: number; height?: number }>
  return photos.map(p => ({
    url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=${p.photo_reference}&key=${key}`,
    width: p.width, height: p.height, source: 'google',
  }))
}

async function fetchWebsitePhotos(websiteUrl: string): Promise<PhotoCandidate[]> {
  const html = await fetchHtml(websiteUrl)
  const base = new URL(websiteUrl)
  const urls = new Set<string>()
  const re = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    let src = m[1]
    if (/logo|icon|sprite|favicon|placeholder|avatar|badge/i.test(src)) continue
    try { src = new URL(src, base).href } catch { continue }
    urls.add(src)
  }
  return [...urls].map(u => ({ url: u, source: 'website' }))
}

/* ── Categorizzazione AI ─────────────────────────────────────────── */

type Categorized = { category: string; alt: string; confidence: number }

async function categorizeBatch(items: Array<{ url: string; buffer: Buffer; mediaType: string }>): Promise<Map<string, Categorized>> {
  const out = new Map<string, Categorized>()
  const SYSTEM = `Sei un categorizzatore di foto per siti di hotel. Per ogni foto fornisci:
- category: una tra rooms | spa | restaurant | exterior | common-areas | amenities (foto generiche/logo/screenshot/mappe => other)
- alt: descrizione 5-15 parole in italiano per accessibilità
- confidence: numero 0-1
Rispondi ESCLUSIVAMENTE con un array JSON di oggetti {category, alt, confidence}, stessa lunghezza e ordine delle foto, senza testo prima o dopo.`
  const claude = getClaude()
  const BATCH = 5
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH)
    try {
      const content: any[] = []
      batch.forEach((it, n) => {
        content.push({ type: 'text', text: `Foto ${n + 1}:` })
        content.push({ type: 'image', source: { type: 'base64', media_type: it.mediaType, data: it.buffer.toString('base64') } })
      })
      content.push({ type: 'text', text: `Categorizza queste ${batch.length} foto (array JSON nello stesso ordine).` })
      const msg = await claude.messages.create({ model: 'claude-opus-4-7', max_tokens: 1500, system: SYSTEM, messages: [{ role: 'user', content }] })
      const block = msg.content.find((b: any) => b.type === 'text')
      let text = block?.type === 'text' ? block.text.trim() : '[]'
      const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i); if (fence) text = fence[1].trim()
      const s = text.indexOf('['); const e = text.lastIndexOf(']'); if (s >= 0 && e > s) text = text.slice(s, e + 1)
      const arr = JSON.parse(text) as Categorized[]
      batch.forEach((it, n) => {
        const r = arr[n]
        out.set(it.url, r && VALID_CATEGORIES.includes(r.category)
          ? { category: r.category, alt: String(r.alt || '').slice(0, 120), confidence: Number(r.confidence) || 0.5 }
          : { category: 'other', alt: r?.alt || '', confidence: 0 })
      })
    } catch {
      // Degradazione: senza categorizzazione, foto restano 'other'.
      batch.forEach(it => out.set(it.url, { category: 'other', alt: '', confidence: 0 }))
    }
  }
  return out
}

/* ── Util ────────────────────────────────────────────────────────── */

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: UA })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function deduplicatePhotos(photos: PhotoCandidate[]): PhotoCandidate[] {
  return uniqByUrl(photos.map(p => ({ ...p, hash: p.url.split('?')[0].split('/').slice(-2).join('/') })))
}

/* ── Orchestrazione ──────────────────────────────────────────────── */

export async function importPhotosForProject(input: PhotoImportInput): Promise<{ result: PhotoImportResult; assets: ProjectAsset[] }> {
  const all: PhotoCandidate[] = []
  const errors: string[] = []

  for (const source of input.sources) {
    try {
      let photos: PhotoCandidate[] = []
      if (source.name === 'booking' && source.url) photos = await fetchBookingPhotos(source.url)
      else if (source.name === 'tripadvisor' && source.url) photos = await fetchTripAdvisorPhotos(source.url)
      else if (source.name === 'google') photos = await fetchGooglePhotos(input.businessName, input.businessAddress)
      else if (source.name === 'website' && source.url) photos = await fetchWebsitePhotos(source.url)
      all.push(...photos)
    } catch (e: any) {
      errors.push(`${source.name}: ${e?.message || e}`)
    }
  }

  const minWidth = input.minWidth || 800
  const deduped = deduplicatePhotos(all)
  const filtered = deduped.filter(p => p.width == null || p.width >= minWidth)
  const top = filtered.slice(0, input.maxPhotos || 50)

  // Scarica i buffer (best-effort) delle top.
  const fetched: Array<{ photo: PhotoCandidate; buffer: Buffer; mediaType: string }> = []
  for (const p of top) {
    try { fetched.push({ photo: p, buffer: await fetchImageBuffer(p.url), mediaType: mediaTypeFromUrl(p.url) }) }
    catch (e: any) { errors.push(`download ${p.source}: ${e?.message || e}`) }
  }

  const cat = await categorizeBatch(fetched.map(f => ({ url: f.photo.url, buffer: f.buffer, mediaType: f.mediaType })))

  const categoryCount: Record<string, number> = {}
  const assets: ProjectAsset[] = []
  for (const f of fetched) {
    const meta = cat.get(f.photo.url)
    if (!meta || meta.category === 'other') continue
    try {
      const up = await uploadAssetFromBuffer(f.buffer, input.projectId, f.mediaType)
      assets.push({
        id: randomUUID(), url: up.url, alt: meta.alt || `${input.businessName} — ${meta.category}`,
        category: meta.category as ProjectAsset['category'], width: up.width, height: up.height,
        uploadedAt: new Date().toISOString(), tags: [f.photo.source],
      })
      categoryCount[meta.category] = (categoryCount[meta.category] || 0) + 1
    } catch (e: any) {
      errors.push(`upload: ${e?.message || e}`)
    }
  }

  return {
    result: { found: all.length, imported: assets.length, skipped: top.length - assets.length, categorized: categoryCount, errors },
    assets,
  }
}
