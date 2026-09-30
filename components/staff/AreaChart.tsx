'use client'

import { useId, useRef, useState } from 'react'

export interface AreaPoint {
  label: string
  value: number
}

const W = 600
const H = 170
const PAD = 10

/**
 * Area chart con linea morbida, tooltip e punto luminoso (ref3).
 *
 * Il viewBox è fisso e l'SVG scala in modo uniforme (`width: 100%; height:
 * auto`): così il punto resta un cerchio invece di diventare un'ellisse, che è
 * quello che succede appena si usa `preserveAspectRatio="none"` per riempire
 * un contenitore.
 *
 * La curva è una Catmull-Rom convertita in Bézier cubiche: passa *per* i punti
 * — un dato deve stare dove è scritto — ma senza gli spigoli di una polilinea.
 * La tensione è bassa apposta: alzandola la curva scavalca i massimi e mostra
 * valori che non esistono.
 */
export default function AreaChart({
  points,
  format = 'int',
}: {
  points: AreaPoint[]
  format?: 'int' | 'euro'
}) {
  const gradId = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  if (points.length < 2) {
    return <p className="lm-empty">Non ci sono ancora abbastanza dati per un andamento.</p>
  }

  const max = Math.max(1, ...points.map((p) => p.value))
  const step = (W - PAD * 2) / (points.length - 1)
  const xy = points.map((p, i) => ({
    x: PAD + i * step,
    y: H - PAD - (p.value / max) * (H - PAD * 2),
  }))

  const line = smoothPath(xy)
  const area = `${line} L ${xy[xy.length - 1].x} ${H} L ${xy[0].x} ${H} Z`
  const active = hover ?? points.length - 1

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = (event.clientX - rect.left) / rect.width
    const i = Math.round(ratio * (points.length - 1))
    setHover(Math.max(0, Math.min(points.length - 1, i)))
  }

  return (
    <div className="lm-area">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={points.map((p) => `${p.label}: ${p.value}`).join(', ')}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#17130f" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#17130f" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={area} fill={`url(#${gradId})`} />
        <path className="lm-area-line" d={line} />

        <line className="lm-area-rule" x1={xy[active].x} y1={PAD} x2={xy[active].x} y2={H} />
        <circle className="lm-area-dot" cx={xy[active].x} cy={xy[active].y} r="4.5" />
        {/* L'alone del punto attivo. `currentColor` e non il viola scritto a
            mano: così segue `--violet` come tutto il resto, e il giorno che il
            viola cambia non resta indietro un cerchio di dieci pixel dentro un
            SVG. Il colore glielo passa la classe qui sotto, in staff.css. */}
        <circle className="lm-area-alone" cx={xy[active].x} cy={xy[active].y} r="10" />

        {/* Una fascia trasparente sopra tutto: rende l'intero riquadro
            sensibile al puntatore, anche dove la curva non passa. */}
        <rect className="lm-area-hit" x="0" y="0" width={W} height={H} />
      </svg>

      {/* Il cartellino resta **dentro** il riquadro.
          Prima era centrato sul punto e alzato del 125% della propria altezza,
          il che va bene finché il punto sta in mezzo: sul massimo dell'ultimo
          mese — cioè esattamente il caso che si guarda più spesso — usciva in
          alto e a destra dalla card e veniva tagliato dal bordo.

          Due correzioni, entrambe fatte qui e non nel CSS perché dipendono da
          dove sta il punto: `data-lato` lo àncora al bordo invece di centrarlo
          quando è nel primo o nell'ultimo sesto, e `data-sotto` lo ribalta sotto
          la curva quando il punto è troppo in alto per averci spazio sopra. */}
      <span
        className="lm-area-tip"
        data-lato={latoDelTip(xy[active].x)}
        data-sotto={xy[active].y < H * 0.34 ? 'true' : undefined}
        style={{ left: `${(xy[active].x / W) * 100}%`, top: `${(xy[active].y / H) * 100}%` }}
      >
        {points[active].label} · <b>{fmt(points[active].value, format)}</b>
      </span>

      <div className="lm-area-x" aria-hidden="true">
        {points.map((p, i) =>
          i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2) ? (
            <span key={p.label}>{p.label}</span>
          ) : null,
        )}
      </div>
    </div>
  )
}

/**
 * Da che parte deve stare il cartellino.
 *
 * Nel primo sesto del grafico si appoggia a sinistra, nell'ultimo a destra, in
 * mezzo si centra: è il modo più semplice di non farlo uscire, e non richiede di
 * misurare la sua larghezza — che al primo render non si conosce ancora.
 */
function latoDelTip(x: number): 'sx' | 'dx' | undefined {
  if (x < W / 6) return 'sx'
  if (x > W - W / 6) return 'dx'
  return undefined
}

/** Catmull-Rom → Bézier cubiche, tensione 1/6. */
function smoothPath(pts: { x: number; y: number }[]): string {
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function fmt(value: number, format: 'int' | 'euro'): string {
  if (format === 'euro') {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  }
  return new Intl.NumberFormat('it-IT').format(value)
}
