import PageHead from '@/components/staff/PageHead'

/**
 * La pagina di una sezione non ancora costruita.
 *
 * Esiste perché il menù è completo dal primo giorno: una voce che porta a un
 * 404 fa dubitare del resto, e una voce che non c'è fa credere che la sezione
 * non sia prevista. Qui invece si legge cosa ci sarà e quando.
 *
 * Il filo di gradiente che si allunga è tutto il "lavori in corso" che serve:
 * niente badge, niente cartello.
 */
export default function Soon({
  titolo,
  testo,
  fase,
}: {
  titolo: string
  testo: string
  fase: 2 | 3 | 4 | 5
}) {
  return (
    <div className="lm-soon-page">
      <PageHead title={titolo} sub={testo} />
      <div className="lm-thread" aria-hidden="true" />
      <p className="lm-sub" style={{ marginTop: '1rem', fontSize: '0.78rem' }}>
        In costruzione: arriva nella fase {fase} del piano.
      </p>
    </div>
  )
}
