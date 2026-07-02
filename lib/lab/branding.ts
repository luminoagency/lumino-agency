/**
 * Branding cliente (Layer 2) — SERVER ONLY.
 * Estrazione palette dal logo (node-vibrant), upload su Supabase Storage,
 * lettura dimensioni immagine senza dipendenze native (parser header).
 */

import 'server-only'
import { randomUUID } from 'crypto'
import Vibrant from 'node-vibrant'
import { createAdminClient } from '@/lib/supabase/admin'

export type Palette = { bg: string; ink: string; accent: string; muted: string }

const DEFAULT_PALETTE: Palette = { bg: '#ffffff', ink: '#1a1a1a', accent: '#8b5cf6', muted: '#f5f5f5' }
const BUCKET = 'project-assets'

/* ── Palette extraction ─────────────────────────────────────────── */

type Sw = { hex: string; sat: number; light: number; pop: number }

function toSwatch(s: any): Sw | null {
  if (!s) return null
  try {
    const hsl = typeof s.getHsl === 'function' ? s.getHsl() : s.hsl
    const hex = typeof s.getHex === 'function' ? s.getHex() : s.hex
    const pop = typeof s.getPopulation === 'function' ? s.getPopulation() : (s.population ?? 0)
    if (!hex || !Array.isArray(hsl)) return null
    return { hex: String(hex), sat: Number(hsl[1]) || 0, light: Number(hsl[2]) || 0, pop: Number(pop) || 0 }
  } catch {
    return null
  }
}

/**
 * Estrae una palette {bg, ink, accent, muted} da un buffer immagine (logo).
 * - bg = swatch più chiaro · ink = più scuro · accent = più saturo · muted = meno saturo.
 * Fallback a palette neutra default in caso di errore o immagine senza colori.
 */
export async function extractPaletteFromLogo(imageBuffer: Buffer): Promise<Palette> {
  try {
    const palette = await Vibrant.from(imageBuffer).getPalette()
    const swatches = Object.values(palette).map(toSwatch).filter((s): s is Sw => !!s)
    if (!swatches.length) return DEFAULT_PALETTE

    const byLight = [...swatches].sort((a, b) => a.light - b.light)
    const bySat = [...swatches].sort((a, b) => a.sat - b.sat)

    const ink = byLight[0].hex
    const bg = byLight[byLight.length - 1].light > 0.6 ? byLight[byLight.length - 1].hex : '#ffffff'
    const accent = bySat[bySat.length - 1].hex
    // muted = swatch poco saturo diverso da bg/ink, altrimenti il meno saturo.
    const muted = (bySat.find(s => s.hex !== bg && s.hex !== ink && s.hex !== accent)?.hex) || bySat[0].hex

    return { bg, ink, accent, muted }
  } catch {
    return DEFAULT_PALETTE
  }
}

/* ── Dimensioni immagine (header parser, no deps native) ─────────── */

function imageDimensions(buf: Buffer): { width: number; height: number } {
  try {
    // PNG: signature 89 50 4E 47 ; IHDR width@16 height@20 (big-endian)
    if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
    }
    // GIF: 'GIF' ; width LE@6 height LE@8
    if (buf.length >= 10 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) }
    }
    // JPEG: scan SOF markers
    if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let off = 2
      while (off + 9 < buf.length) {
        if (buf[off] !== 0xff) { off++; continue }
        const marker = buf[off + 1]
        // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) }
        }
        const len = buf.readUInt16BE(off + 2)
        off += 2 + len
      }
    }
  } catch {
    /* ignore */
  }
  return { width: 0, height: 0 }
}

function extFromType(type: string): string {
  if (type.includes('png')) return 'png'
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg'
  if (type.includes('webp')) return 'webp'
  if (type.includes('svg')) return 'svg'
  if (type.includes('gif')) return 'gif'
  return 'png'
}

/**
 * Carica un logo su Supabase Storage (bucket 'project-assets', path {projectId}/logo.{ext}).
 * Ritorna URL pubblico + dimensioni.
 */
export async function uploadLogo(file: File, projectId: string): Promise<{ url: string; width: number; height: number }> {
  const buf = Buffer.from(await file.arrayBuffer())
  const ext = extFromType(file.type || '')
  const admin = createAdminClient()
  const path = `${projectId}/logo.${ext}`

  const { error } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || 'image/png',
    upsert: true,
  })
  if (error) throw new Error(`Upload logo fallito: ${error.message}`)

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  const { width, height } = imageDimensions(buf)
  return { url: data.publicUrl, width, height }
}

/* ── Asset di progetto (Layer 3) ─────────────────────────────────── */

/**
 * Carica una foto del cliente su Storage (path {projectId}/assets/{uuid}.{ext}).
 * Ritorna URL pubblico + dimensioni.
 */
export async function uploadAsset(
  file: File,
  projectId: string,
  category?: string,
): Promise<{ url: string; width: number; height: number }> {
  void category // categoria gestita a livello di metadata ProjectAsset (non nel path)
  const buf = Buffer.from(await file.arrayBuffer())
  const ext = extFromType(file.type || '')
  const admin = createAdminClient()
  const path = `${projectId}/assets/${randomUUID()}.${ext}`

  // TODO: compression con sharp quando installato (resize >1920px, comprimi se >500KB).
  const { error } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (error) throw new Error(`Upload asset fallito: ${error.message}`)

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  const { width, height } = imageDimensions(buf)
  return { url: data.publicUrl, width, height }
}

/** Carica un asset da Buffer (usato dal photo-import, Layer 4.7). */
export async function uploadAssetFromBuffer(buf: Buffer, projectId: string, contentType = 'image/jpeg'): Promise<{ url: string; width: number; height: number }> {
  const ext = extFromType(contentType)
  const admin = createAdminClient()
  const path = `${projectId}/assets/${randomUUID()}.${ext}`
  const { error } = await admin.storage.from(BUCKET).upload(path, buf, { contentType, upsert: false })
  if (error) throw new Error(`Upload asset fallito: ${error.message}`)
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  const { width, height } = imageDimensions(buf)
  return { url: data.publicUrl, width, height }
}

/** Cancella un asset dallo Storage dato il suo URL pubblico. */
export async function deleteAsset(assetUrl: string): Promise<void> {
  const marker = `/${BUCKET}/`
  const idx = assetUrl.indexOf(marker)
  if (idx === -1) return
  const path = assetUrl.slice(idx + marker.length)
  if (!path) return
  const admin = createAdminClient()
  await admin.storage.from(BUCKET).remove([path])
}
