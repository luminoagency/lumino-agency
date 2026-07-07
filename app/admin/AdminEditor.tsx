'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { publishSite, unpublishSite } from './actions/site'

/**
 * Panoramica del pannello (restyle STEP 2): non più uno scroll di form, ma un
 * cruscotto — stato del sito + azioni pubblica/offline + scorciatoie alle
 * sezioni (i cui contenuti vivono ora nelle sotto-route dedicate).
 */

interface Props {
  site: { slug: string; tier: string; status: string }
}

type Shortcut = { label: string; href: string; sub: string; pro?: boolean }

const SHORTCUTS: Shortcut[] = [
  { label: 'Identità & storia', href: '/admin/identita', sub: 'Nome, tagline, descrizione' },
  { label: 'Menu', href: '/admin/menu', sub: 'Categorie e piatti' },
  { label: 'Lo chef', href: '/admin/chef', sub: 'Foto e frase dello chef', pro: true },
  { label: 'Eventi', href: '/admin/events', sub: 'Serate ed eventi speciali', pro: true },
  { label: 'Gallery', href: '/admin/gallery-admin', sub: 'Foto in evidenza' },
  { label: 'Pagine', href: '/admin/pagine', sub: 'Attiva e rinomina le pagine', pro: true },
  { label: 'Funzionalità', href: '/admin/funzionalita', sub: 'Sezioni attive del sito' },
  { label: 'Contatti & orari', href: '/admin/contatti', sub: 'Recapiti e apertura' },
  { label: 'Prenotazioni', href: '/admin/prenotazioni', sub: 'Richieste dei clienti', pro: true },
]

export function AdminEditor({ site }: Props) {
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg?: string } | null>(null)
  const [status, setStatus] = useState(site.status)
  const isLive = status === 'live'
  const isBasic = site.tier === 'basic'

  function togglePublish() {
    setFeedback(null)
    startTransition(async () => {
      const r = isLive ? await unpublishSite() : await publishSite()
      if (r.ok) {
        setStatus(isLive ? 'building' : 'live')
        setFeedback({ ok: true, msg: isLive ? '✓ Sito nascosto' : '✓ Sito pubblicato' })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ ok: false, msg: r.error || 'Errore' })
      }
    })
  }

  const publicUrl = `/sites/${site.slug}`

  return (
    <div className="ac-wrap">
      <div className="ac-head">
        <h1 className="ac-title">Panoramica</h1>
        <p className="ac-sub">Lo stato del tuo sito e le scorciatoie per gestirlo.</p>
      </div>

      <div className={`ae-status ${isLive ? 'live' : 'off'}`}>
        <div className="ae-status-left">
          <p className="ae-status-pill"><span className="ae-status-dot" />{isLive ? 'Sito pubblicato' : 'In costruzione'}</p>
          <h2 className="ae-status-title">Il tuo sito</h2>
          <p className="ae-status-meta">URL: <code>/sites/{site.slug}</code> · piano <b>{site.tier}</b></p>
        </div>
        <div className="ae-status-actions">
          {isLive && <Link href={publicUrl} target="_blank" className="ae-btn ae-btn-ghost">Vedi il sito ↗</Link>}
          <button type="button" onClick={togglePublish} disabled={pending} className={`ae-btn ${isLive ? 'ae-btn-danger' : 'ae-btn-success'}`}>
            {isLive ? 'Metti offline' : 'Pubblica sito'}
          </button>
        </div>
      </div>

      <div className="ac-grid">
        {SHORTCUTS.map(s => {
          const locked = s.pro && isBasic
          if (locked) {
            return (
              <Link key={s.href} href="/pricing" className="ac-card locked" title="Incluso nei piani Pro e Premium">
                <span className="ac-card-title">{s.label}<span className="ac-card-lock">🔒</span></span>
                <span className="ac-card-sub">{s.sub}</span>
              </Link>
            )
          }
          return (
            <Link key={s.href} href={s.href} className="ac-card">
              <span className="ac-card-title">{s.label}</span>
              <span className="ac-card-sub">{s.sub}</span>
            </Link>
          )
        })}
      </div>

      {feedback && (
        <div className="ae-savebar">
          <span className={`ae-feedback ${feedback.ok ? 'ae-feedback-ok' : 'ae-feedback-err'}`}>{feedback.msg}</span>
        </div>
      )}
    </div>
  )
}
