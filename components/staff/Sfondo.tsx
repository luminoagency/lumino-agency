/**
 * La stanza dietro il vetro.
 *
 * ## Cosa deve essere
 *
 * Ref1 non ha uno sfondo astratto: ha una **stanza d'angolo con due vetrate a
 * tutta altezza**, luce di giorno che entra da fuori, un pavimento chiaro con
 * una pozza di luce, e il pannello che ci galleggia davanti proiettando
 * un'ombra lunga. Quello che conta non sono i colori, è che ci sia un **sopra e
 * un sotto**: un soffitto, una linea dove il muro finisce e comincia il
 * pavimento, e la luce che arriva da una parte precisa.
 *
 * Prima qui c'erano quattro macchie di colore che si muovevano. Il difetto non
 * era il gusto: quattro cerchi sfumati non hanno un orizzonte, quindi non hanno
 * profondità, quindi il pannello non galleggiava su niente — stava appoggiato
 * su una texture. Da lì l'impressione di chiuso e piatto.
 *
 * ## Perché non una fotografia
 *
 * Una foto di un interno luminoso, sfocata e compressa, sarebbe la strada più
 * corta al risultato. Costa però 150-250 KB da scaricare al primo accesso di
 * ogni persona, un file in più da tenere aggiornato, e una licenza da ricordare
 * fra due anni. Qui sotto non c'è **nessun byte**: sono gradienti, e fanno
 * quello che serve — le vetrate, i montanti, il taglio di luce sul pavimento,
 * l'ombra del mobile nell'angolo.
 *
 * ## Il movimento
 *
 * Solo `transform` e `opacity`, come prima e per la stessa ragione: ogni
 * livello diventa una texture sulla GPU una volta sola e poi viene spostato.
 * Un `filter: blur()` animato o un gradiente che cambia colore obbligherebbero
 * a rasterizzare di nuovo mezzo schermo a ogni fotogramma. Le durate (54s, 67s,
 * 83s, 97s, 113s) non hanno divisori in comune: la composizione non torna mai
 * identica.
 *
 * ## La leggibilità viene prima
 *
 * Una stanza più luminosa rischia di mangiarsi il pannello, che è bianco al 50%
 * con una sfocatura dietro: vetro bianco su bianco non è vetro, è carta. Per
 * questo la stanza tiene una **struttura tonale** invece di essere chiara e
 * basta — vetrate accese, parete di mezzo tono, pavimento più profondo — e la
 * vignettatura resta. È anche il motivo per cui il pavimento comincia al 74%:
 * lì sotto passa il bordo inferiore del pannello, e deve avere qualcosa di più
 * scuro contro cui staccarsi.
 *
 * Server Component: nessun JS, nessuna idratazione. Con `prefers-reduced-motion`
 * resta la stessa stanza, ferma.
 */
export default function Sfondo() {
  return (
    <div className="lm-scene" aria-hidden="true">
      {/* Le due vetrate dell'angolo: la sinistra prende più luce. */}
      <span className="lm-vetrata" data-v="1" />
      <span className="lm-vetrata" data-v="2" />
      {/* La luce: l'alone caldo in alto, il taglio obliquo che attraversa, la
          pozza sul pavimento sotto il pannello. */}
      <span className="lm-luce" data-l="alone" />
      <span className="lm-luce" data-l="taglio" />
      <span className="lm-luce" data-l="pozza" />
    </div>
  )
}
