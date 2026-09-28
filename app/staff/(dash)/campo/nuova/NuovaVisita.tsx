'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Check, MapPin, Search } from 'lucide-react'
import { Chips, ChipsOne, ChipsSiNo, opzioni } from '@/components/staff/Chips'
import { iniziali } from '@/components/staff/ClienteCardBody'
import PageHead, { StatoPill } from '@/components/staff/PageHead'
import PhotoPicker, { type FotoScattata } from '@/components/staff/PhotoPicker'
import VoiceNote from '@/components/staff/VoiceNote'
import { creaCliente, salvaVisita, type DatiVisita } from '@/lib/staff/actions'
import type { ClienteScelta } from '@/lib/staff/queries'
import {
  GESTIONE_LABEL,
  GESTIONI,
  LINGUA_LABEL,
  LINGUE,
  OBIEZIONE_LABEL,
  OBIEZIONI,
  REAZIONE_LABEL,
  REAZIONI,
  SETTORE_LABEL,
  SETTORI,
  STATI,
  STATO_LABEL,
  STRUMENTI,
  STRUMENTO_LABEL,
  oggiISO,
} from '@/lib/staff/types'

const PASSI = ['Chi', 'Come lavora', "Com'è andata"] as const

/** I richiami che si prendono davvero, più «scelgo io la data». */
const RICHIAMI = [
  { value: '3', label: 'Fra 3 giorni' },
  { value: '7', label: 'Fra una settimana' },
  { value: '14', label: 'Fra due settimane' },
  { value: '30', label: 'Fra un mese' },
]

/**
 * La visita, in tre schermate.
 *
 * Tre e non un modulo unico lungo: davanti a un titolare che parla non si
 * scorre una pagina, si tocca. Ogni passo è una domanda sola — chi è, come
 * lavora adesso, com'è andata — e sono le tre domande nell'ordine in cui una
 * conversazione le fa nascere.
 *
 * Niente è obbligatorio tranne il cliente. È la regola che tiene i due minuti:
 * una visita registrata a metà vale infinitamente più di una visita non
 * registrata perché mancava la risposta a una domanda che non si era fatta in
 * tempo.
 *
 * Si può salvare da qualunque passo — il bottone non aspetta il terzo. Chi
 * deve rientrare di corsa salva quello che ha.
 */
export default function NuovaVisita({
  clienti,
  isAdmin,
  ioId,
}: {
  clienti: ClienteScelta[]
  isAdmin: boolean
  ioId: string
}) {
  const router = useRouter()
  const [passo, setPasso] = useState(0)
  const [busy, setBusy] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const [elenco, setElenco] = useState(clienti)
  const [scelto, setScelto] = useState<ClienteScelta | null>(null)

  const [gestione, setGestione] = useState<string[]>([])
  const [strumenti, setStrumenti] = useState<string[]>([])
  const [lingue, setLingue] = useState<string[]>([])
  const [commissioni, setCommissioni] = useState('')
  const [turisti, setTuristi] = useState<boolean | null>(null)

  const [reazione, setReazione] = useState('')
  const [obiezione, setObiezione] = useState('')
  const [frase, setFrase] = useState('')
  const [problemi, setProblemi] = useState('')
  const [vocale, setVocale] = useState('')
  const [foto, setFoto] = useState<FotoScattata[]>([])

  const [nuovoStato, setNuovoStato] = useState('')
  const [motivo, setMotivo] = useState('')
  const [richiamo, setRichiamo] = useState('')
  const [richiamoData, setRichiamoData] = useState('')
  const [richiamoNota, setRichiamoNota] = useState('')

  const posizione = usaPosizione(passo >= 2)

  const ultimo = passo === PASSI.length - 1
  const puoSalvare = Boolean(scelto) && !busy

  async function salva() {
    if (!scelto) {
      setPasso(0)
      setErrore('Scegli prima il cliente della visita.')
      return
    }
    if (nuovoStato === 'rifiutato' && !motivo.trim()) {
      setErrore('Per segnarlo come rifiutato serve il motivo.')
      return
    }

    setBusy(true)
    setErrore(null)

    const dati: DatiVisita = {
      client_id: scelto.id,
      gestione_prenotazioni: gestione,
      strumenti_usati: strumenti,
      lingue_clienti: lingue,
      commissioni_pagate: commissioni,
      turisti,
      problemi_dichiarati: problemi,
      reazione,
      obiezione_principale: obiezione,
      frase_titolare: frase,
      trascrizione_vocale: vocale,
      foto: foto.map((f) => f.path),
      lat: posizione.lat,
      lng: posizione.lng,
      nuovo_stato: nuovoStato || undefined,
      motivo_rifiuto: motivo,
      followup_data: dataRichiamo(richiamo, richiamoData),
      followup_nota: richiamoNota,
    }

    const esito = await salvaVisita(dati)
    if (!esito.ok) {
      setErrore(esito.error ?? 'Non è stato possibile salvare la visita.')
      setBusy(false)
      return
    }

    router.refresh()
    router.push('/staff/campo')
  }

  return (
    <>
      <PageHead
        title="Nuova visita"
        sub={
          scelto
            ? `${scelto.nome}${scelto.citta ? ` · ${scelto.citta}` : ''}`
            : 'Tre domande. Solo la prima è obbligatoria.'
        }
      >
        {scelto && <StatoPill stato={scelto.stato} />}
      </PageHead>

      <div className="lm-steps" aria-label="Avanzamento">
        {PASSI.map((nome, i) => (
          <button
            key={nome}
            type="button"
            className="lm-step"
            data-on={i === passo}
            data-done={i < passo}
            /* Indietro sempre, avanti solo dopo aver scelto il cliente: i due
               passi successivi scrivono su di lui e senza non hanno soggetto. */
            disabled={i > passo && !scelto}
            onClick={() => setPasso(i)}
          >
            <span className="lm-step-n">{i < passo ? <Check aria-hidden="true" /> : i + 1}</span>
            {nome}
          </button>
        ))}
      </div>

      <div className="lm-card lm-visita">
        {passo === 0 && (
          <SceltaCliente
            clienti={elenco}
            scelto={scelto}
            isAdmin={isAdmin}
            ioId={ioId}
            onScegli={(c) => {
              setScelto(c)
              setErrore(null)
              setPasso(1)
            }}
            onCreato={(c) => {
              setElenco((e) => [c, ...e])
              setScelto(c)
              setErrore(null)
              setPasso(1)
            }}
          />
        )}

        {passo === 1 && (
          <div className="lm-visita-blocchi">
            <Chips
              label="Come prende le prenotazioni"
              hint="Quello che usa davvero, non quello che dice di avere."
              options={opzioni(GESTIONI, GESTIONE_LABEL)}
              value={gestione}
              onChange={setGestione}
            />
            <Chips
              label="Cosa usa adesso"
              options={opzioni(STRUMENTI, STRUMENTO_LABEL)}
              value={strumenti}
              onChange={setStrumenti}
            />
            <Chips
              label="Che lingue parlano i suoi clienti"
              hint="È la domanda che apre il discorso del sito multilingua."
              options={opzioni(LINGUE, LINGUA_LABEL)}
              value={lingue}
              onChange={setLingue}
            />
            <ChipsSiNo
              label="Lavora con i turisti"
              value={turisti}
              onChange={setTuristi}
            />
            <div className="lm-field">
              <label htmlFor="commissioni">Commissioni che paga, al mese</label>
              <input
                id="commissioni"
                type="number"
                min="0"
                step="10"
                inputMode="decimal"
                value={commissioni}
                onChange={(e) => setCommissioni(e.target.value)}
                placeholder="180"
              />
              <p className="lm-field-hint">
                A TheFork, a Booking, a chi gli gestisce i social. È il numero che rende il
                preventivo un confronto invece di una spesa.
              </p>
            </div>
          </div>
        )}

        {passo === 2 && (
          <div className="lm-visita-blocchi">
            <ChipsOne
              label="Come ha reagito"
              options={opzioni(REAZIONI, REAZIONE_LABEL)}
              value={reazione}
              onChange={setReazione}
            />
            <ChipsOne
              label="Obiezione principale"
              hint="Quella vera, non la prima detta per cortesia."
              options={opzioni(OBIEZIONI, OBIEZIONE_LABEL)}
              value={obiezione}
              onChange={setObiezione}
            />

            <div className="lm-field">
              <label htmlFor="frase">Una frase sua</label>
              <input
                id="frase"
                value={frase}
                onChange={(e) => setFrase(e.target.value)}
                placeholder="«Il sito ce l’ho, me l’ha fatto mio nipote nel 2016»"
              />
              <p className="lm-field-hint">
                Le parole del titolare valgono più di un riassunto: fra sei mesi sono l&apos;unica
                cosa che fa ricordare la conversazione.
              </p>
            </div>

            <div className="lm-field">
              <label htmlFor="problemi">Problemi che ha dichiarato</label>
              <textarea
                id="problemi"
                value={problemi}
                onChange={(e) => setProblemi(e.target.value)}
                placeholder="Fuori stagione non lavora, le recensioni gliele scrive la figlia, non risponde al telefono a pranzo…"
              />
            </div>

            <VoiceNote value={vocale} onChange={setVocale} />
            <PhotoPicker clientId={scelto?.id ?? ''} foto={foto} onChange={setFoto} />

            <div className="lm-gps">
              <MapPin aria-hidden="true" />
              <span>{posizione.testo}</span>
              {posizione.stato !== 'presa' && (
                <button type="button" className="lm-pill" data-size="sm" onClick={posizione.riprova}>
                  Riprova
                </button>
              )}
            </div>

            <ChipsOne
              label="Dove lo sposto"
              hint="Se la visita non ha cambiato niente, lascia stare: resta dov'è."
              options={STATI.map((s) => ({ value: s, label: STATO_LABEL[s] }))}
              value={nuovoStato}
              onChange={(v) => {
                setNuovoStato(v)
                if (v !== 'rifiutato') setMotivo('')
              }}
            />

            {nuovoStato === 'rifiutato' && (
              <div className="lm-field">
                <label htmlFor="motivo">Perché ha detto di no</label>
                <textarea
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  placeholder="Il motivo vero, con parole sue."
                />
                <p className="lm-field-hint">
                  Obbligatorio: è il dato che dice perché si perde, ed è quello che si salta
                  sempre.
                </p>
              </div>
            )}

            <ChipsOne
              label="Quando lo richiamo"
              options={[...RICHIAMI, { value: 'data', label: 'Scelgo la data' }]}
              value={richiamo}
              onChange={setRichiamo}
            />

            {richiamo === 'data' && (
              <div className="lm-field">
                <label htmlFor="richiamo-data">Data del richiamo</label>
                <input
                  id="richiamo-data"
                  type="date"
                  min={oggiISO()}
                  value={richiamoData}
                  onChange={(e) => setRichiamoData(e.target.value)}
                />
              </div>
            )}

            {richiamo && (
              <div className="lm-field">
                <label htmlFor="richiamo-nota">Cosa devo ricordarmi</label>
                <input
                  id="richiamo-nota"
                  value={richiamoNota}
                  onChange={(e) => setRichiamoNota(e.target.value)}
                  placeholder="Portare il preventivo stampato, chiedere della figlia che fa i social…"
                />
              </div>
            )}
          </div>
        )}

        {errore && (
          <p className="lm-error" role="alert" style={{ marginTop: '1rem' }}>
            {errore}
          </p>
        )}
      </div>

      {/* La barra resta in basso, dove sta il pollice: su un telefono
          l'azione principale in cima allo schermo è un'azione che non si usa. */}
      <div className="lm-visita-bar">
        <button
          type="button"
          className="lm-btn"
          data-variant="ghost"
          onClick={() => (passo === 0 ? router.back() : setPasso(passo - 1))}
          disabled={busy}
        >
          {passo === 0 ? 'Annulla' : 'Indietro'}
        </button>

        {/* **Due bottoni alla volta, non tre.** Prima «Salva visita» stava lì
            dal primo passo, disabilitato: su uno schermo da 390px erano tre
            bottoni da 110px e l'etichetta principale andava a capo in mezzo alla
            pill. Ed era anche un invito sbagliato — al primo passo non c'è
            niente da salvare, e un'azione principale spenta per due schermate su
            tre insegna a non guardarla.
            Adesso l'azione principale è sempre una sola e cambia con il passo:
            «Avanti» finché ce n'è uno dopo, «Salva visita» sull'ultimo. */}
        {ultimo ? (
          <button type="button" className="lm-btn" onClick={salva} disabled={!puoSalvare}>
            {busy ? 'Salvo…' : 'Salva visita'}
          </button>
        ) : (
          <button
            type="button"
            className="lm-btn"
            onClick={() => setPasso(passo + 1)}
            disabled={!scelto || busy}
          >
            Avanti
          </button>
        )}
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Il primo passo: chi si ha davanti.
 *
 * La ricerca guarda nome, città, zona e indirizzo insieme — davanti a un
 * locale ci si ricorda la via molto più spesso dell'insegna esatta.
 *
 * «Non è in elenco» apre tre campi e basta. Un locale che non è ancora in
 * pipeline è il caso più frequente di tutti, ed è anche il momento in cui è
 * più facile perderlo: se creare una scheda costasse un giro sulla pagina
 * Clienti, la visita non si registrerebbe.
 */
function SceltaCliente({
  clienti,
  scelto,
  isAdmin,
  ioId,
  onScegli,
  onCreato,
}: {
  clienti: ClienteScelta[]
  scelto: ClienteScelta | null
  isAdmin: boolean
  ioId: string
  onScegli: (c: ClienteScelta) => void
  onCreato: (c: ClienteScelta) => void
}) {
  const [q, setQ] = useState('')
  const [nuovo, setNuovo] = useState(false)
  const [nome, setNome] = useState('')
  const [settore, setSettore] = useState<string>('ristorante')
  const [citta, setCitta] = useState('')
  const [busy, setBusy] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const trovati = useMemo(() => {
    const ago = q.trim().toLowerCase()
    const base = ago
      ? clienti.filter((c) =>
          [c.nome, c.citta, c.zona, c.indirizzo]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(ago),
        )
      : clienti
    return base.slice(0, 40)
  }, [clienti, q])

  async function crea() {
    if (!nome.trim()) return
    setBusy(true)
    setErrore(null)

    const esito = await creaCliente({
      nome,
      settore,
      citta,
      stato: 'contattato',
      assegnato_a: isAdmin ? ioId : undefined,
    })

    if (!esito.ok || !esito.id) {
      setErrore(esito.error ?? 'Non è stato possibile creare il cliente.')
      setBusy(false)
      return
    }

    onCreato({
      id: esito.id,
      nome: nome.trim(),
      settore: settore as ClienteScelta['settore'],
      citta: citta.trim() || null,
      zona: null,
      indirizzo: null,
      telefono: null,
      stato: 'contattato',
    })
  }

  if (nuovo) {
    return (
      <div className="lm-visita-blocchi">
        <span className="lm-label">Un locale nuovo</span>
        <div className="lm-field">
          <label htmlFor="nuovo-nome">Nome del locale</label>
          <input
            id="nuovo-nome"
            value={nome}
            autoFocus
            onChange={(e) => setNome(e.target.value)}
            placeholder="Trattoria da Gigi"
          />
        </div>
        <div className="lm-field">
          <label htmlFor="nuovo-settore">Settore</label>
          <select id="nuovo-settore" value={settore} onChange={(e) => setSettore(e.target.value)}>
            {SETTORI.map((s) => (
              <option key={s} value={s}>
                {SETTORE_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="lm-field">
          <label htmlFor="nuovo-citta">Città</label>
          <input
            id="nuovo-citta"
            value={citta}
            onChange={(e) => setCitta(e.target.value)}
            placeholder="Jesolo"
          />
        </div>

        <p className="lm-field-hint">
          Nasce come «contattato», perché ci si è appena parlato. Il resto dei dati si aggiunge
          dalla sua scheda, con calma.
        </p>

        {errore && (
          <p className="lm-error" role="alert">
            {errore}
          </p>
        )}

        <div className="lm-modal-actions">
          <button
            type="button"
            className="lm-btn"
            data-variant="ghost"
            onClick={() => setNuovo(false)}
            disabled={busy}
          >
            Torna all&apos;elenco
          </button>
          <button
            type="button"
            className="lm-btn"
            onClick={crea}
            disabled={busy || !nome.trim()}
          >
            {busy ? 'Creo…' : 'Crea e continua'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="lm-visita-blocchi">
      <div className="lm-search">
        <Search aria-hidden="true" />
        <input
          type="search"
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca per nome, via o zona"
          aria-label="Cerca il cliente"
        />
      </div>

      <div className="lm-listbox" role="listbox" aria-label="Clienti">
        {trovati.map((c) => (
          <button
            key={c.id}
            type="button"
            role="option"
            aria-selected={scelto?.id === c.id}
            className="lm-ccard lm-pick"
            data-selected={scelto?.id === c.id}
            onClick={() => onScegli(c)}
          >
            <span className="lm-ccard-head">
              <span className="lm-avatar-i" aria-hidden="true">
                {iniziali(c.nome)}
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="lm-ccard-name">{c.nome}</span>
                <span className="lm-ccard-meta">
                  <span className="lm-dot" data-settore={c.settore} aria-hidden="true" />
                  {SETTORE_LABEL[c.settore]}
                  {[c.citta, c.zona].filter(Boolean).length > 0 && (
                    <>· {[c.citta, c.zona].filter(Boolean).join(' · ')}</>
                  )}
                </span>
              </span>
            </span>
            <span className="lm-ccard-foot">
              <StatoPill stato={c.stato} />
            </span>
          </button>
        ))}

        {!trovati.length && (
          <p className="lm-empty">Nessun cliente con questo nome fra i tuoi.</p>
        )}
      </div>

      <button type="button" className="lm-btn" data-variant="ghost" onClick={() => setNuovo(true)}>
        Non è in elenco
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

type StatoGps = 'spento' | 'cerco' | 'presa' | 'negata'

/**
 * La posizione, presa da sola quando serve.
 *
 * Si chiede solo entrando nel terzo passo, non all'apertura della pagina: il
 * permesso del browser è una finestra che copre lo schermo, e farla comparire
 * mentre si sta cercando il cliente vuol dire vederla rifiutare.
 *
 * Non blocca mai il salvataggio. Un GPS negato o un locale sotto i portici
 * lasciano `null` nelle due colonne, e la visita si registra uguale: la mappa
 * delle zone della fase 4 avrà qualche buco, che è meglio di qualche visita in
 * meno.
 */
function usaPosizione(attiva: boolean) {
  const [stato, setStato] = useState<StatoGps>('spento')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [tentativo, setTentativo] = useState(0)

  useEffect(() => {
    if (!attiva || stato === 'presa') return
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStato('negata')
      return
    }

    let vivo = true
    setStato('cerco')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!vivo) return
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setStato('presa')
      },
      () => {
        if (vivo) setStato('negata')
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )

    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attiva, tentativo])

  const testo =
    stato === 'presa'
      ? 'Posizione registrata con la visita.'
      : stato === 'cerco'
        ? 'Cerco la posizione…'
        : stato === 'negata'
          ? 'Senza posizione: la visita si salva lo stesso.'
          : 'La posizione si prende al terzo passo.'

  return { stato, lat, lng, testo, riprova: () => setTentativo((n) => n + 1) }
}

/** Da «fra 3 giorni» o da una data scelta alla colonna `date` del follow-up. */
function dataRichiamo(scelta: string, data: string): string | undefined {
  if (!scelta) return undefined
  if (scelta === 'data') return data || undefined

  const giorni = Number(scelta)
  if (!Number.isFinite(giorni)) return undefined
  return oggiISO(giorni)
}
