'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Check, Trash2, ZoomIn } from 'lucide-react'
import { caricaAvatar, togliAvatar } from '@/lib/staff/actions'
import { iniziali } from '@/lib/staff/avatar'

/** Il lato del file salvato: una faccia in un cerchio da 96px non chiede di più. */
const LATO = 512
const QUALITA = 0.84
/** Il lato dell'anteprima su schermo. Le posizioni sono normalizzate, non in px. */
const ANTEPRIMA = 240

/**
 * La foto profilo: si scegle, si inquadra, si salva.
 *
 * **Il ritaglio è vero, non un `object-fit: cover`.** Sembrerebbe la scorciatoia
 * giusta — il cerchio taglia da sé — ma il taglio automatico prende il centro
 * geometrico dell'immagine, e in una foto di una persona il centro geometrico è
 * quasi sempre il petto. Il risultato è una galleria di avatar decapitati, che è
 * esattamente il difetto che rende un'area interna un prototipo. Qui si trascina
 * e si stringe, e quello che si vede nel cerchio è quello che viene salvato.
 *
 * **Il file parte già quadrato e già a 512px**: il canvas fa il taglio nel
 * browser, quindi allo Storage gratuito arrivano circa quaranta kilobyte invece
 * dei tre mega di una foto di telefono, e non c'è nessun ridimensionamento da
 * fare sul server. È la stessa scelta di `PhotoPicker`, per le stesse ragioni.
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
  const canvas = useRef<HTMLCanvasElement>(null)
  const bitmap = useRef<ImageBitmap | null>(null)

  const [inquadra, setInquadra] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [off, setOff] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const trascino = useRef<{ x: number; y: number } | null>(null)

  /* Un bitmap è memoria vera, non un oggetto JS: senza `close()` resta allocato
     finché non passa il garbage collector, e chi prova sei foto di fila ne tiene
     sei decodificate in RAM. */
  useEffect(() => {
    return () => {
      bitmap.current?.close()
      bitmap.current = null
    }
  }, [])

  /** Disegna l'inquadratura corrente su un canvas di lato `S`. */
  const disegna = useCallback(
    (ctx: CanvasRenderingContext2D, S: number, z: number, o: { x: number; y: number }) => {
      const bm = bitmap.current
      if (!bm) return
      const base = S / Math.min(bm.width, bm.height)
      const eff = base * z
      const dw = bm.width * eff
      const dh = bm.height * eff
      ctx.clearRect(0, 0, S, S)
      ctx.drawImage(bm, (S - dw) / 2 + o.x * S, (S - dh) / 2 + o.y * S, dw, dh)
    },
    [],
  )

  /** Lo scostamento massimo prima che si veda il vuoto agli angoli. */
  const limite = useCallback((z: number) => {
    const bm = bitmap.current
    if (!bm) return { x: 0, y: 0 }
    const base = 1 / Math.min(bm.width, bm.height)
    const w = bm.width * base * z
    const h = bm.height * base * z
    return { x: Math.max(0, (w - 1) / 2), y: Math.max(0, (h - 1) / 2) }
  }, [])

  const ridisegna = useCallback(
    (z: number, o: { x: number; y: number }) => {
      const ctx = canvas.current?.getContext('2d')
      if (ctx) disegna(ctx, ANTEPRIMA, z, o)
    },
    [disegna],
  )

  useEffect(() => {
    if (inquadra) ridisegna(zoom, off)
  }, [inquadra, zoom, off, ridisegna])

  async function scegli(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setErrore(null)

    try {
      bitmap.current?.close()
      bitmap.current = await createImageBitmap(file)
      setZoom(1)
      setOff({ x: 0, y: 0 })
      setInquadra(true)
    } catch {
      setErrore('Questa immagine non si è aperta. Provane un’altra.')
    }
  }

  function muovi(e: React.PointerEvent) {
    if (!trascino.current) return
    const dx = (e.clientX - trascino.current.x) / ANTEPRIMA
    const dy = (e.clientY - trascino.current.y) / ANTEPRIMA
    trascino.current = { x: e.clientX, y: e.clientY }
    const max = limite(zoom)
    setOff((o) => ({
      x: Math.max(-max.x, Math.min(max.x, o.x + dx)),
      y: Math.max(-max.y, Math.min(max.y, o.y + dy)),
    }))
  }

  function cambiaZoom(z: number) {
    /* Stringendo, uno scostamento che prima era lecito può non esserlo più: se
       non lo si riporta dentro i limiti, l'immagine si stacca da un bordo e nel
       cerchio compare un angolo trasparente. */
    const max = limite(z)
    setOff((o) => ({
      x: Math.max(-max.x, Math.min(max.x, o.x)),
      y: Math.max(-max.y, Math.min(max.y, o.y)),
    }))
    setZoom(z)
  }

  async function salva() {
    const bm = bitmap.current
    if (!bm) return
    setBusy(true)
    setErrore(null)

    try {
      const out = document.createElement('canvas')
      out.width = LATO
      out.height = LATO
      const ctx = out.getContext('2d')
      if (!ctx) throw new Error('canvas non disponibile')
      /* Su un ingrandimento forte la qualità alta del ricampionamento si vede:
         è l'unico posto di quest'area dove un pixel sfocato finisce in faccia a
         qualcuno. */
      ctx.imageSmoothingQuality = 'high'
      disegna(ctx, LATO, zoom, off)

      const blob = await new Promise<Blob | null>((ok) => out.toBlob(ok, 'image/jpeg', QUALITA))
      if (!blob) throw new Error('conversione fallita')

      const form = new FormData()
      form.append('file', blob, 'avatar.jpg')
      const esito = await caricaAvatar(form)

      if (!esito.ok) {
        setErrore(esito.error ?? 'Foto non salvata.')
        setBusy(false)
        return
      }

      bitmap.current?.close()
      bitmap.current = null
      setInquadra(false)
      setBusy(false)
      router.refresh()
    } catch {
      setErrore('Non si è riuscito a preparare l’immagine.')
      setBusy(false)
    }
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
      {inquadra ? (
        <>
          <div
            className="lm-crop"
            onPointerDown={(e) => {
              trascino.current = { x: e.clientX, y: e.clientY }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={muovi}
            onPointerUp={(e) => {
              trascino.current = null
              e.currentTarget.releasePointerCapture(e.pointerId)
            }}
            onPointerCancel={() => {
              trascino.current = null
            }}
          >
            <canvas ref={canvas} width={ANTEPRIMA} height={ANTEPRIMA} />
            {/* La maschera è un anello, non un cerchio pieno: si vede cosa resta
                fuori dal taglio, ed è l'unico modo di capire dove si sta
                trascinando. */}
            <span className="lm-crop-mask" aria-hidden="true" />
          </div>

          <label className="lm-crop-zoom">
            <ZoomIn aria-hidden="true" />
            <span className="lm-sr">Ingrandimento</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => cambiaZoom(Number(e.target.value))}
            />
          </label>

          <p className="lm-field-hint">Trascina per inquadrare. Quel che vedi è quel che resta.</p>

          <div className="lm-crop-azioni">
            <button type="button" className="lm-btn" data-variant="dark" disabled={busy} onClick={salva}>
              <Check aria-hidden="true" />
              {busy ? 'Salvo…' : 'Salva la foto'}
            </button>
            <button
              type="button"
              className="lm-btn"
              data-variant="ghost"
              disabled={busy}
              onClick={() => {
                bitmap.current?.close()
                bitmap.current = null
                setInquadra(false)
              }}
            >
              Annulla
            </button>
          </div>
        </>
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
              <button type="button" className="lm-btn" data-variant="ghost" disabled={busy} onClick={togli}>
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

      {errore && <p className="lm-field-hint" data-errore="true">{errore}</p>}
    </div>
  )
}
