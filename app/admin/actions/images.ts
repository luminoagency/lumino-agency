'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { optimizeImage, validateImageInput } from '@/lib/images/optimize'
import { MAX_GALLERY, type GalleryImage } from '@/lib/images/gallery'

/**
 * Upload immagini del sito (gallery + foto piatti menu). Solo Pro/Premium.
 *
 * Sicurezza: la scrittura su Storage passa dall'admin client (service role),
 * MA solo dopo aver verificato in codice che l'utente è l'owner del sito e che
 * il piano è Pro/Premium. Il bucket è public in LETTURA (le foto si vedono sui
 * siti). Non servono policy RLS di scrittura sullo storage: l'enforcement è qui.
 */

const BUCKET = 'site-images'

export type UploadImageResult = {
  ok: boolean
  error?: string
  url?: string
  path?: string
  bytesBefore?: number
  bytesAfter?: number
  width?: number
  height?: number
}

async function requireProOwner() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autenticato.' as const }
  const { data: owner } = await supabase.from('site_owners').select('site_id').eq('user_id', user.id).maybeSingle()
  if (!owner) return { error: 'Nessun sito associato.' as const }
  const { data: siteRow } = await supabase.from('sites').select('tier').eq('id', owner.site_id).maybeSingle()
  if (!siteRow || (siteRow as { tier: string }).tier === 'basic') {
    return { error: 'Il caricamento immagini è incluso nei piani Pro e Premium.' as const }
  }
  return { siteId: owner.site_id as string }
}

export async function uploadSiteImage(formData: FormData): Promise<UploadImageResult> {
  const file = formData.get('file')
  const kind = String(formData.get('kind') || '')
  const refIdRaw = formData.get('refId')
  const refId = refIdRaw ? String(refIdRaw).replace(/[^a-zA-Z0-9_-]/g, '') : null

  if (!(file instanceof File)) return { ok: false, error: 'Nessun file ricevuto.' }
  if (kind !== 'gallery' && kind !== 'menu') return { ok: false, error: 'Tipo di immagine non valido.' }

  const guard = await requireProOwner()
  if ('error' in guard) return { ok: false, error: guard.error }

  const bytesBefore = file.size
  const invalid = validateImageInput(file.type, bytesBefore)
  if (invalid) return { ok: false, error: invalid }

  let opt
  try {
    opt = await optimizeImage(Buffer.from(await file.arrayBuffer()))
  } catch {
    return { ok: false, error: 'Immagine non leggibile o corrotta. Prova con un altro file.' }
  }

  const uid = crypto.randomUUID()
  const seg = kind === 'menu' ? `menu/${refId || uid}` : `gallery/${uid}`
  const path = `${guard.siteId}/${seg}.webp`

  const admin = createAdminClient()
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, opt.buffer, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (upErr) return { ok: false, error: upErr.message }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  return {
    ok: true,
    url: pub.publicUrl,
    path,
    bytesBefore,
    bytesAfter: opt.bytes,
    width: opt.width,
    height: opt.height,
  }
}

/**
 * Salva la lista ordinata delle foto della gallery su `site_content.gallery_images`
 * (JSONB) — stessa fonte letta dai 5 template. UPDATE (non upsert), gate owner/tier.
 */
export async function saveSiteGallery(images: GalleryImage[]): Promise<{ ok: boolean; error?: string }> {
  const guard = await requireProOwner()
  if ('error' in guard) return { ok: false, error: guard.error }

  const clean = (Array.isArray(images) ? images : [])
    .filter(i => i && typeof i.url === 'string' && i.url.trim())
    .slice(0, MAX_GALLERY)
    .map(i => ({
      url: i.url,
      alt: typeof i.alt === 'string' ? i.alt : '',
      ...(i.caption ? { caption: String(i.caption) } : {}),
    }))

  const supabase = createClient()
  const { error } = await supabase.from('site_content').update({ gallery_images: clean }).eq('site_id', guard.siteId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/gallery-admin')
  revalidatePath('/sites/[slug]', 'page')
  return { ok: true }
}

export async function deleteSiteImage(path: string): Promise<{ ok: boolean; error?: string }> {
  if (!path) return { ok: false, error: 'Percorso mancante.' }
  const guard = await requireProOwner()
  if ('error' in guard) return { ok: false, error: guard.error }
  // Difesa: si può cancellare solo dentro la cartella del proprio sito.
  if (!path.startsWith(`${guard.siteId}/`)) return { ok: false, error: 'Percorso non valido.' }

  const admin = createAdminClient()
  const { error } = await admin.storage.from(BUCKET).remove([path])
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
