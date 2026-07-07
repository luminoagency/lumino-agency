'use client'

import { useRef, useState } from 'react'
import type { UploadImageResult } from './actions/images'

/**
 * Uploader immagini riutilizzabile (gallery: multi-foto; menu: 1 foto/piatto).
 * Drag&drop + click, anteprima, spinner, errori in italiano. Delega l'upload
 * alla server action passata via `action` (default: uploadSiteImage).
 */

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX = 8 * 1024 * 1024

interface Props {
  kind: 'gallery' | 'menu'
  refId?: string
  action: (fd: FormData) => Promise<UploadImageResult>
  onUploaded?: (r: UploadImageResult) => void
  /** URL immagine già presente (mostrata come anteprima iniziale). */
  initialUrl?: string
  /** Etichetta/hint sotto la zona di drop. */
  hint?: string
  /** Altezza della zona (menu = compatta). */
  compact?: boolean
  /** Dopo un upload riuscito svuota l'anteprima e torna allo stato iniziale
   *  (gallery: la foto va nella griglia, l'uploader resta pronto per la prossima). */
  resetAfterUpload?: boolean
}

export function ImageUploader({ kind, refId, action, onUploaded, initialUrl, hint, compact, resetAfterUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(initialUrl || null)

  async function handleFile(file: File | undefined | null) {
    if (!file) return
    setError(null)
    if (!ACCEPT.split(',').includes(file.type)) { setError('Formato non valido. Carica JPG, PNG o WebP.'); return }
    if (file.size > MAX) { setError(`Immagine troppo pesante (max 8MB). La tua è ${(file.size / 1024 / 1024).toFixed(1)}MB.`); return }

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setBusy(true)
    const fd = new FormData()
    fd.set('file', file)
    fd.set('kind', kind)
    if (refId) fd.set('refId', refId)
    const r = await action(fd)
    setBusy(false)
    URL.revokeObjectURL(localUrl)
    if (!r.ok) {
      setError(r.error || 'Errore durante il caricamento.')
      setPreview(initialUrl || null)
      return
    }
    // gallery: svuota e torna pronto; menu: mostra la foto caricata come slot.
    setPreview(resetAfterUpload ? null : (r.url || null))
    onUploaded?.(r)
  }

  const h = compact ? 120 : 200

  return (
    <div>
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]) }}
        style={{
          position: 'relative', minHeight: h, borderRadius: 14, cursor: busy ? 'default' : 'pointer',
          border: `1px dashed ${drag ? '#e52d1d' : 'rgba(255,255,255,0.18)'}`,
          background: drag ? 'rgba(229,45,29,0.06)' : 'rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" style={{ width: '100%', height: h, objectFit: 'cover', display: 'block', opacity: busy ? 0.5 : 1 }} />
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', padding: 16 }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>⬆️</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>Trascina qui un’immagine o clicca per sceglierla</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{hint || 'JPG, PNG o WebP · max 8MB'}</div>
          </div>
        )}

        {busy && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,5,5,0.45)' }}>
            <span className="iu-spin" style={{ width: 26, height: 26, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', display: 'inline-block' }} />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={e => { handleFile(e.target.files?.[0]); e.target.value = '' }}
      />

      {error && (
        <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 600, color: '#f87171' }}>{error}</p>
      )}

      <style>{`@keyframes iu-spin { to { transform: rotate(360deg) } } .iu-spin { animation: iu-spin 0.7s linear infinite; }`}</style>
    </div>
  )
}
