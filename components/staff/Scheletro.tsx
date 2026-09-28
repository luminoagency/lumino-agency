/**
 * Lo scheletro: la forma della pagina prima che arrivino i dati.
 *
 * Serve per una ragione precisa e misurabile. Le pagine di `/staff` sono tutte
 * `force-dynamic`, e in Next 14 **il prefetch di una rotta dinamica senza
 * `loading.tsx` non scarica niente**: al clic il router torna 170 byte, poi
 * aspetta che il server finisca di interrogare Supabase, e solo allora disegna.
 * Sono due o tre secondi in cui la schermata è quella di prima e il clic sembra
 * non essere arrivato. Bastano questi file a cambiarlo: con un confine di
 * caricamento la rotta diventa prefetchabile, il guscio arriva nella cache del
 * router mentre il mouse passa sul link, e al clic si disegna nel fotogramma
 * successivo.
 *
 * **Non è una rotella.** Una rotella dice «sto caricando» e nient'altro; una
 * forma dice *cosa* sta caricando, e quando i dati arrivano il contenuto prende
 * il posto delle sagome senza che nulla salti. Per questo gli scheletri hanno
 * gli span del bento vero: se un rettangolo è largo 4 colonne, la card che lo
 * sostituisce ne occupa 4.
 *
 * Il luccichio è una sola animazione di `background-position` su un gradiente,
 * condivisa da tutte le sagome della pagina: è il motivo per cui si può
 * disegnare venti rettangoli senza far scaldare il portatile. Con
 * `prefers-reduced-motion` resta il grigio fermo (la regola sta in staff.css).
 */

/** Un rettangolo che luccica. `w` e `h` accettano qualsiasi misura CSS. */
export function Sagoma({
  w,
  h,
  r,
  style,
}: {
  w?: string
  h?: string
  r?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className="lm-sk"
      aria-hidden="true"
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  )
}

/**
 * Il titolo della pagina, in sagoma.
 *
 * Alto come `.lm-h1` vero — `clamp(2.5rem, 6.4vw, 4.6rem)` — perché uno
 * scheletro che è più basso del titolo che sostituisce fa scendere tutta la
 * pagina di mezzo centimetro nell'istante in cui i dati arrivano, e quel salto
 * si vede più del caricamento che stava nascondendo.
 */
export function TestaSk({ largo = '11ch' }: { largo?: string }) {
  return (
    <header className="lm-head">
      <div>
        <Sagoma w={largo} h="clamp(2.5rem, 6.4vw, 4.6rem)" r="14px" />
        <Sagoma w="26ch" h="0.86rem" r="6px" style={{ marginTop: '0.7rem', maxWidth: '78vw' }} />
      </div>
    </header>
  )
}

/** Una card in sagoma, con lo span del bento e un'altezza dichiarata. */
export function CardSk({ span, h = '9rem' }: { span: number; h?: string }) {
  return (
    <div className="lm-card lm-sk-card" data-span={span} style={{ minHeight: h }} aria-hidden="true">
      <Sagoma w="9ch" h="0.7rem" r="5px" />
      <Sagoma w="62%" h="1.9rem" r="9px" style={{ marginTop: 'auto' }} />
    </div>
  )
}

/** Righe di una lista o di una tabella. */
export function RigheSk({ n = 6, h = '3.1rem' }: { n?: number; h?: string }) {
  return (
    <div className="lm-sk-righe" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        /* Le righe non luccicano insieme: sfasate di 70ms sono una lista che si
           sta riempiendo, tutte in fase sono un lampeggio unico. Il ritardo va
           in una variabile CSS così la regola di reduced-motion lo azzera. */
        <Sagoma key={i} h={h} r="14px" style={{ '--d': i } as React.CSSProperties} />
      ))}
    </div>
  )
}

/**
 * La pagina intera in sagoma: testa più un bento di card.
 *
 * `spans` descrive la composizione vera della pagina che sta arrivando, così
 * lo scheletro di Soldi non è lo stesso di Statistiche. È l'unica cosa che
 * distingue uno scheletro utile da un placeholder generico.
 */
export default function Scheletro({
  titolo = '11ch',
  spans = [3, 3, 3, 3, 8, 4],
  righe,
}: {
  titolo?: string
  spans?: number[]
  /** Se la pagina è una lista e non un bento: quante righe disegnare. */
  righe?: number
}) {
  return (
    <div className="lm-sk-page">
      <TestaSk largo={titolo} />
      {righe ? (
        <RigheSk n={righe} />
      ) : (
        <div className="lm-bento">
          {spans.map((s, i) => (
            <CardSk key={i} span={s} h={s >= 8 ? '15rem' : '9rem'} />
          ))}
        </div>
      )}
    </div>
  )
}
