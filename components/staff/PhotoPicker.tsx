'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { caricaFoto, eliminaFoto } from '@/lib/staff/actions'

export interface FotoScattata {
  /** Il percorso dentro il bucket: è questo che finisce nel report. */
  path: string
  /** L'anteprima locale, per non riscaricare quello che si è appena inviato. */
  preview: string
}

/** Il lato lungo massimo: oltre, per una vetrina, non si vede niente in più. */
const LATO_MAX = 1600
const QUALITA = 0.72

/**
 * Le foto della visita.
 *
 * `capture="environment"` apre direttamente la fotocamera posteriore sul
 * telefono, che è dove si usa; su desktop resta un normale selettore di file.
 *
 * Il ridimensionamento lo fa il browser prima di inviare: una foto da 4MB
 * diventa qualche centinaio di KB. Serve due volte — allo Storage gratuito e
 * al giga di chi sta caricando dalla strada, che è anche il motivo per cui il
 * caricamento parte subito e non alla fine: quando si preme «Salva visita» le
 * foto sono già arrivate, e il salvataggio è istantaneo.
 *
 * Il prezzo di quella scelta è la foto orfana di chi carica e poi ci ripensa:
 * per questo togliere una foto la cancella davvero dal bucket, non solo da
 * questa lista.
 */
export default function PhotoPicker({
  clientId,
  foto,
  onChange,
}: {
  /** Vuoto finché non si è scelto il cliente: senza, non si sa dove metterle. */
  clientId: string
  foto: FotoScattata[]
  onChange: (foto: FotoScattata[]) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  /* Le anteprime sono blob: il browser le tiene in memoria finché non gli si
     dice di lasciarle andare, e in una giornata di visite si sommano.
     La pulizia legge un ref e non la prop: la funzione di smontaggio si scrive
     una volta sola, e catturando `foto` libererebbe la lista com'era al primo
     render — cioè vuota, cioè niente. */
  const correnti = useRef(foto)
  useEffect(() => {
    correnti.current = foto
  })
  useEffect(() => {
    return () => {
      correnti.current.forEach((f) => URL.revokeObjectURL(f.preview))
    }
  }, [])

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length || !clientId) return

    setBusy(true)
    setErrore(null)
    const nuove: FotoScattata[] = []

    for (const file of files.slice(0, 6)) {
      try {
        const ridotta = await riduci(file)
        const form = new FormData()
        form.append('file', ridotta, 'visita.jpg')

        const esito = await caricaFoto(clientId, form)
        if (!esito.ok || !esito.path) {
          setErrore(esito.error ?? 'Foto non caricata.')
          continue
        }
        nuove.push({ path: esito.path, preview: URL.createObjectURL(ridotta) })
      } catch {
        setErrore('Questa foto non si è aperta. Riprova con un’altra.')
      }
    }

    if (nuove.length) onChange([...foto, ...nuove])
    setBusy(false)
  }

  async function togli(f: FotoScattata) {
    onChange(foto.filter((x) => x.path !== f.path))
    URL.revokeObjectURL(f.preview)
    await eliminaFoto(clientId, f.path)
  }

  return (
    <div className="lm-field">
      <span className="lm-label">Foto</span>

      <div className="lm-shots">
        {foto.map((f) => (
          <span key={f.path} className="lm-shot">
            {/* Un blob locale: next/image non lo ottimizzerebbe comunque, e
                dargli una dimensione nota qui è impossibile. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.preview} alt="Foto scattata durante la visita" />
            <button
              type="button"
              className="lm-shot-x"
              onClick={() => togli(f)}
              aria-label="Togli questa foto"
            >
              <X aria-hidden="true" />
            </button>
          </span>
        ))}

        <button
          type="button"
          className="lm-shot-add"
          onClick={() => input.current?.click()}
          disabled={!clientId || busy || foto.length >= 6}
        >
          <Camera aria-hidden="true" />
          {busy ? 'Carico…' : 'Scatta'}
        </button>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        className="lm-sr"
        onChange={onFile}
      />

      <p className="lm-field-hint">
        {errore ??
          (clientId
            ? 'La vetrina, il menù esposto, l’insegna. Massimo sei, rimpicciolite prima di partire.'
            : 'Scegli prima il cliente: le foto si archiviano sotto di lui.')}
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * La foto rimpicciolita, in JPEG.
 *
 * `createImageBitmap` invece di un <img> con onload: è più veloce, non tocca
 * il DOM e sui telefoni recenti decodifica fuori dal thread principale —
 * cioè l'interfaccia non si blocca mentre si carica.
 *
 * Sempre JPEG in uscita, anche partendo da PNG: una foto non ha trasparenza
 * da difendere, e un PNG di una vetrina pesa il triplo.
 */
async function riduci(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scala = Math.min(1, LATO_MAX / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scala)
  const h = Math.round(bitmap.height * scala)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas non disponibile')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITA),
  )
  if (!blob) throw new Error('conversione fallita')
  return blob
}
