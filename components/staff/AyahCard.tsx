'use client'

import { useEffect, useState } from 'react'
import { ayahDelGiro } from '@/lib/staff/ayat'
import { leggiImpostazioni } from '@/lib/staff/salat'

/**
 * L'ayah della home.
 *
 * **Discreta**, che qui vuol dire una cosa precisa: è una card perla in una
 * schermata dove il nero è l'accento raro e il viola è riservato alle azioni.
 * Non ha un bordo colorato, non ha un'icona, non ha un titolo in maiuscolo. Chi
 * la vuole leggere la legge, chi sta guardando i numeri non la incontra.
 *
 * Legge le stesse preferenze del widget della preghiera — accesa/spenta e ogni
 * quanti minuti cambia — da `localStorage`, perché sono le stesse preferenze: due
 * interruttori per la stessa cosa sarebbero due modi di dimenticarsene uno.
 *
 * Si monta **dopo** il primo dipinto (`pronto`), come il widget: il server non
 * può sapere se questo dispositivo le vuole, e disegnarle per poi togliere la
 * card sarebbe uno sfarfallio nel punto più visibile della pagina.
 */
export default function AyahCard() {
  const [acceso, setAcceso] = useState(false)
  const [minuti, setMinuti] = useState(30)
  const [giro, setGiro] = useState(0)
  const [dissolve, setDissolve] = useState(false)

  useEffect(() => {
    const imp = leggiImpostazioni()
    setAcceso(imp.attivo && imp.ayat)
    setMinuti(imp.intervalloAyah)
  }, [])

  useEffect(() => {
    if (!acceso) return
    const ms = Math.max(5, minuti) * 60_000
    const id = window.setInterval(() => {
      /* Sbiadisci, cambia, rientra: la dissolvenza è l'unico motivo per cui il
         cambio non si legge come un lampo. 420ms sono la metà della transizione
         dichiarata nel CSS, cioè il momento in cui il testo è del tutto
         invisibile. */
      setDissolve(true)
      window.setTimeout(() => {
        setGiro((g) => g + 1)
        setDissolve(false)
      }, 420)
    }, ms)
    return () => window.clearInterval(id)
  }, [acceso, minuti])

  if (!acceso) return null

  const a = ayahDelGiro(giro)

  return (
    <figure className="lm-card lm-ayah-card" data-span="12" data-tone="pearl" data-fade={dissolve}>
      <p className="lm-ayah-ar" lang="ar" dir="rtl">
        {a.parziale && <span aria-hidden="true">…</span>}
        {a.ar}
      </p>
      <blockquote className="lm-ayah-it">
        {a.parziale && '…'}
        {a.it}
      </blockquote>
      <figcaption>
        {a.sura} {a.rif}
      </figcaption>
    </figure>
  )
}
