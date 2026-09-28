'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { creaCliente, type NuovoCliente } from '@/lib/staff/actions'
import {
  SETTORE_LABEL,
  SETTORI,
  SITI,
  SITO_LABEL,
  STATI,
  STATO_LABEL,
} from '@/lib/staff/types'

/**
 * Il modulo del nuovo cliente.
 *
 * Un solo campo è obbligatorio — il nome. Tutto il resto si scopre parlando,
 * e un modulo che pretende città, telefono ed email prima di poter salvare è
 * un modulo che, in piedi davanti a un bar, non si compila: si rimanda, e il
 * cliente non entra mai in pipeline.
 *
 * `assegnato_a` compare solo all'admin: un venditore può creare clienti solo
 * intestati a sé (lo impone la policy di insert), quindi mostrargli un menù di
 * colleghi vorrebbe dire offrirgli una scelta che il database annulla.
 */
export default function NuovoClienteForm({
  venditori,
  isAdmin,
  ioId,
}: {
  venditori: { id: string; nome: string }[]
  isAdmin: boolean
  ioId: string
}) {
  const router = useRouter()
  const [dati, setDati] = useState<NuovoCliente>({
    nome: '',
    settore: 'ristorante',
    stato: 'da_contattare',
    assegnato_a: ioId,
  })
  const [errore, setErrore] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (key: keyof NuovoCliente) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDati((d) => ({ ...d, [key]: event.target.value }))

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setErrore(null)

    const esito = await creaCliente(dati)
    if (!esito.ok) {
      setErrore(esito.error ?? 'Non è stato possibile salvare il cliente.')
      setBusy(false)
      return
    }

    /* refresh() prima di push(): la pipeline è un Server Component e senza
       questo tornerebbe dalla cache del router, cioè senza il cliente appena
       creato. */
    router.refresh()
    router.push(esito.id ? `/staff/clienti/${esito.id}` : '/staff/clienti')
  }

  return (
    <form className="lm-card" onSubmit={onSubmit} style={{ maxWidth: '760px' }}>
      <div className="lm-form" data-cols="2">
        <div className="lm-field" data-wide="true">
          <label htmlFor="nome">Nome del locale</label>
          <input
            id="nome"
            value={dati.nome}
            onChange={set('nome')}
            required
            autoFocus
            placeholder="Trattoria da Gigi"
          />
        </div>

        <div className="lm-field">
          <label htmlFor="settore">Settore</label>
          <select id="settore" value={dati.settore} onChange={set('settore')}>
            {SETTORI.map((s) => (
              <option key={s} value={s}>
                {SETTORE_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="lm-field">
          <label htmlFor="stato">Stato</label>
          <select id="stato" value={dati.stato} onChange={set('stato')}>
            {STATI.filter((s) => s !== 'rifiutato').map((s) => (
              <option key={s} value={s}>
                {STATO_LABEL[s]}
              </option>
            ))}
          </select>
          <p className="lm-field-hint">
            Un cliente non nasce rifiutato: il rifiuto si registra spostandolo, col motivo.
          </p>
        </div>

        <div className="lm-field">
          <label htmlFor="citta">Città</label>
          <input id="citta" value={dati.citta ?? ''} onChange={set('citta')} placeholder="Jesolo" />
        </div>

        <div className="lm-field">
          <label htmlFor="zona">Zona</label>
          <input
            id="zona"
            value={dati.zona ?? ''}
            onChange={set('zona')}
            placeholder="Lido est, centro…"
          />
        </div>

        <div className="lm-field" data-wide="true">
          <label htmlFor="indirizzo">Indirizzo</label>
          <input id="indirizzo" value={dati.indirizzo ?? ''} onChange={set('indirizzo')} />
        </div>

        <div className="lm-field">
          <label htmlFor="referente">Referente</label>
          <input
            id="referente"
            value={dati.referente ?? ''}
            onChange={set('referente')}
            placeholder="Chi decide"
          />
        </div>

        <div className="lm-field">
          <label htmlFor="telefono">Telefono</label>
          <input
            id="telefono"
            type="tel"
            value={dati.telefono ?? ''}
            onChange={set('telefono')}
            inputMode="tel"
          />
        </div>

        <div className="lm-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={dati.email ?? ''} onChange={set('email')} />
        </div>

        <div className="lm-field">
          <label htmlFor="instagram">Instagram</label>
          <input
            id="instagram"
            value={dati.instagram ?? ''}
            onChange={set('instagram')}
            placeholder="@nomelocale"
          />
        </div>

        <div className="lm-field">
          <label htmlFor="sito">Sito attuale</label>
          <select id="sito" value={dati.sito_attuale ?? ''} onChange={set('sito_attuale')}>
            <option value="">Non so</option>
            {SITI.map((s) => (
              <option key={s} value={s}>
                {SITO_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="lm-field">
          <label htmlFor="prezzo">Prezzo consigliato</label>
          <input
            id="prezzo"
            type="number"
            min="0"
            step="50"
            value={dati.prezzo_consigliato ?? ''}
            onChange={set('prezzo_consigliato')}
            placeholder="1200"
          />
        </div>

        {isAdmin && (
          <div className="lm-field">
            <label htmlFor="assegnato">Assegnato a</label>
            <select id="assegnato" value={dati.assegnato_a ?? ioId} onChange={set('assegnato_a')}>
              {venditori.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="lm-field" data-wide="true">
          <label htmlFor="note">Note sul sito attuale</label>
          <textarea
            id="note"
            value={dati.note_sito ?? ''}
            onChange={set('note_sito')}
            placeholder="Cosa non va, cosa gli serve, cosa ha detto."
          />
        </div>
      </div>

      {errore && (
        <p className="lm-error" role="alert" style={{ marginTop: '1rem' }}>
          {errore}
        </p>
      )}

      <div className="lm-modal-actions">
        <button
          type="button"
          className="lm-btn"
          data-variant="ghost"
          onClick={() => router.back()}
        >
          Annulla
        </button>
        <button type="submit" className="lm-btn" disabled={busy || !dati.nome.trim()}>
          {busy ? 'Salvo…' : 'Salva cliente'}
        </button>
      </div>
    </form>
  )
}
