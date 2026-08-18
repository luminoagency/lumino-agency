import { BLOBS } from './heroMotion'

/**
 * Blob liquidi nel fondo dell'hero.
 *
 * Cinque cerchi dentro un contenitore con filtro SVG "gooey": sfocatura forte,
 * poi feColorMatrix che alza il contrasto del solo canale alpha. Il risultato è
 * che due cerchi vicini si saldano in una massa sola con un raccordo morbido, e
 * si staccano quando si allontanano — come mercurio.
 *
 * I cerchi sono a piena opacità: è il CONTENITORE a essere trasparente. Se
 * fossero trasparenti loro, l'alpha in ingresso sarebbe troppo bassa perché il
 * feColorMatrix abbia qualcosa da irrigidire, e la fusione non si vedrebbe.
 *
 * Colori molto desaturati e opacità bassa: devono leggersi come luce liquida
 * nel fondo, non come palle colorate sopra il testo.
 */

const TINTS = [
  'rgba(107, 31, 42, 0.9)', // bordeaux
  'rgba(139, 92, 246, 0.75)', // violet
  'rgba(59, 79, 196, 0.7)', // blue
  'rgba(107, 31, 42, 0.7)',
  'rgba(90, 70, 150, 0.65)',
]

export default function HeroBlobs() {
  return (
    <div className="lm-blobs" aria-hidden="true">
      <svg className="lm-goo-defs" width="0" height="0" focusable="false" aria-hidden="true">
        <defs>
          <filter id="lm-goo" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="26" result="blurred" />
            {/* L'ultima riga è l'alpha: moltiplicata e ribassata, i bordi
                sfumati tornano netti e le masse vicine si fondono. */}
            <feColorMatrix
              in="blurred"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 26 -12"
              result="goo"
            />
            {/* Una seconda sfocatura leggera toglie il bordo di plastica e la
                riporta a essere luce. */}
            <feGaussianBlur in="goo" stdDeviation="14" />
          </filter>
        </defs>
      </svg>

      <div className="lm-blobs-stage">
        {BLOBS.map((blob, i) => (
          <span
            className="lm-blob"
            key={i}
            style={{
              left: `${blob.x}%`,
              top: `${blob.y}%`,
              width: `${blob.size}%`,
              background: TINTS[i],
            }}
          />
        ))}
      </div>
    </div>
  )
}
