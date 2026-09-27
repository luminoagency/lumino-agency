'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Check, MapPin, Phone, RotateCcw } from 'lucide-react'
import { aggiornaFollowup } from '@/lib/staff/actions'
import type { FollowupVista, VisitaRiga } from '@/lib/staff/queries'
import {
  GESTIONE_LABEL,
  LINGUA_LABEL,
  OBIEZIONE_LABEL,
  REAZIONE_LABEL,
  SETTORE_LABEL,
  STRUMENTO_LABEL,
  dataLunga,
  etichetta,
  euro,
  oggiISO,
  quando,
} from '@/lib/staff/types'

type Tab = 'visite' | 'followup'

/**
 * Le due metà del Campo, dietro due pill.
 *
 * Tab e non due pagine: sono le due facce dello stesso gesto — si esce, si
 * visita, si prende un richiamo — e chi le usa passa dall'una all'altra dieci
 * volte al giorno. Due URL vorrebbero dire due caricamenti e due volte la
 * stessa attesa in 4G.
 *
 * Si apre sui follow-up quando ce n'è almeno uno scaduto: se si è indietro,
 * la prima cosa da vedere non è cos'è stato fatto ieri.
 */
export default function CampoView({
  visite,
  foto,
  daFare,
  fatti,
}: {
  visite: VisitaRiga[]
  foto: Record<string, string>
  daFare: FollowupVista[]
  fatti: FollowupVista[]
}) {
  const oggi = oggiISO()
  const arretrato = daFare.some((f) => f.data <= oggi)
  const [tab, setTab] = useState<Tab>(arretrato ? 'followup' : 'visite')

  return (
    <section className="lm-section">
      <div className="lm-tabs" role="tablist" aria-label="Campo">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'visite'}
          className="lm-pill"
          data-on={tab === 'visite'}
          onClick={() => setTab('visite')}
        >
          Visite
          <span className="lm-pill-n">{visite.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'followup'}
          className="lm-pill"
          data-on={tab === 'followup'}
          onClick={() => setTab('followup')}
        >
          Follow-up
          <span className="lm-pill-n">{daFare.length}</span>
        </button>
      </div>

      {tab === 'visite' ? (
        <Visite visite={visite} foto={foto} />
      ) : (
        <Followup daFare={daFare} fatti={fatti} oggi={oggi} />
      )}
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function Visite({ visite, foto }: { visite: VisitaRiga[]; foto: Record<string, string> }) {
  if (!visite.length) {
    return (
      <p className="lm-empty">
        Nessuna visita registrata. La prima si fa dal bottone qui sopra, e ci vogliono due minuti.
      </p>
    )
  }

  return (
    <div className="lm-bento">
      {visite.map((v) => {
        const scatti = (v.foto ?? []).map((p) => foto[p]).filter(Boolean)

        return (
          <article key={v.id} className="lm-card" data-span="6">
            <div className="lm-card-top">
              <Link href={`/staff/clienti/${v.client_id}`} className="lm-visit-name">
                {v.cliente}
              </Link>
              {v.reazione && (
                <span className="lm-react" data-r={v.reazione}>
                  {etichetta(v.reazione, REAZIONE_LABEL)}
                </span>
              )}
            </div>

            <p className="lm-sub" style={{ marginTop: 0 }}>
              {[v.settore ? SETTORE_LABEL[v.settore] : null, v.citta, dataLunga(v.created_at)]
                .filter(Boolean)
                .join(' · ')}
            </p>

            {v.frase_titolare && <p className="lm-quote">«{v.frase_titolare}»</p>}

            <div className="lm-tags">
              {(v.gestione_prenotazioni ?? []).map((g) => (
                <span key={`g-${g}`} className="lm-tag">
                  {etichetta(g, GESTIONE_LABEL)}
                </span>
              ))}
              {(v.strumenti_usati ?? []).map((s) => (
                <span key={`s-${s}`} className="lm-tag" data-kind="strumento">
                  {etichetta(s, STRUMENTO_LABEL)}
                </span>
              ))}
              {(v.lingue_clienti ?? []).map((l) => (
                <span key={`l-${l}`} className="lm-tag" data-kind="lingua">
                  {etichetta(l, LINGUA_LABEL)}
                </span>
              ))}
            </div>

            <div className="lm-rows" style={{ marginTop: '0.8rem' }}>
              {v.obiezione_principale && (
                <div className="lm-row">
                  <span className="lm-muted">Obiezione</span>
                  <span className="lm-row-v">
                    {etichetta(v.obiezione_principale, OBIEZIONE_LABEL)}
                  </span>
                </div>
              )}
              {v.commissioni_pagate != null && (
                <div className="lm-row">
                  <span className="lm-muted">Commissioni</span>
                  <span className="lm-row-v">{euro(v.commissioni_pagate)} al mese</span>
                </div>
              )}
              {v.turisti != null && (
                <div className="lm-row">
                  <span className="lm-muted">Turisti</span>
                  <span className="lm-row-v">{v.turisti ? 'Sì' : 'No'}</span>
                </div>
              )}
            </div>

            {v.problemi_dichiarati && <p className="lm-sub">{v.problemi_dichiarati}</p>}
            {v.trascrizione_vocale && (
              <p className="lm-sub lm-dictated">{v.trascrizione_vocale}</p>
            )}

            {scatti.length > 0 && (
              <div className="lm-shots" style={{ marginTop: '0.9rem' }}>
                {scatti.map((url) => (
                  /* URL firmati che scadono in un'ora: passarli per
                     l'ottimizzatore di next/image vorrebbe dire una cache di
                     immagini che muoiono prima di essere riusate. */
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <span key={url} className="lm-shot">
                    <img src={url} alt={`Foto della visita a ${v.cliente}`} loading="lazy" />
                  </span>
                ))}
              </div>
            )}

            {v.lat != null && v.lng != null && (
              <a
                className="lm-pill lm-visit-map"
                data-size="sm"
                href={`https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lng}#map=18/${v.lat}/${v.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin aria-hidden="true" />
                Dov&apos;era
              </a>
            )}
          </article>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * I richiami, in tre mucchi: scaduti, oggi, più avanti.
 *
 * L'ordine è quello dell'urgenza e non della data, che è la stessa cosa solo
 * finché non si è in ritardo. Un follow-up di tre settimane fa in mezzo a
 * quelli di domani si perde.
 */
function Followup({
  daFare,
  fatti,
  oggi,
}: {
  daFare: FollowupVista[]
  fatti: FollowupVista[]
  oggi: string
}) {
  const scaduti = daFare.filter((f) => f.data < oggi)
  const adesso = daFare.filter((f) => f.data === oggi)
  const dopo = daFare.filter((f) => f.data > oggi)

  if (!daFare.length && !fatti.length) {
    return (
      <p className="lm-empty">
        Nessun richiamo in agenda. Si prendono alla fine di una visita, o dalla scheda di un
        cliente.
      </p>
    )
  }

  return (
    <div className="lm-bento">
      <Gruppo titolo="In ritardo" righe={scaduti} span="12" allarme />
      <Gruppo titolo="Oggi" righe={adesso} span="12" />
      <Gruppo titolo="Più avanti" righe={dopo} span="12" />
      <Gruppo titolo="Chiusi di recente" righe={fatti} span="12" chiusi />
    </div>
  )
}

function Gruppo({
  titolo,
  righe,
  span,
  allarme,
  chiusi,
}: {
  titolo: string
  righe: FollowupVista[]
  span: string
  allarme?: boolean
  chiusi?: boolean
}) {
  if (!righe.length) return null

  return (
    <article className="lm-card" data-span={span} data-glow={allarme ? true : undefined}>
      <div className="lm-card-top">
        <span className="lm-label">{titolo}</span>
        <span className="lm-pill-n">{righe.length}</span>
      </div>
      <div className="lm-rows">
        {righe.map((f) => (
          <RigaFollowup key={f.id} riga={f} chiuso={Boolean(chiusi)} />
        ))}
      </div>
    </article>
  )
}

/**
 * Una riga di richiamo, con le sue azioni.
 *
 * Sparisce dalla lista appena la si tocca, prima che il server risponda: chi
 * chiude sei follow-up in fila non deve aspettarne uno per volta. Se la
 * scrittura fallisce, il `refresh()` la rimette dov'era e l'errore si legge
 * sotto — ottimista, non cieca.
 */
function RigaFollowup({ riga, chiuso }: { riga: FollowupVista; chiuso: boolean }) {
  const router = useRouter()
  const [inCorso, avvia] = useTransition()
  const [sparita, setSparita] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const q = quando(riga.data)

  function agisci(azione: 'fatto' | 'riapri' | 'rimanda', giorni = 0) {
    setSparita(true)
    setErrore(null)
    avvia(async () => {
      const esito = await aggiornaFollowup(riga.id, azione, giorni)
      if (!esito.ok) {
        setSparita(false)
        setErrore(esito.error ?? 'Non è stato possibile aggiornare il richiamo.')
        return
      }
      router.refresh()
    })
  }

  if (sparita && !errore) return null

  return (
    <div className="lm-row lm-follow" data-busy={inCorso}>
      <span className="lm-follow-who">
        <Link href={`/staff/clienti/${riga.client_id}`}>{riga.cliente}</Link>
        {riga.nota && <span className="lm-row-note">{riga.nota}</span>}
        {errore && (
          <span className="lm-row-note lm-error" role="alert">
            {errore}
          </span>
        )}
      </span>

      <span className="lm-follow-do">
        <span className="lm-when" data-late={q.tardi}>
          {q.testo}
        </span>

        {riga.telefono && (
          <a
            className="lm-icon-btn"
            href={`tel:${riga.telefono.replace(/\s/g, '')}`}
            aria-label={`Chiama ${riga.cliente}`}
          >
            <Phone aria-hidden="true" />
          </a>
        )}

        {chiuso ? (
          <button
            type="button"
            className="lm-pill"
            data-size="sm"
            onClick={() => agisci('riapri')}
            disabled={inCorso}
          >
            <RotateCcw aria-hidden="true" />
            Riapri
          </button>
        ) : (
          <>
            <button
              type="button"
              className="lm-pill"
              data-size="sm"
              onClick={() => agisci('rimanda', 3)}
              disabled={inCorso}
            >
              +3g
            </button>
            <button
              type="button"
              className="lm-pill"
              data-size="sm"
              onClick={() => agisci('rimanda', 7)}
              disabled={inCorso}
            >
              +7g
            </button>
            <button
              type="button"
              className="lm-pill"
              data-size="sm"
              data-on="true"
              onClick={() => agisci('fatto')}
              disabled={inCorso}
            >
              <Check aria-hidden="true" />
              Fatto
            </button>
          </>
        )}
      </span>
    </div>
  )
}
