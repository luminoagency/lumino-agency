'use client'

import { useMemo, useState, useTransition } from 'react'
import { markEmailManuallySent, markReplyManuallySent } from '../actions'
import type { WarmupInfo } from '@/lib/warmup'

export interface QueueEmail {
  id: string
  restaurantName: string
  city: string | null
  to: string
  sender: string
  hook: string
  subject: string
  body: string
  step: string
}

export interface ReplyRow {
  id: string
  restaurantName: string
  city: string | null
  fromEmail: string
  sender: string
  classification: string
  receivedBody: string
  replySubject: string
  replyBody: string
  replyStatus: string
}

const CLASSIFICATION_LABEL: Record<string, string> = {
  interested: 'Interessato',
  question: 'Domanda',
  not_interested: 'Non interessato',
  out_of_target: 'Fuori target',
  ambiguous: 'Ambiguo',
}

interface Props {
  emails: QueueEmail[]
  replies: ReplyRow[]
  blacklisted: ReplyRow[]
  /** Sezione 2 "Risposte" (Gruppo Q / OAuth Gmail) — disattivata, riattivare in FASE 2. */
  showReplies: boolean
  warmup: WarmupInfo
  sentToday: number
  backLink: React.ReactNode
}

function gmailComposeUrl(to: string, subject: string, body: string): string {
  return (
    'https://mail.google.com/mail/?view=cm&fs=1' +
    `&to=${encodeURIComponent(to)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  )
}

export function OutreachQueueClient({ emails, replies, blacklisted, showReplies, warmup, sentToday, backLink }: Props) {
  const [items, setItems] = useState<QueueEmail[]>(emails)
  const [replyItems, setReplyItems] = useState<ReplyRow[]>(replies)
  const [modal, setModal] = useState<QueueEmail | null>(null)
  const [replyModal, setReplyModal] = useState<ReplyRow | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg: string } | null>(null)

  const limitReached = sentToday >= warmup.dailyLimit
  const pct = useMemo(
    () => Math.min(100, Math.round((sentToday / Math.max(1, warmup.dailyLimit)) * 100)),
    [sentToday, warmup.dailyLimit],
  )

  function notify(ok: boolean, msg: string) {
    setFeedback({ ok, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  function copyText(e: QueueEmail) {
    const text = `${e.subject}\n\n${e.body}`
    navigator.clipboard.writeText(text).then(
      () => { setCopiedId(e.id); setTimeout(() => setCopiedId(null), 1500) },
      () => notify(false, 'Copia non riuscita'),
    )
  }

  function markSent(id: string) {
    startTransition(async () => {
      const r = await markEmailManuallySent(id)
      if (r.ok) {
        setItems((prev) => prev.filter((x) => x.id !== id))
        if (modal?.id === id) setModal(null)
        notify(true, '✓ Marcata come inviata')
      } else {
        notify(false, `Errore: ${r.error}`)
      }
    })
  }

  function copyReply(r: ReplyRow) {
    const text = `${r.replySubject}\n\n${r.replyBody}`
    navigator.clipboard.writeText(text).then(
      () => { setCopiedId(r.id); setTimeout(() => setCopiedId(null), 1500) },
      () => notify(false, 'Copia non riuscita'),
    )
  }

  function markReplySent(id: string) {
    startTransition(async () => {
      const res = await markReplyManuallySent(id)
      if (res.ok) {
        setReplyItems((prev) => prev.filter((x) => x.id !== id))
        if (replyModal?.id === id) setReplyModal(null)
        notify(true, '✓ Risposta marcata come inviata')
      } else {
        notify(false, `Errore: ${res.error}`)
      }
    })
  }

  return (
    <div className="oq-root">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; }
        .oq-root { min-height: 100vh; background: #050505; color: #fff; font-family: 'Inter', system-ui, sans-serif; padding: 28px 22px 80px; }
        .oq-wrap { max-width: 1200px; margin: 0 auto; }
        .oq-back { color: rgba(255,255,255,0.55); text-decoration: none; font-size: 12px; }
        .oq-back:hover { color: #fff; }
        .oq-title { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 34px; font-weight: 500; margin: 12px 0 4px; }
        .oq-counter { color: rgba(255,255,255,0.6); font-size: 14px; margin: 0 0 4px; }
        .oq-warmnote { color: rgba(255,255,255,0.4); font-size: 12px; margin: 0 0 18px; }
        .oq-warm { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px 18px; margin-bottom: 18px; }
        .oq-warm-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: 10px; }
        .oq-bar { height: 8px; background: rgba(255,255,255,0.08); border-radius: 9999px; overflow: hidden; }
        .oq-bar-fill { height: 100%; border-radius: 9999px; background: linear-gradient(90deg, #22c55e, #16a34a); transition: width 0.3s; }
        .oq-bar-fill.over { background: linear-gradient(90deg, #f59e0b, #ef4444); }
        .oq-limit { margin-top: 14px; padding: 12px 16px; border-radius: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; font-size: 13px; }
        .oq-table-wrap { border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 12px 14px; color: rgba(255,255,255,0.45); font-weight: 600; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap; }
        td { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: top; }
        tr:last-child td { border-bottom: 0; }
        .oq-loc { color: #fff; font-weight: 600; }
        .oq-city { color: rgba(255,255,255,0.4); font-size: 11px; }
        .oq-sub { color: rgba(255,255,255,0.7); max-width: 280px; }
        .oq-empty { padding: 40px; text-align: center; color: rgba(255,255,255,0.4); }
        .oq-actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .oq-btn { padding: 6px 11px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.85); border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; text-decoration: none; display: inline-flex; align-items: center; transition: background 0.2s; }
        .oq-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); color: #fff; }
        .oq-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .oq-btn-go { color: #22c55e; border-color: rgba(34,197,94,0.3); }
        .oq-btn-go:hover:not(:disabled) { background: rgba(34,197,94,0.1); }
        .oq-modal-bg { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .oq-modal { width: 100%; max-width: 640px; max-height: calc(100vh - 40px); overflow-y: auto; background: #111113; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; }
        .oq-modal h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 24px; font-weight: 500; margin: 0 0 6px; }
        .oq-modal-meta { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 16px; }
        .oq-modal-meta strong { color: #fff; }
        .oq-modal-body { white-space: pre-wrap; font-size: 13.5px; line-height: 1.6; color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px; }
        .oq-modal-foot { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
        .oq-toast { position: fixed; top: 18px; left: 50%; transform: translateX(-50%); padding: 11px 18px; border-radius: 9999px; font-size: 13px; font-weight: 600; z-index: 10000; }
        .oq-toast.ok { background: rgba(34,197,94,0.15); color: #22c55e; }
        .oq-toast.err { background: rgba(239,68,68,0.15); color: #f87171; }
        .oq-section-title { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 24px; font-weight: 500; margin: 32px 0 12px; }
        .oq-class { display: inline-block; padding: 3px 9px; border-radius: 9999px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; background: rgba(167,139,250,0.16); color: #c4b5fd; white-space: nowrap; }
        .oq-class.interested { background: rgba(34,197,94,0.16); color: #86efac; }
        .oq-class.not_interested { background: rgba(239,68,68,0.16); color: #fca5a5; }
        .oq-class.out_of_target { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
        .oq-blacklist { border: 1px solid rgba(239,68,68,0.2); border-radius: 14px; padding: 6px 0; }
        .oq-blrow { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; }
        .oq-blrow:last-child { border-bottom: 0; }
      `}</style>

      <div className="oq-wrap">
        {backLink}
        <h1 className="oq-title">Coda email da inviare</h1>
        <p className="oq-counter">{items.length} email pronte da inviare oggi</p>
        <p className="oq-warmnote">
          Settimana attuale: limite {warmup.dailyLimit} email/giorno (vedi WARMUP_TRACKER.md per la progressione)
        </p>

        {/* Indicatore warmup */}
        <div className="oq-warm">
          <div className="oq-warm-row">
            <span>Inviate oggi: <strong>{sentToday}</strong> / {warmup.dailyLimit} — Warmup settimana {warmup.week}</span>
          </div>
          <div className="oq-bar">
            <div className={`oq-bar-fill ${limitReached ? 'over' : ''}`} style={{ width: `${pct}%` }} />
          </div>
          {limitReached && (
            <div className="oq-limit">
              Hai raggiunto il limite di oggi. Domani potrai inviarne fino a {warmup.dailyLimit}.
              Le email restanti restano in coda — meglio non inviarne altre oggi.
            </div>
          )}
        </div>

        {/* ── Sezione 1 — Cold outreach ── */}
        <h2 className="oq-section-title">Cold outreach</h2>
        <div className="oq-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Locale</th><th>Mittente</th><th>Hook</th><th>Subject</th><th>Azione</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={5} className="oq-empty">Nessuna email in coda.</td></tr>
              )}
              {items.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="oq-loc">{e.restaurantName}</div>
                    {e.city && <div className="oq-city">{e.city}</div>}
                  </td>
                  <td>{e.sender}</td>
                  <td>{e.hook}</td>
                  <td className="oq-sub">{e.subject}</td>
                  <td>
                    <div className="oq-actions">
                      <button type="button" className="oq-btn" onClick={() => setModal(e)}>Vedi</button>
                      <button type="button" className="oq-btn" onClick={() => copyText(e)}>
                        {copiedId === e.id ? '✓ Copiato' : 'Copia'}
                      </button>
                      <a
                        className="oq-btn"
                        href={gmailComposeUrl(e.to, e.subject, e.body)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >Apri Gmail</a>
                      <button
                        type="button"
                        className="oq-btn oq-btn-go"
                        disabled={pending}
                        onClick={() => markSent(e.id)}
                      >Marca inviata</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Sezione 2 — Risposte (Gruppo Q, OAuth Gmail) — disattivata, FASE 2 ── */}
        {showReplies && (<>
        <h2 className="oq-section-title">Risposte</h2>
        <div className="oq-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Locale</th><th>Mittente</th><th>Classificazione</th><th>Risposta (oggetto)</th><th>Azione</th>
              </tr>
            </thead>
            <tbody>
              {replyItems.length === 0 && (
                <tr><td colSpan={5} className="oq-empty">Nessuna risposta in coda.</td></tr>
              )}
              {replyItems.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="oq-loc">{r.restaurantName}</div>
                    {r.city && <div className="oq-city">{r.city}</div>}
                    <div className="oq-city">{r.fromEmail}</div>
                  </td>
                  <td>{r.sender}</td>
                  <td><span className={`oq-class ${r.classification}`}>{CLASSIFICATION_LABEL[r.classification] || r.classification}</span></td>
                  <td className="oq-sub">{r.replySubject}</td>
                  <td>
                    <div className="oq-actions">
                      <button type="button" className="oq-btn" onClick={() => setReplyModal(r)}>Vedi</button>
                      <button type="button" className="oq-btn" onClick={() => copyReply(r)}>
                        {copiedId === r.id ? '✓ Copiato' : 'Copia'}
                      </button>
                      <a className="oq-btn" href={gmailComposeUrl(r.fromEmail, r.replySubject, r.replyBody)} target="_blank" rel="noopener noreferrer">Apri Gmail</a>
                      <button type="button" className="oq-btn oq-btn-go" disabled={pending} onClick={() => markReplySent(r.id)}>Marca inviata</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Blacklisted automaticamente (not_interested) — solo conferma visiva */}
        {blacklisted.length > 0 && (
          <>
            <h2 className="oq-section-title">Blacklisted automaticamente</h2>
            <div className="oq-blacklist">
              {blacklisted.map((r) => (
                <div key={r.id} className="oq-blrow">
                  <span className="oq-loc">{r.restaurantName}</span>
                  <span className="oq-city">{r.fromEmail}</span>
                  <span className="oq-class not_interested" style={{ marginLeft: 'auto' }}>Non interessato</span>
                </div>
              ))}
            </div>
          </>
        )}
        </>)}
      </div>

      {/* Modal "Vedi" */}
      {modal && (
        <div className="oq-modal-bg" onClick={() => setModal(null)}>
          <div className="oq-modal" onClick={(ev) => ev.stopPropagation()}>
            <h3>{modal.subject}</h3>
            <p className="oq-modal-meta">
              A: <strong>{modal.to || '—'}</strong> · Mittente: <strong>{modal.sender}</strong> · Hook: {modal.hook}
            </p>
            <div className="oq-modal-body">{modal.body}</div>
            <div className="oq-modal-foot">
              <button type="button" className="oq-btn" onClick={() => copyText(modal)}>
                {copiedId === modal.id ? '✓ Copiato' : 'Copia testo'}
              </button>
              <a
                className="oq-btn"
                href={gmailComposeUrl(modal.to, modal.subject, modal.body)}
                target="_blank"
                rel="noopener noreferrer"
              >Apri Gmail</a>
              <button type="button" className="oq-btn oq-btn-go" disabled={pending} onClick={() => markSent(modal.id)}>
                Marca inviata
              </button>
              <button type="button" className="oq-btn" onClick={() => setModal(null)}>Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal risposta */}
      {replyModal && (
        <div className="oq-modal-bg" onClick={() => setReplyModal(null)}>
          <div className="oq-modal" onClick={(ev) => ev.stopPropagation()}>
            <h3>{replyModal.replySubject}</h3>
            <p className="oq-modal-meta">
              A: <strong>{replyModal.fromEmail || '—'}</strong> · Mittente: <strong>{replyModal.sender}</strong> ·{' '}
              <span className={`oq-class ${replyModal.classification}`}>{CLASSIFICATION_LABEL[replyModal.classification] || replyModal.classification}</span>
            </p>
            <p className="oq-modal-meta" style={{ marginBottom: 6 }}>Messaggio ricevuto dal lead:</p>
            <div className="oq-modal-body" style={{ marginBottom: 14 }}>{replyModal.receivedBody || '—'}</div>
            <p className="oq-modal-meta" style={{ marginBottom: 6 }}>Risposta pronta da inviare:</p>
            <div className="oq-modal-body">{replyModal.replyBody || '—'}</div>
            <div className="oq-modal-foot">
              <button type="button" className="oq-btn" onClick={() => copyReply(replyModal)}>
                {copiedId === replyModal.id ? '✓ Copiato' : 'Copia testo'}
              </button>
              <a className="oq-btn" href={gmailComposeUrl(replyModal.fromEmail, replyModal.replySubject, replyModal.replyBody)} target="_blank" rel="noopener noreferrer">Apri Gmail</a>
              <button type="button" className="oq-btn oq-btn-go" disabled={pending} onClick={() => markReplySent(replyModal.id)}>Marca inviata</button>
              <button type="button" className="oq-btn" onClick={() => setReplyModal(null)}>Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {feedback && <div className={`oq-toast ${feedback.ok ? 'ok' : 'err'}`}>{feedback.msg}</div>}
    </div>
  )
}
