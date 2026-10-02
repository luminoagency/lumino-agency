'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, KeyRound, ShieldCheck, SlidersHorizontal, Trash2, UserMinus } from 'lucide-react'
import {
  aggiornaPermessi,
  cambiaLivello,
  impostaAccesso,
  reimpostaPassword,
  rimuoviMembro,
} from '@/lib/staff/azioni-team'
import { PERMESSI, PERMESSO_LABEL, PERMESSO_SPIEGA, type Permesso } from '@/lib/staff/permessi'
import type { MembroTeam } from '@/lib/staff/f5'
import type { StaffRole } from '@/lib/staff/types'
import { Segmented, Toggle } from './Controls'
import Modal from './Modal'

/**
 * Quello che il titolare può fare a un membro, in una finestra.
 *
 * ## Perché tutto in una modale e non quattro bottoni sulla card
 *
 * Le quattro azioni — permessi, livello, password, sospensione, rimozione —
 * hanno in comune una cosa sola: si fanno **pensando a una persona**. Quattro
 * bottoni sparsi su una card li si preme guardando l'elenco, cioè nel momento
 * in cui si sta confrontando la squadra e non decidendo di qualcuno. La modale
 * porta il nome in testa e un contesto solo, che è il modo giusto di togliere
 * a un collega l'accesso agli incassi.
 *
 * ## Niente si salva per sbaglio, e niente si salva in silenzio
 *
 * I permessi partono al click dell'interruttore — sono reversibili con lo
 * stesso gesto, e un «Salva» in fondo a sei interruttori è un modo di
 * dimenticarsene uno. Tutto il resto no: la password vuole il campo pieno, la
 * rimozione vuole il nome riscritto. L'interruttore si rimette da sé se il
 * server rifiuta: lo stato ottimista senza rollback è il modo più rapido di
 * credere di aver tolto un permesso che è ancora acceso.
 *
 * Il bottone che apre tutto questo lo disegna la pagina Team solo per l'owner.
 * Non è il controllo: ognuna delle cinque azioni rifà la domanda sul server,
 * prima di guardare qualunque dato.
 */
export default function GestioneMembro({ m }: { m: MembroTeam }) {
  const [aperto, setAperto] = useState(false)

  return (
    <>
      <button
        type="button"
        className="lm-pill"
        onClick={() => setAperto(true)}
        aria-label={`Gestisci ${m.nome}`}
      >
        <SlidersHorizontal aria-hidden="true" />
        Gestisci
      </button>
      {aperto && <Pannello m={m} chiudi={() => setAperto(false)} />}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function Pannello({ m, chiudi }: { m: MembroTeam; chiudi: () => void }) {
  const router = useRouter()
  const [permessi, setPermessi] = useState(m.permessi)
  const [livello, setLivello] = useState<StaffRole>(m.role)
  const [attivo, setAttivo] = useState(m.attivo)
  const [pwd, setPwd] = useState('')
  const [mostraPwd, setMostraPwd] = useState(false)
  const [conferma, setConferma] = useState('')
  const [nota, setNota] = useState<string | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  const nomeCombacia = conferma.trim().toLowerCase() === m.nome.trim().toLowerCase()

  function esegui(azione: () => Promise<{ ok: boolean; error?: string }>, riuscito: string) {
    setErrore(null)
    setNota(null)
    avvia(async () => {
      const esito = await azione()
      if (!esito.ok) {
        setErrore(esito.error ?? 'Non è andata. Riprova.')
        return
      }
      /* `ok` con un messaggio vuol dire «fatto, ma qualcosa a metà»: lo dice la
         sospensione quando il profilo si chiude e la sessione Supabase no. */
      setNota(esito.error ?? riuscito)
      router.refresh()
    })
  }

  function giraPermesso(p: Permesso, valore: boolean) {
    const prima = permessi
    setPermessi({ ...permessi, [p]: valore })
    setErrore(null)
    setNota(null)
    avvia(async () => {
      const esito = await aggiornaPermessi(m.id, { [p]: valore })
      if (!esito.ok) {
        setPermessi(prima)
        setErrore(esito.error ?? 'Il permesso non è cambiato.')
        return
      }
      setNota(
        `${PERMESSO_LABEL[p]}: ${valore ? 'acceso' : 'spento'} per ${m.nome.split(/\s+/)[0]}.`,
      )
      router.refresh()
    })
  }

  return (
    <Modal
      title={`Gestisci ${m.nome}`}
      onClose={chiudi}
      head={
        <>
          <span className="lm-label">la squadra</span>
          <h2>{m.nome}</h2>
        </>
      }
    >
      <div className="lm-modal-form">
        <div className="lm-modal-corpo">
          {/* ── I permessi ─────────────────────────────────────────────────── */}
          <section className="lm-gm-sezione">
            <h3 className="lm-label">cosa vede e cosa può fare</h3>
            <p className="lm-field-hint">
              Si applicano subito, e non solo a quello che si vede: un permesso spento è una riga
              che il database non manda più, nemmeno a chi la chiedesse per conto suo.
            </p>
            <ul className="lm-gm-permessi">
              {PERMESSI.map((p) => (
                <li key={p}>
                  <Toggle
                    label={PERMESSO_LABEL[p]}
                    checked={permessi[p]}
                    disabled={inCorso}
                    onChange={(v) => giraPermesso(p, v)}
                  />
                  <small>{PERMESSO_SPIEGA[p]}</small>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Il livello ─────────────────────────────────────────────────── */}
          <section className="lm-gm-sezione">
            <h3 className="lm-label">livello di accesso</h3>
            <Segmented
              label="Livello"
              value={livello === 'owner' ? 'admin' : livello}
              options={[
                { value: 'sales', label: 'Venditore' },
                { value: 'admin', label: 'Amministratore' },
              ]}
              onChange={(v) => {
                setLivello(v as StaffRole)
                esegui(
                  () => cambiaLivello(m.id, v as StaffRole),
                  v === 'admin'
                    ? 'Ora vede il lavoro di tutti.'
                    : 'Ora vede soltanto i propri clienti.',
                )
              }}
            />
            <p className="lm-field-hint">
              Venditore vede i suoi clienti, amministratore quelli di tutti. Titolare non è fra le
              scelte: si assegna a mano, perché un pannello che può creare un secondo titolare può
              regalare se stesso.
            </p>
          </section>

          {/* ── La password ────────────────────────────────────────────────── */}
          <section className="lm-gm-sezione">
            <h3 className="lm-label">
              <KeyRound aria-hidden="true" /> password
            </h3>
            <div className="lm-field">
              <label htmlFor={`gm-pwd-${m.id}`}>Nuova password iniziale</label>
              <div className="lm-campo-pwd">
                <input
                  id={`gm-pwd-${m.id}`}
                  type={mostraPwd ? 'text' : 'password'}
                  value={pwd}
                  minLength={8}
                  autoComplete="new-password"
                  onChange={(e) => setPwd(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMostraPwd((v) => !v)}
                  aria-label={mostraPwd ? 'Nascondi la password' : 'Mostra la password'}
                >
                  {mostraPwd ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
              <p className="lm-field-hint">
                Almeno otto caratteri, e gliela dici a voce: non parte nessuna email di recupero,
                perché un link di reset arriva nella casella che potrebbe aver perso.
              </p>
            </div>
            <button
              type="button"
              className="lm-btn"
              data-variant="ghost"
              disabled={inCorso || pwd.length < 8}
              onClick={() =>
                esegui(async () => {
                  const esito = await reimpostaPassword(m.id, pwd)
                  if (esito.ok) setPwd('')
                  return esito
                }, 'Password cambiata. Ora gliela dici.')
              }
            >
              <ShieldCheck aria-hidden="true" /> Reimposta la password
            </button>
          </section>

          {/* ── L'accesso ──────────────────────────────────────────────────── */}
          <section className="lm-gm-sezione">
            <h3 className="lm-label">accesso all’area</h3>
            <p className="lm-field-hint">
              {attivo
                ? 'Sospendere chiude /staff e revoca la sessione: nessun dato si perde e si riammette con un click.'
                : 'Sospeso: non entra e non legge niente. I suoi clienti sono rimasti dove sono.'}
            </p>
            <button
              type="button"
              className="lm-pill"
              data-variant={attivo ? 'danger' : undefined}
              disabled={inCorso}
              onClick={() => {
                const verso = !attivo
                setAttivo(verso)
                esegui(async () => {
                  const esito = await impostaAccesso(m.id, verso)
                  if (!esito.ok) setAttivo(!verso)
                  return esito
                }, verso ? 'Riammesso: può entrare.' : 'Sospeso: non entra più.')
              }}
            >
              <UserMinus aria-hidden="true" />
              {attivo ? 'Sospendi l’accesso' : 'Riammetti'}
            </button>
          </section>

          {/* ── Fuori dalla squadra ────────────────────────────────────────── */}
          <section className="lm-gm-sezione" data-tono="rosso">
            <h3 className="lm-label">fuori dalla squadra</h3>
            <p className="lm-sub">
              L’account se ne va e l’email si libera. {m.clienti > 0 ? (
                <>
                  I suoi <b>{m.clienti}</b> client{m.clienti === 1 ? 'e' : 'i'} restano, ma{' '}
                  <b>non assegnati a nessuno</b>: vanno ridati a qualcuno, altrimenti li vede solo
                  un amministratore.
                </>
              ) : (
                'Non ha clienti in carico, quindi non resta niente da riassegnare.'
              )}{' '}
              Attività e visite restano nello storico senza il suo nome.
            </p>
            <div className="lm-field">
              <label htmlFor={`gm-conf-${m.id}`}>
                Riscrivi <b>{m.nome}</b> per confermare
              </label>
              <input
                id={`gm-conf-${m.id}`}
                value={conferma}
                autoComplete="off"
                autoCapitalize="none"
                onChange={(e) => setConferma(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="lm-btn"
              data-variant="danger"
              disabled={inCorso || !nomeCombacia}
              onClick={() =>
                esegui(async () => {
                  const esito = await rimuoviMembro(m.id)
                  if (esito.ok) chiudi()
                  return esito
                }, 'Rimosso dalla squadra.')
              }
            >
              <Trash2 aria-hidden="true" /> Rimuovi dalla squadra
            </button>
          </section>

          {errore && (
            <p className="lm-error" role="alert">
              {errore}
            </p>
          )}
          {nota && !errore && (
            <p className="lm-avviso" role="status">
              {nota}
            </p>
          )}
        </div>

        <div className="lm-modal-actions">
          <button type="button" className="lm-btn" data-variant="ghost" onClick={chiudi}>
            Chiudi
          </button>
        </div>
      </div>
    </Modal>
  )
}
