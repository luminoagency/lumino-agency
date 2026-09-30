'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Trash2 } from 'lucide-react'
import { caricaAvatar, togliAvatar } from '@/lib/staff/actions'
import { iniziali } from '@/lib/staff/avatar'
import Ritaglio from './Ritaglio'

/**
 * La foto profilo: si sceglie, si inquadra, si salva.
 *
 * L'inquadratura sta in `Ritaglio`, che la condivide con «Nuovo membro»: qui
 * restano la scelta del file, il salvataggio e il caso «ce n'è già una». Il
 * perché del ritaglio vero e del taglio a 512px nel browser è scritto lì.
 */
export default function AvatarUpload({
  nome,
  foto,
  haFoto,
}: {
  nome: string
  /** L'URL firmato di quella attuale, se c'è. */
  foto: string | null
  /** Se esiste una foto salvata: serve a decidere se mostrare «Togli». */
  haFoto: boolean
}) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)

  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [busy, setBusy] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  /* Un bitmap è memoria vera, non un oggetto JS: senza `close()` resta allocato
     finché non passa il garbage collector, e chi prova sei foto di fila ne tiene
     sei decodificate in RAM. */
  useEffect(() => {
    return () => bitmap?.close()
  }, [bitmap])

  async function scegli(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setErrore(null)

    try {
      setBitmap(await createImageBitmap(file))
    } catch {
      setErrore('Questa immagine non si è aperta. Provane un’altra.')
    }
  }

  async function salva(blob: Blob) {
    setBusy(true)
    setErrore(null)

    const form = new FormData()
    form.append('file', blob, 'avatar.jpg')
    const esito = await caricaAvatar(form)

    if (!esito.ok) {
      setErrore(esito.error ?? 'Foto non salvata.')
      setBusy(false)
      return
    }

    setBitmap(null)
    setBusy(false)
    router.refresh()
  }

  async function togli() {
    setBusy(true)
    const esito = await togliAvatar()
    setBusy(false)
    if (!esito.ok) return setErrore(esito.error ?? 'Non si è riuscito a togliere la foto.')
    router.refresh()
  }

  return (
    <div className="lm-avatar-edit">
      {bitmap ? (
        <Ritaglio
          bitmap={bitmap}
          busy={busy}
          etichetta="Salva la foto"
          onConferma={salva}
          onAnnulla={() => setBitmap(null)}
        />
      ) : (
        <>
          <span className="lm-avatar" data-size="lg" data-foto={Boolean(foto)}>
            {foto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={foto} alt={`Foto di ${nome}`} />
            ) : (
              <span aria-hidden="true">{iniziali(nome)}</span>
            )}
          </span>

          <div className="lm-crop-azioni">
            <button
              type="button"
              className="lm-btn"
              data-variant="dark"
              onClick={() => input.current?.click()}
            >
              <Camera aria-hidden="true" />
              {haFoto ? 'Cambia foto' : 'Carica una foto'}
            </button>
            {haFoto && (
              <button
                type="button"
                className="lm-btn"
                data-variant="ghost"
                disabled={busy}
                onClick={togli}
              >
                <Trash2 aria-hidden="true" />
                Togli
              </button>
            )}
          </div>
        </>
      )}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="lm-sr"
        onChange={scegli}
      />

      {errore && (
        <p className="lm-field-hint" data-errore="true">
          {errore}
        </p>
      )}
    </div>
  )
}
