'use client'

import { useState, useTransition } from 'react'
import { AdminSectionHead } from '../AdminSectionHead'
import { ImageUploader } from '../ImageUploader'
import { uploadSiteImage, saveSiteGallery, deleteSiteImage } from '../actions/images'
import { type GalleryImage, MAX_GALLERY } from '@/lib/images/gallery'

/**
 * Gestore foto della gallery (Pro/Premium). Carica / elimina / riordina.
 * Salvataggio immediato dopo ogni azione (niente stato "non salvato" da perdere):
 * ogni modifica persiste subito su site_content.gallery_images e si riflette sul sito.
 */

/** Ricava il path su Storage da un URL del nostro bucket (null se foto esterna). */
function ourStoragePath(url: string): string | null {
  const marker = '/storage/v1/object/public/site-images/'
  const i = url.indexOf(marker)
  return i >= 0 ? url.slice(i + marker.length) : null
}

export function GalleryManager({ initial, siteSlug }: { initial: GalleryImage[]; siteSlug: string }) {
  const [photos, setPhotos] = useState<GalleryImage[]>(initial)
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg?: string } | null>(null)

  function flash(ok: boolean, msg: string) {
    setFeedback({ ok, msg })
    setTimeout(() => setFeedback(null), 2500)
  }

  /** Applica la nuova lista in modo ottimistico e persiste; su errore ripristina. */
  function persist(next: GalleryImage[], okMsg: string) {
    const prev = photos
    setPhotos(next)
    startTransition(async () => {
      const r = await saveSiteGallery(next)
      if (r.ok) flash(true, okMsg)
      else { setPhotos(prev); flash(false, r.error || 'Errore nel salvataggio.') }
    })
  }

  function onUploaded(url?: string) {
    if (!url) return
    if (photos.length >= MAX_GALLERY) return
    persist([...photos, { url, alt: '' }], '✓ Foto aggiunta')
  }

  function remove(i: number) {
    if (!confirm('Rimuovere questa foto dalla gallery?')) return
    const target = photos[i]
    const next = photos.filter((_, idx) => idx !== i)
    persist(next, '✓ Foto rimossa')
    // Cancella anche da Storage se è una nostra foto (non blocca la UI).
    const path = ourStoragePath(target.url)
    if (path) deleteSiteImage(path).catch(() => {})
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= photos.length) return
    const next = [...photos]
    ;[next[i], next[j]] = [next[j], next[i]]
    persist(next, '✓ Ordine aggiornato')
  }

  const full = photos.length >= MAX_GALLERY

  return (
    <div className="ac-wrap">
      <AdminSectionHead title="Gallery" sub={`Le foto in evidenza del tuo sito. ${photos.length}/${MAX_GALLERY} foto.`} siteSlug={siteSlug} />

      <div className="ae-section">
        {photos.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 4px' }}>Nessuna foto ancora. Aggiungine qui sotto.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {photos.map((p, i) => (
              <div key={p.url + i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '1' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 6, background: 'linear-gradient(180deg, rgba(0,0,0,0.35), transparent 30%, transparent 70%, rgba(0,0,0,0.45))' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => remove(i)} disabled={pending} title="Rimuovi" style={btn('rgba(239,68,68,0.85)')}>✕</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button type="button" onClick={() => move(i, -1)} disabled={pending || i === 0} title="Sposta a sinistra" style={btn('rgba(0,0,0,0.55)')}>←</button>
                    <span style={{ ...badge, }}>{i + 1}</span>
                    <button type="button" onClick={() => move(i, 1)} disabled={pending || i === photos.length - 1} title="Sposta a destra" style={btn('rgba(0,0,0,0.55)')}>→</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ae-section">
        <h2 className="ae-h2">Aggiungi foto</h2>
        <p className="ae-h2-sub">JPG, PNG o WebP · max 8MB. La ottimizziamo noi automaticamente.</p>
        {full ? (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13.5, margin: 0 }}>
            Hai raggiunto il massimo di {MAX_GALLERY} foto. Rimuovine una per aggiungerne un’altra.
          </p>
        ) : (
          <ImageUploader kind="gallery" action={uploadSiteImage} onUploaded={r => onUploaded(r.url)} resetAfterUpload hint={`Puoi aggiungere ancora ${MAX_GALLERY - photos.length} foto`} />
        )}
      </div>

      {feedback && (
        <div className="ae-savebar">
          <span className={`ae-feedback ${feedback.ok ? 'ae-feedback-ok' : 'ae-feedback-err'}`}>{feedback.msg}</span>
        </div>
      )}
    </div>
  )
}

const badge: React.CSSProperties = { minWidth: 22, height: 24, borderRadius: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }
function btn(bg: string): React.CSSProperties {
  return { width: 26, height: 26, borderRadius: 6, border: 0, background: bg, color: '#fff', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }
}
