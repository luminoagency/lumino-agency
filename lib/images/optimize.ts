import sharp from 'sharp'

/**
 * Ottimizzazione immagini lato server (riutilizzabile da gallery e menu).
 * Ridimensiona al lato lungo max 1600px, converte in WebP q80. Contiene
 * spazio/costi su Storage senza degradare la resa sul sito.
 */

export const MAX_INPUT_BYTES = 8 * 1024 * 1024 // 8MB in ingresso
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_LONG_EDGE = 1600
export const WEBP_QUALITY = 80

export type OptimizeResult = {
  buffer: Buffer
  contentType: 'image/webp'
  width: number
  height: number
  bytes: number
}

/** Valida tipo e peso in ingresso. Ritorna un messaggio d'errore (IT) o null se ok. */
export function validateImageInput(mime: string, bytes: number): string | null {
  if (!ALLOWED_MIME.includes(mime as any)) return 'Formato non valido. Carica un’immagine JPG, PNG o WebP.'
  if (bytes > MAX_INPUT_BYTES) return `Immagine troppo pesante (max 8MB). La tua è ${(bytes / 1024 / 1024).toFixed(1)}MB.`
  return null
}

/** Ridimensiona + comprime in WebP. Lancia se il buffer non è un'immagine valida. */
export async function optimizeImage(input: Buffer): Promise<OptimizeResult> {
  const out = await sharp(input)
    .rotate() // rispetta l'orientamento EXIF
    .resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true })
  return {
    buffer: out.data,
    contentType: 'image/webp',
    width: out.info.width,
    height: out.info.height,
    bytes: out.data.length,
  }
}
