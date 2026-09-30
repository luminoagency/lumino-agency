'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ZoomIn } from 'lucide-react'

/** Il lato del file salvato: una faccia in un cerchio da 96px non chiede di più. */
export const LATO_AVATAR = 512
const QUALITA = 0.84
/** Il lato dell'anteprima su schermo. Le posizioni sono normalizzate, non in px. */
const ANTEPRIMA = 240

/**
 * L'inquadratura quadrata, per chiunque debba scegliere una foto profilo.
 *
 * **Il ritaglio è vero, non un `object-fit: cover`.** Sembrerebbe la
 * scorciatoia giusta — il cerchio taglia da sé — ma il taglio automatico prende
 * il centro geometrico dell'immagine, e in una foto di una persona il centro
 * geometrico è quasi sempre il petto. Il risultato è una galleria di avatar
 * decapitati, che è esattamente il difetto che rende un'area interna un
 * prototipo. Qui si trascina e si stringe, e quello che si vede nel cerchio è
 * quello che viene salvato.
 *
 * **Il blob esce già quadrato e già a 512px**: il canvas fa il taglio nel
 * browser, quindi allo Storage gratuito arrivano circa quaranta kilobyte invece
 * dei tre mega di una foto di telefono, e non c'è nessun ridimensionamento da
 * fare sul server. È la stessa scelta di `PhotoPicker`, per le stesse ragioni.
 *
 * Sta in un componente suo perché la stessa inquadratura serve in due posti con
 * destinazioni diverse: `AvatarUpload` la manda subito a una server action per
 * la propria riga, «Nuovo membro» la tiene da parte e la invia insieme al resto
 * del modulo. Duplicarla avrebbe voluto dire due matematiche del trascinamento
 * da tenere allineate.
 */
export default function Ritaglio({
  bitmap,
  busy,
  etichetta,
  onConferma,
  onAnnulla,
}: {
  bitmap: ImageBitmap
  busy?: boolean
  /** Cosa c'è scritto sul bottone che conferma: cambia col posto da cui si arriva. */
  etichetta: string
  onConferma: (blob: Blob) => void
  onAnnulla: () => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [off, setOff] = useState({ x: 0, y: 0 })
  const trascino = useRef<{ x: number; y: number } | null>(null)

  /** Disegna l'inquadratura corrente su un canvas di lato `S`. */
  const disegna = useCallback(
    (ctx: CanvasRenderingContext2D, S: number, z: number, o: { x: number; y: number }) => {
      const base = S / Math.min(bitmap.width, bitmap.height)
      const eff = base * z
      const dw = bitmap.width * eff
      const dh = bitmap.height * eff
      ctx.clearRect(0, 0, S, S)
      ctx.drawImage(bitmap, (S - dw) / 2 + o.x * S, (S - dh) / 2 + o.y * S, dw, dh)
    },
    [bitmap],
  )

  /** Lo scostamento massimo prima che si veda il vuoto agli angoli. */
  const limite = useCallback(
    (z: number) => {
      const base = 1 / Math.min(bitmap.width, bitmap.height)
      const w = bitmap.width * base * z
      const h = bitmap.height * base * z
      return { x: Math.max(0, (w - 1) / 2), y: Math.max(0, (h - 1) / 2) }
    },
    [bitmap],
  )

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (ctx) disegna(ctx, ANTEPRIMA, zoom, off)
  }, [zoom, off, disegna])

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

  async function conferma() {
    const out = document.createElement('canvas')
    out.width = LATO_AVATAR
    out.height = LATO_AVATAR
    const ctx = out.getContext('2d')
    if (!ctx) return
    /* Su un ingrandimento forte la qualità alta del ricampionamento si vede: è
       l'unico posto di quest'area dove un pixel sfocato finisce in faccia a
       qualcuno. */
    ctx.imageSmoothingQuality = 'high'
    disegna(ctx, LATO_AVATAR, zoom, off)

    const blob = await new Promise<Blob | null>((ok) => out.toBlob(ok, 'image/jpeg', QUALITA))
    if (blob) onConferma(blob)
  }

  return (
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
        <button
          type="button"
          className="lm-btn"
          data-variant="dark"
          disabled={busy}
          onClick={conferma}
        >
          <Check aria-hidden="true" />
          {busy ? 'Salvo…' : etichetta}
        </button>
        <button
          type="button"
          className="lm-btn"
          data-variant="ghost"
          disabled={busy}
          onClick={onAnnulla}
        >
          Annulla
        </button>
      </div>
    </>
  )
}
