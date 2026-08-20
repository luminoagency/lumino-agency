/**
 * Wordmark LUMINO.
 *
 * Lo stesso carattere display del wordmark gigante dell'hero, in maiuscolo e
 * stretto. Prima era un serif generico con un puntino luminoso che fluttuava
 * sopra una "ı" senza puntino: due marchi diversi nella stessa schermata, e
 * quello piccolo sembrava di un'altra epoca.
 *
 * La firma è la I nel gradiente rosso→rosa→viola, la stessa dell'hero. Il
 * punto luminoso non è stato spostato: è stato tolto, perché quella luce ora
 * ce l'ha la I.
 *
 * UN SOLO componente per tutti i posti in cui il marchio compare — nav, menu,
 * footer, preloader. Misura e colore li decide il contenitore con `--wm-size`
 * e `color`, non una copia del markup: due copie divergono al primo ritocco.
 *
 * Le lettere sono decorative: il nome per gli screen reader lo porta
 * l'aria-label di chi contiene il wordmark.
 */

const LETTERS = ['L', 'U', 'M', 'I', 'N', 'O'] as const

export default function Wordmark({
  /** false dove l'ingresso a lettere lo governa il contenitore (il preloader). */
  animated = true,
}: {
  animated?: boolean
}) {
  return (
    <span className={`lm-wm${animated ? '' : ' is-static'}`} aria-hidden="true">
      {LETTERS.map((letter, i) => (
        <b
          key={letter}
          className={letter === 'I' ? 'lm-wm-i' : undefined}
          /* L'indice serve al ritardo: entrata a lettere e bagliore che
             attraversa da sinistra a destra sono lo stesso scaglionamento. */
          style={{ ['--i' as string]: i }}
        >
          {letter}
        </b>
      ))}
    </span>
  )
}
