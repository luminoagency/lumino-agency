/**
 * Wordmark "Lumıno".
 *
 * La i è U+0131 — i SENZA puntino. Il puntino non è tipografico: è una luce
 * calda disegnata in CSS (.lm-il::after) che all'hover si stacca e sale.
 * Per questo ogni lettera è un <b> separato.
 *
 * Il nome resta leggibile per gli screen reader grazie all'aria-label di chi
 * lo contiene, quindi qui le lettere sono decorative.
 */
export default function Wordmark() {
  return (
    <span className="lm-wm" aria-hidden="true">
      <b>L</b>
      <b>u</b>
      <b>m</b>
      <b className="lm-il">
        <span>{'ı'}</span>
      </b>
      <b>n</b>
      <b>o</b>
    </span>
  )
}
