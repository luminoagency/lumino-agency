'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { ayahAt, indiceAyahDopo, type Ayah } from '@/lib/staff/ayat'
import { ospitePortale } from '@/lib/staff/portale'
import {
  NOME_ARABO,
  NOME_PREGHIERA,
  ascoltaImpostazioni,
  leggiImpostazioni,
  leggiPosizione,
  stato as calcolaStato,
  type ImpostazioniSalat,
  type Posizione,
  type Preghiera,
} from '@/lib/staff/salat'

/**
 * Le notifiche dell'area: un'ayah ogni tanto, e l'adhan quando entra l'orario.
 *
 * ═══ Perché esiste questo file, cioè cosa era rotto ═══
 *
 * L'ayah stava ferma in una card della home e **non cambiava mai**. Tre cose
 * insieme, e ognuna da sola bastava:
 *
 * 1. il minimo dell'intervallo era cinque minuti in **tre** punti diversi —
 *    l'`input`, `leggiImpostazioni()` e un `Math.max(5, …)` in ognuno dei due
 *    consumatori. Chi scriveva «1» lo salvava davvero e se lo rileggeva come 5:
 *    il valore c'era nel `localStorage` e nessuno lo usava;
 * 2. il contatore dei giri viveva nello stato di una card della **home**. Ogni
 *    navigazione dentro /staff smontava quella card: indice a zero e
 *    `setInterval` ricominciato da capo. Chi lavora apre un cliente, torna,
 *    guarda la pipeline — cioè azzera il timer molto prima che scada;
 * 3. l'ayah era disegnata anche dal server, quindi doveva essere deterministica
 *    per non far litigare l'idratazione, e questo impediva di scegliere.
 *
 * Il rimedio ai primi due è **dove sta questo componente**: nella shell, che non
 * si smonta mai durante la navigazione interna. Il timer è uno, parte una volta,
 * e tiene l'indice in un `ref` — un `ref` non fa rirenderizzare e non si azzera
 * quando il contenuto della pagina cambia. Il terzo cade da sé: una notifica non
 * esiste al primo dipinto, quindi l'ayah si può estrarre a sorte.
 *
 * ═══ Le regole della notifica ═══
 *
 * · **Mai sopra qualcosa su cui si preme.** In basso a destra sul desktop, in
 *   basso ma **sopra la barra di navigazione** sul telefono (vedi `--sotto` nel
 *   CSS). Mai al centro, mai sopra una modale: lo z-index la tiene sotto.
 * · **Se ne va da sé**, e l'adhan resta più del doppio: un'ayah è una cosa da
 *   leggere se capita, l'adhan è un'informazione con un'ora dentro.
 * · **Niente suoni**, nemmeno per l'adhan. Era una richiesta esplicita, e una
 *   dashboard che suona in ufficio la si spegne il primo giorno.
 * · **L'adhan ha la precedenza**: se arriva mentre c'è un'ayah, la sostituisce.
 *   Mai due notifiche insieme — due cose che chiedono attenzione nello stesso
 *   angolo sono zero cose lette.
 * · **Una sola per preghiera**, anche ricaricando o con cinque schede aperte: il
 *   segno sta in `localStorage` e la chiave è **l'istante esatto** della
 *   preghiera, quindi si invalida da sé il giorno dopo senza nessuna pulizia.
 */
export default function Notifiche() {
  const [imp, setImp] = useState<ImpostazioniSalat | null>(null)
  const [pos, setPos] = useState<Posizione | null>(null)
  const [avviso, setAvviso] = useState<Avviso | null>(null)
  /* `document` non esiste sul server e `createPortal` lo pretende. */
  const [ospite, setOspite] = useState<HTMLElement | null>(null)

  /* L'indice dell'ultima ayah mostrata. In un `ref` e non in uno stato: non
     deve far ridisegnare niente di suo, e soprattutto deve **sopravvivere** —
     è la memoria che impedisce due ayat uguali di fila. */
  const ultima = useRef<number | null>(null)
  /* Il timer di scomparsa in corso. Se ne arriva un'altra notifica prima della
     scadenza, il vecchio va spento: senza, l'adhan che sostituisce un'ayah
     erediterebbe il conto alla rovescia dell'ayah e se ne andrebbe in due
     secondi. */
  const uscita = useRef<number | null>(null)

  useEffect(() => setOspite(ospitePortale()), [])

  /* ── le preferenze, e il fatto che cambiano ────────────────────────────── */
  /**
   * Si rileggono a ogni modifica, non solo al montaggio.
   *
   * Questo componente non si smonta mai: senza questo ascolto, cambiare
   * l'intervallo in `/staff/io` non avrebbe effetto fino al prossimo
   * ricaricamento della pagina — che è un'altra faccia dello stesso difetto da
   * cui veniamo. La posizione si rilegge insieme perché la si cambia nello
   * stesso pannello.
   */
  useEffect(() => {
    const rileggi = () => {
      setImp(leggiImpostazioni())
      setPos(leggiPosizione())
    }
    rileggi()
    return ascoltaImpostazioni(rileggi)
  }, [])

  const chiudi = useCallback(() => {
    if (uscita.current !== null) window.clearTimeout(uscita.current)
    uscita.current = null
    setAvviso(null)
  }, [])

  /** Mostra, e programma la scomparsa. Un solo posto che tocca `avviso`. */
  const mostra = useCallback((a: Avviso) => {
    /**
     * L'angolo in basso è di uno alla volta.
     *
     * È la stessa regola per cui l'adhan sostituisce un'ayah invece di
     * affiancarla, applicata a un vicino che non vive in questo componente:
     * `.lm-invito`, la striscia «installa l'app», sul telefono sta nello stesso
     * posto e ha un `z-index` più alto (55 contro 44), quindi coprirebbe la
     * notifica a metà. Succede in una finestra stretta — primo accesso da
     * telefono, striscia ancora aperta — ma il risultato sarebbe una notifica
     * illeggibile, e una notifica illeggibile è peggio di una mancata.
     *
     * Si salta il turno, non si rimanda: la prossima ayah arriva fra un
     * intervallo, e nel frattempo la striscia è stata chiusa o accettata.
     *
     * Restituisce **se ha mostrato davvero**, e serve all'adhan: il suo «già
     * visto» si scrive solo dopo un sì, altrimenti l'unica notifica di quella
     * preghiera si perderebbe per una striscia che nessuno aveva ancora chiuso.
     */
    if (document.querySelector('.lm-invito')) return false

    if (uscita.current !== null) window.clearTimeout(uscita.current)
    setAvviso(a)
    uscita.current = window.setTimeout(() => {
      uscita.current = null
      setAvviso(null)
    }, a.durata)
    return true
  }, [])

  /* ── le ayat ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!imp?.attivo || !imp.ayat) return

    const ms = Math.max(1, imp.intervalloAyah) * 60_000

    const giro = () => {
      /* Mentre la scheda è nascosta non si notifica. Non è un'ottimizzazione:
         un'ayah comparsa e sparita in un angolo che nessuno guardava è
         un'ayah bruciata, e tornando sulla scheda si troverebbe il nulla.
         Il timer continua, il turno salta. */
      if (document.visibilityState !== 'visible') return
      const i = indiceAyahDopo(ultima.current)
      ultima.current = i
      mostra({ tipo: 'ayah', ayah: ayahAt(i), durata: DURATA_AYAH })
    }

    /* **Niente prima notifica all'avvio.** Entrare in dashboard e trovarsi
       subito un versetto addosso è il modo di farlo spegnere: la prima arriva
       dopo un intervallo, come tutte le altre. */
    const id = window.setInterval(giro, ms)
    return () => window.clearInterval(id)
  }, [imp?.attivo, imp?.ayat, imp?.intervalloAyah, mostra])

  /* ── l'adhan ───────────────────────────────────────────────────────────── */
  /**
   * Si controlla l'orologio ogni venti secondi, non si programma un `setTimeout`
   * all'orario esatto.
   *
   * Un timeout di sei ore non è affidabile: il portatile si chiude, il telefono
   * sospende la scheda, e al risveglio il browser non recupera il tempo passato
   * — l'adhan di Asr arriverebbe alle nove di sera o mai. Leggere l'ora vera a
   * intervalli brevi costa un confronto fra numeri e non si sbaglia mai, perché
   * non ha memoria di quando è partito. È la stessa scelta del conto alla
   * rovescia nel widget.
   *
   * Venti secondi è il ritardo massimo con cui la notifica può arrivare, e per
   * un adhan è dentro l'errore di qualunque calcolo astronomico.
   */
  useEffect(() => {
    if (!imp?.attivo || !imp.notifiche || !pos) return

    const guarda = () => {
      if (document.visibilityState !== 'visible') return

      let st
      try {
        st = calcolaStato(pos, imp)
      } catch {
        /* Coordinate impossibili salvate a mano: nessuna notifica, nessun
           errore in console a ogni ciclo. */
        return
      }

      /* Oltre i dieci minuti dall'entrata non si avvisa: aprendo la dashboard
         alle quattro del pomeriggio non deve arrivare l'adhan di Dhuhr. */
      const da = Date.now() - st.attuale.at.getTime()
      if (da < 0 || da > 600_000) return

      /* La chiave è l'istante esatto, quindi: una sola notifica per preghiera
         anche ricaricando la pagina, e una sola fra tutte le schede aperte —
         `localStorage` è condiviso nell'origine. E si invalida da sé domani,
         perché domani l'istante è un altro: nessuna pulizia da ricordarsi. */
      const chiave = st.attuale.at.toISOString()
      try {
        if (localStorage.getItem(CHIAVE_VISTO) === chiave) return
      } catch {
        /* Finestra privata: meglio nessuna notifica che una a ogni ciclo. */
        return
      }

      const mostrata = mostra({
        tipo: 'adhan',
        preghiera: st.attuale.chiave,
        ora: st.attuale.ora,
        citta: pos.citta || null,
        durata: DURATA_ADHAN,
      })

      /* **Si segna solo dopo**: scrivere prima e poi non mostrare vorrebbe dire
         bruciare l'unica notifica di quella preghiera. Fra la lettura e la
         scrittura non c'è niente che possa inserirsi — siamo in un ciclo
         sincrono di venti secondi, non in una transazione. */
      if (!mostrata) return
      try {
        localStorage.setItem(CHIAVE_VISTO, chiave)
      } catch {
        /* Mostrata e non segnata: ricaricando la pagina nei prossimi dieci
           minuti ricomparirà. È il male minore fra due difetti piccoli. */
      }
    }

    guarda()
    const id = window.setInterval(guarda, 20_000)
    /* Tornando sulla scheda si controlla subito: se l'orario è entrato mentre
       era in secondo piano, l'avviso arriva adesso e non fra venti secondi. */
    const alRitorno = () => {
      if (document.visibilityState === 'visible') guarda()
    }
    document.addEventListener('visibilitychange', alRitorno)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', alRitorno)
    }
  }, [imp, pos, mostra])

  /* Al cambio di preferenze una notifica già a schermo di una cosa appena
     spenta resterebbe lì: si chiude. */
  useEffect(() => {
    if (!imp) return
    if (!imp.attivo) chiudi()
  }, [imp, chiudi])

  if (!ospite || !avviso) return null

  return createPortal(
    /* `role="status"` e `aria-live="polite"`: è un'informazione che arriva da
       sé, non un errore e non una domanda. `polite` fa sì che un lettore di
       schermo la annunci quando ha finito la frase in corso, invece di
       interrompere chi sta leggendo una tabella di numeri. */
    <div className="lm-nota" data-tipo={avviso.tipo} role="status" aria-live="polite">
      <button
        type="button"
        className="lm-nota-x"
        onClick={chiudi}
        aria-label="Chiudi la notifica"
      >
        <X aria-hidden="true" />
      </button>

      {avviso.tipo === 'adhan' ? (
        <>
          <p className="lm-nota-testa">
            <span className="lm-nota-tipo">Adhan</span>
            <span className="lm-nota-quando">
              {NOME_PREGHIERA[avviso.preghiera]} {avviso.ora}
            </span>
          </p>
          <p className="lm-nota-ar" lang="ar" dir="rtl">
            {NOME_ARABO[avviso.preghiera]}
          </p>
          {avviso.citta && <p className="lm-nota-it">{avviso.citta}</p>}
        </>
      ) : (
        <>
          <p className="lm-nota-ar" lang="ar" dir="rtl">
            {avviso.ayah.parziale && <span aria-hidden="true">…</span>}
            {avviso.ayah.ar}
          </p>
          {/* La traduzione è piccola e sotto, com'era nella card: serve a chi
              legge l'arabo a fatica, non a sostituirlo. */}
          <p className="lm-nota-it">
            {avviso.ayah.parziale && '…'}
            {avviso.ayah.it}
          </p>
          <p className="lm-nota-rif">
            {avviso.ayah.sura} {avviso.ayah.rif}
          </p>
        </>
      )}
    </div>,
    ospite,
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Quanto restano a schermo.
 *
 * Nove secondi per un'ayah: è il tempo di leggere due righe di arabo con la
 * vocalizzazione **senza affrettarsi**, che è il punto — una notifica che
 * sparisce mentre si sta ancora leggendo la prima metà è peggio che non
 * comparire. Venti per l'adhan, che porta un'ora dentro e va letto anche da chi
 * alza gli occhi mezzo minuto dopo.
 */
const DURATA_AYAH = 9_000
const DURATA_ADHAN = 20_000

const CHIAVE_VISTO = 'lm_adhan_visto'

type Avviso =
  | { tipo: 'ayah'; ayah: Ayah; durata: number }
  | {
      tipo: 'adhan'
      preghiera: Preghiera
      ora: string
      citta: string | null
      durata: number
    }
