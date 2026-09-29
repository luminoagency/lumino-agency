'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudUpload, Check, WifiOff } from 'lucide-react'
import { salvaVisita } from '@/lib/staff/actions'
import { EVENTO_CODA, leggiCoda, togli, type VisitaInCoda } from '@/lib/staff/coda'

/**
 * Le visite in attesa di partire, e la pill che lo dice.
 *
 * ## Quando prova
 *
 * All'apertura, al ritorno della rete (`online`), quando la scheda torna in
 * primo piano, e quando il Campo annuncia di aver appena accodato qualcosa.
 * **Non** c'è nessun timer: un `setInterval` che gira per tutta la vita della
 * pagina per controllare una coda quasi sempre vuota è esattamente il tipo di
 * lavoro invisibile che fa scaldare un telefono.
 *
 * ## Una alla volta, in ordine
 *
 * Le visite partono in fila e non tutte insieme. Sono poche per definizione —
 * una giornata di giro ne fa una manciata — e mandarle in parallelo vorrebbe
 * dire tre inserimenti simultanei sullo stesso utente per guadagnare
 * millisecondi che nessuno sta aspettando.
 *
 * ## Cosa succede se il server la rifiuta
 *
 * Se l'errore è di rete si riprova al giro dopo. Se invece il server risponde e
 * dice di no — un cliente cancellato nel frattempo, un motivo di rifiuto che
 * manca — la visita **esce** dalla coda e la pill lo dice: tenerla dentro
 * vorrebbe dire ritentare per sempre una cosa che non passerà mai, e lasciare
 * l'utente convinto che prima o poi arriverà.
 */
export default function CodaVisite() {
  const [righe, setRighe] = useState<VisitaInCoda[]>([])
  const [stato, setStato] = useState<'ferma' | 'invio' | 'fatto' | 'respinta'>('ferma')
  const inCorso = useRef(false)

  const rileggi = useCallback(() => setRighe(leggiCoda()), [])

  const svuota = useCallback(async () => {
    if (inCorso.current) return
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    const coda = leggiCoda()
    if (coda.length === 0) return

    inCorso.current = true
    setStato('invio')
    let respinte = 0

    for (const riga of coda) {
      try {
        const esito = await salvaVisita(riga.dati)
        if (esito.ok) {
          togli(riga.id)
        } else {
          /* Il server ha risposto e ha detto di no: non è la rete, è il dato.
             Riprovare non cambierà niente. */
          togli(riga.id)
          respinte += 1
        }
      } catch {
        /* Rete caduta di nuovo a metà giro: quello che resta riparte al
           prossimo `online`. */
        break
      }
    }

    inCorso.current = false
    const rimaste = leggiCoda()
    setRighe(rimaste)
    if (rimaste.length > 0) setStato('ferma')
    else if (respinte > 0) setStato('respinta')
    else setStato('fatto')
  }, [])

  useEffect(() => {
    rileggi()
    void svuota()

    const alVisibile = () => {
      if (document.visibilityState === 'visible') void svuota()
    }
    const online = () => void svuota()
    const accodata = () => {
      rileggi()
      void svuota()
    }

    window.addEventListener('online', online)
    window.addEventListener(EVENTO_CODA, accodata)
    document.addEventListener('visibilitychange', alVisibile)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener(EVENTO_CODA, accodata)
      document.removeEventListener('visibilitychange', alVisibile)
    }
  }, [rileggi, svuota])

  /* «Fatto» e «respinta» sono messaggi, non stati: si tolgono da soli. */
  useEffect(() => {
    if (stato !== 'fatto' && stato !== 'respinta') return
    const t = window.setTimeout(() => setStato('ferma'), stato === 'fatto' ? 4000 : 9000)
    return () => window.clearTimeout(t)
  }, [stato])

  if (righe.length === 0 && stato !== 'fatto' && stato !== 'respinta') return null

  if (stato === 'fatto') {
    return (
      <p className="lm-coda" data-stato="fatto" role="status">
        <Check aria-hidden="true" />
        Visite inviate.
      </p>
    )
  }

  if (stato === 'respinta') {
    return (
      <p className="lm-coda" data-stato="respinta" role="status">
        <WifiOff aria-hidden="true" />
        Una visita è stata rifiutata dal server: riaprila dal Campo e rifalla.
      </p>
    )
  }

  const quante = righe.length
  return (
    <p className="lm-coda" data-stato={stato} role="status">
      <CloudUpload aria-hidden="true" />
      {/* Corto di proposito: è una riga che galleggia sopra il contenuto, e
          tre righe di spiegazione lì sopra coprono la pagina invece di
          informare. Il «dove sono finite» lo dice la parola «attesa». */}
      {stato === 'invio'
        ? `Invio ${quante === 1 ? 'la visita' : `le ${quante} visite`}…`
        : `${quante === 1 ? '1 visita in attesa' : `${quante} visite in attesa`} della rete`}
    </p>
  )
}
