/**
 * La stanza dietro il vetro.
 *
 * ## Cosa deve essere
 *
 * Ref1 non ha uno sfondo astratto: ha una **stanza vera**. Grandi vetrate, il
 * cielo, una lama di sole che taglia la parete e cade sul pavimento, il legno
 * in primo piano, un mobile che fa massa in fondo. Il pannello ci galleggia
 * davanti, e si capisce che sta in un ambiente.
 *
 * ## Perché una fotografia
 *
 * Qui prima c'erano gradienti — due vetrate, un orizzonte, una pozza di luce —
 * con tanto di ragionamento scritto sul fatto che costavano zero byte. Il
 * ragionamento era giusto sul costo e sbagliato sul risultato: una stanza
 * fatta di campiture non ha prospettiva, ha strati. Sembrava un muro dipinto
 * bene, e il pannello non ci galleggiava davanti: ci era appoggiato sopra.
 *
 * L'obiezione era il peso, 150-250 KB. Non è successo: il file pesa **33 KB**,
 * perché la sfocatura è cotta dentro (`scripts/sfondo-staff.mjs`) e una foto
 * senza dettaglio fine non ha quasi niente da codificare. Meno di una
 * fotografia di profilo, per una stanza intera.
 *
 * ## Come si cambia stanza
 *
 *     node scripts/sfondo-staff.mjs <foto.jpg>
 *
 * Lo script schiarisce, desatura, sfoca e riscrive `public/staff/stanza.webp`.
 * Non c'è nient'altro da toccare: né qui, né nel CSS. La foto di adesso viene
 * da Pexels, licenza libera, nessuna attribuzione dovuta.
 *
 * ## Il movimento
 *
 * Uno zoom lentissimo sulla stanza e un alone di luce che le passa davanti, su
 * durate senza divisori in comune (96s e 137s): la composizione non torna mai
 * identica. Solo `transform` e `opacity` — ogni livello diventa una texture
 * sulla GPU una volta sola e poi viene spostato. Con `prefers-reduced-motion`
 * resta la stessa stanza, ferma.
 *
 * Server Component: nessun JS, nessuna idratazione.
 */
export default function Sfondo() {
  return (
    <div className="lm-scena" aria-hidden="true">
      <div className="lm-scena-foto" />
      <div className="lm-scena-luce" />
      <div className="lm-scena-velo" />
    </div>
  )
}
