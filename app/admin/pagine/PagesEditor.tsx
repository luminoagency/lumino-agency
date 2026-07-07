'use client'

import { useState, useTransition } from 'react'
import { saveSitePages } from '../actions/site'
import { PAGE_KEYS, PAGE_DEFAULT_LABELS, type PageKey, type SitePages } from '@/lib/sites/pages'
import { AdminSectionHead } from '../AdminSectionHead'

/**
 * Editor delle pagine del sito (Pro/Premium). Il ristoratore attiva/disattiva
 * ogni pagina e ne rinomina la voce di navigazione. Home è sempre attiva.
 *
 * Le label inserite valgono per la lingua italiana del sito. La gestione delle
 * label in inglese (siti bilingui) è rimandata a una fase futura: per ora l'EN
 * resta sui default di PAGE_DEFAULT_LABELS.en.
 */

const DEF = PAGE_DEFAULT_LABELS.it

interface Props {
  initial: SitePages
  siteSlug: string
}

export function PagesEditor({ initial, siteSlug }: Props) {
  // enabled + label separati: label = testo personalizzato ('' → usa il default).
  const [enabled, setEnabled] = useState<Record<PageKey, boolean>>(() => {
    const o = {} as Record<PageKey, boolean>
    for (const k of PAGE_KEYS) o[k] = k === 'home' ? true : !!initial[k]?.enabled
    return o
  })
  const [labels, setLabels] = useState<Record<PageKey, string>>(() => {
    const o = {} as Record<PageKey, string>
    for (const k of PAGE_KEYS) {
      const l = initial[k]?.label ?? ''
      o[k] = l === DEF[k] ? '' : l // se coincide col default, input vuoto (placeholder)
    }
    return o
  })

  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg?: string } | null>(null)

  function toggle(k: PageKey) {
    if (k === 'home') return // sempre attiva
    setFeedback(null)
    setEnabled(prev => ({ ...prev, [k]: !prev[k] }))
  }
  function rename(k: PageKey, v: string) {
    setFeedback(null)
    setLabels(prev => ({ ...prev, [k]: v }))
  }

  function effectiveLabel(k: PageKey): string {
    return labels[k].trim() || DEF[k]
  }

  function save() {
    setFeedback(null)
    const payload = {} as SitePages
    for (const k of PAGE_KEYS) {
      payload[k] = { enabled: k === 'home' ? true : enabled[k], label: effectiveLabel(k) }
    }
    startTransition(async () => {
      const r = await saveSitePages(payload)
      if (r.ok) {
        setFeedback({ ok: true, msg: '✓ Pagine salvate' })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ ok: false, msg: r.error || 'Errore' })
      }
    })
  }

  return (
    <div className="pg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; }
        .pg-root { min-height: 100vh; background: #050505; color: #fff; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .pg-top { padding:18px 24px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; background:rgba(10,10,10,0.7); backdrop-filter:blur(20px); position:sticky; top:0; z-index:10; }
        .pg-back { color:rgba(255,255,255,0.6); text-decoration:none; font-size:13px; margin-right: 14px; }
        .pg-back:hover { color:#fff; }
        .pg-title-bar { font-family:'Cormorant Garamond', Georgia, serif; font-size:22px; font-style:italic; }
        .pg-wrap { max-width: 760px; margin: 0 auto; padding: 28px 22px; }
        .pg-hint { color: rgba(255,255,255,0.55); font-size: 13.5px; line-height: 1.55; margin: 0 0 22px; }
        .pg-card { background:rgba(20,20,22,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:18px 20px; margin-bottom: 14px; transition: border-color 0.2s, background 0.2s; }
        .pg-card.on { border-color: rgba(34,197,94,0.22); background: rgba(34,197,94,0.035); }
        .pg-card.off { opacity: 0.72; }
        .pg-head { display:flex; align-items:center; gap:14px; }
        .pg-meta { flex:1; min-width:0; }
        .pg-name { margin:0; font-size:15px; font-weight:600; color:#fff; }
        .pg-preview { margin:3px 0 0; font-size:12.5px; color:rgba(255,255,255,0.5); }
        .pg-preview strong { color:#fff; font-weight:600; }
        .pg-always { font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.45); white-space:nowrap; }
        .pg-toggle { width:46px; height:26px; border-radius:9999px; background:rgba(255,255,255,0.1); border:0; position:relative; cursor:pointer; transition:background 0.2s; padding:0; flex-shrink:0; }
        .pg-toggle:disabled { cursor:default; }
        .pg-toggle.on { background:#22c55e; }
        .pg-toggle.on:disabled { background:rgba(34,197,94,0.45); }
        .pg-knob { display:block; width:20px; height:20px; border-radius:50%; background:#fff; position:absolute; top:3px; left:3px; transition:left 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.3); }
        .pg-toggle.on .pg-knob { left:23px; }
        .pg-rename { margin-top:14px; display:flex; flex-direction:column; gap:6px; }
        .pg-rename-label { font-size:11px; font-weight:600; color:rgba(255,255,255,0.5); letter-spacing:0.04em; }
        .pg-in { width:100%; padding:11px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:#fff; font-size:14.5px; font-family:inherit; outline:none; transition:border-color 0.2s, background 0.2s; }
        .pg-in:focus { border-color: rgba(229,45,29,0.45); background:rgba(255,255,255,0.06); }
        .pg-in:disabled { opacity:0.4; }
        .pg-savebar { position:fixed; bottom:18px; left:50%; transform:translateX(-50%); padding:12px 16px; background:rgba(10,10,10,0.95); backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.1); border-radius:100px; box-shadow:0 16px 48px rgba(0,0,0,0.6); display:flex; align-items:center; gap:14px; z-index: 50; }
        .pg-save { padding:11px 22px; border:0; border-radius:100px; background:linear-gradient(135deg, #e52d1d, #c9241a); color:#fff; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; font-family:inherit; }
        .pg-save:disabled { opacity:0.5; cursor:not-allowed; }
        .pg-fb { font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 100px; }
        .pg-fb-ok { background: rgba(34,197,94,0.15); color: #22c55e; }
        .pg-fb-err { background: rgba(239,68,68,0.15); color: #f87171; }
      `}</style>

      <div className="pg-wrap">
        <AdminSectionHead title="Pagine del sito" siteSlug={siteSlug} />
        <p className="pg-hint">Attiva le pagine che vuoi mostrare e dai a ognuna il nome che preferisci: sarà quello a comparire nel menu di navigazione del sito. La Home è sempre attiva.</p>

        {PAGE_KEYS.map(k => {
          const isHome = k === 'home'
          const on = isHome ? true : enabled[k]
          return (
            <div key={k} className={`pg-card ${on ? 'on' : 'off'}`}>
              <div className="pg-head">
                <button
                  type="button"
                  className={`pg-toggle ${on ? 'on' : ''}`}
                  onClick={() => toggle(k)}
                  disabled={isHome}
                  aria-label={`${DEF[k]} ${on ? 'attiva' : 'disattivata'}`}
                >
                  <span className="pg-knob" />
                </button>
                <div className="pg-meta">
                  <p className="pg-name">{DEF[k]}</p>
                  <p className="pg-preview">Nel menu: <strong>{effectiveLabel(k)}</strong></p>
                </div>
                {isHome && <span className="pg-always">Sempre attiva</span>}
              </div>
              <div className="pg-rename">
                <label className="pg-rename-label">Nome nel menu</label>
                <input
                  className="pg-in"
                  value={labels[k]}
                  onChange={e => rename(k, e.target.value)}
                  placeholder={DEF[k]}
                  disabled={!on}
                  maxLength={40}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="pg-savebar">
        {feedback && <span className={`pg-fb ${feedback.ok ? 'pg-fb-ok' : 'pg-fb-err'}`}>{feedback.msg}</span>}
        <button type="button" className="pg-save" onClick={save} disabled={pending}>
          {pending ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
      </div>
    </div>
  )
}
