export interface PuntoZona {
  nome: string
  lat: number
  lng: number
  n: number
}

/* La finestra geografica del territorio in cui si vende: dal Polesine al
   Friuli, dalla pedemontana al mare. */
const LAT = [44.95, 46.3] as const
const LNG = [10.85, 13.55] as const
const W = 420
const H = 240

/**
 * Dove si è stati (ref1, la mappa del mondo coi punti).
 *
 * **Non è una mappa geografica ed è meglio che non finga di esserlo.** È un
 * piano cartesiano su cui i clienti cadono secondo latitudine e longitudine,
 * con una diagonale a segnare il mare — che sulla costa veneta corre davvero
 * da nordest a sudovest. Serve a rispondere a una domanda sola: «sto girando
 * sempre nelle stesse tre vie o sto coprendo il territorio?».
 *
 * Una mappa vera vorrebbe Leaflet, un tile server e una connessione: tre cose
 * che costano, per una risposta che questa dà in 40 righe. Leaflet resta nel
 * piano per la fase 4, dove la mappa serve navigabile.
 *
 * I punti crescono con il numero di clienti, ma con la **radice quadrata**:
 * l'occhio confronta le aree, e raddoppiare il raggio quadruplicherebbe la
 * macchia facendo sembrare quattro clienti dove ce ne sono due.
 */
export default function Mappa({ punti }: { punti: PuntoZona[] }) {
  const max = Math.max(1, ...punti.map((p) => p.n))

  const proietta = (lat: number, lng: number) => ({
    x: ((lng - LNG[0]) / (LNG[1] - LNG[0])) * W,
    /* La latitudine cresce verso nord, la y dell'SVG verso il basso. */
    y: H - ((lat - LAT[0]) / (LAT[1] - LAT[0])) * H,
  })

  return (
    <div className="lm-map">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Zone coperte: ${punti.map((p) => `${p.nome} ${p.n}`).join(', ')}`}
      >
        {/* La terra: tutto tranne il cuneo di mare in basso a destra. La
            diagonale è la costa adriatica, che da Chioggia a Grado corre
            davvero da sudovest a nordest. */}
        <path
          className="lm-map-land"
          d={`M 0 0 L ${W} 0 L ${W} ${H * 0.52} L ${W * 0.74} ${H} L 0 ${H} Z`}
        />

        {punti.map((p) => {
          const { x, y } = proietta(p.lat, p.lng)
          const r = 3 + Math.sqrt(p.n / max) * 7
          return (
            <g key={p.nome}>
              <circle className="lm-map-halo" cx={x} cy={y} r={r * 2.1} />
              <circle className="lm-map-dot" cx={x} cy={y} r={r} />
              <text className="lm-map-cap" x={x + r + 4} y={y + 3}>
                {p.nome} · {p.n}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
