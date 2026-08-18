import Link from 'next/link'

/**
 * Nav fissa della home: wordmark a sinistra, pulsante menu a destra.
 *
 * Il wordmark è "Lumıno" con la i SENZA puntino (U+0131): il puntino è una
 * luce calda posizionata sopra, che nel Blocco 4 si stacca all'hover.
 * `mix-blend-mode: difference` sulla nav tiene il wordmark leggibile sia
 * sulle sezioni scure sia su quelle a fondo chiaro, senza doverlo ricolorare.
 *
 * Blocco 3: statico. Menu overlay, rotazione dei punti e anteprime nel Blocco 4.
 */
export default function Nav() {
  return (
    <nav className="lm-nav">
      <Link href="/" className="lm-wordmark" aria-label="Lumino — home">
        <span aria-hidden="true">{'Lumıno'}</span>
        <span className="lm-wordmark-spark" aria-hidden="true" />
      </Link>

      <button type="button" className="lm-menu-btn" aria-label="Apri il menu" aria-expanded="false">
        <span className="lm-menu-dot" />
        <span className="lm-menu-dot" />
        <span className="lm-menu-dot" />
        <span className="lm-menu-dot" />
      </button>
    </nav>
  )
}
