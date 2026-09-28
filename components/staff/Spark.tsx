/**
 * Il grafico piccolo dentro una card KPI (ref3).
 *
 * Esiste per una regola sola di questo design: **una card non è una card se
 * contiene solo un numero.** Un «12» grande in un rettangolo bianco non dice
 * se dodici è tanto o poco, e quattro rettangoli così in fila sono la firma di
 * un pannello generato. La stessa card con sotto otto settimane di andamento
 * risponde alla seconda domanda prima ancora che venga fatta.
 *
 * Due forme, stessa altezza: la linea per ciò che scorre (incassi, chiusure),
 * le barre per ciò che si conta a blocchi (clienti per stato per settimana).
 * L'ultima barra è viola perché è la settimana in corso — l'unica che può
 * ancora cambiare.
 */
export default function Spark({
  serie,
  tipo = 'barre',
  label,
}: {
  serie: number[]
  tipo?: 'barre' | 'linea'
  label: string
}) {
  if (serie.length < 2) return null

  const W = 100
  const H = 30
  const max = Math.max(1, ...serie)

  if (tipo === 'linea') {
    const passo = W / (serie.length - 1)
    const d = serie
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * passo} ${H - (v / max) * H}`)
      .join(' ')
    return (
      <svg
        className="lm-spark"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        <path d={d} vectorEffect="non-scaling-stroke" />
      </svg>
    )
  }

  const larghezza = W / (serie.length * 1.6)
  const passo = W / serie.length

  return (
    <svg
      className="lm-spark"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      {serie.map((v, i) => {
        /* Un valore a zero resta un trattino visibile: una colonna che sparisce
           fa perdere il conto delle posizioni. */
        const h = Math.max(1.5, (v / max) * H)
        return (
          <rect
            key={i}
            x={i * passo}
            y={H - h}
            width={larghezza}
            height={h}
            rx="1"
            data-last={i === serie.length - 1}
          />
        )
      })}
    </svg>
  )
}
