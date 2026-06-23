'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { saveMyChef, type ChefDTO } from '../actions/site'

export type { ChefDTO }

interface Props {
  initial: ChefDTO
  siteSlug: string
  backPath?: string
  saveAction?: (input: ChefDTO) => Promise<{ ok: boolean; error?: string }>
}

export function ChefEditor({ initial, siteSlug, backPath, saveAction }: Props) {
  const [d, setD] = useState<ChefDTO>(initial)
  const [pending, startTransition] = useTransition()
  const [fb, setFb] = useState<{ ok?: boolean; msg?: string } | null>(null)

  function set<K extends keyof ChefDTO>(k: K, v: ChefDTO[K]) {
    setD(prev => ({ ...prev, [k]: v }))
  }

  function save() {
    setFb(null)
    startTransition(async () => {
      const r = await (saveAction ? saveAction(d) : saveMyChef(d))
      if (r.ok) {
        setFb({ ok: true, msg: '✓ Salvato' })
        setTimeout(() => setFb(null), 3000)
      } else {
        setFb({ ok: false, msg: r.error || 'Errore' })
      }
    })
  }

  return (
    <div className="cf-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; }
        .cf-root { min-height:100vh; background:#050505; color:#fff; font-family:'Inter',system-ui,sans-serif; padding-bottom:110px; }
        .cf-top { padding:18px 24px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; background:rgba(10,10,10,0.7); backdrop-filter:blur(20px); position:sticky; top:0; z-index:10; }
        .cf-back { color:rgba(255,255,255,0.6); text-decoration:none; font-size:13px; margin-right:14px; }
        .cf-back:hover { color:#fff; }
        .cf-bartitle { font-family:'Cormorant Garamond',Georgia,serif; font-size:22px; font-style:italic; }
        .cf-wrap { max-width:620px; margin:0 auto; padding:28px 22px; }
        .cf-hint { color:rgba(255,255,255,0.55); font-size:13.5px; line-height:1.55; margin:0 0 22px; }
        .cf-toggle { display:flex; align-items:center; gap:12px; padding:16px 18px; background:rgba(20,20,22,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:14px; margin-bottom:18px; cursor:pointer; user-select:none; }
        .cf-toggle input { accent-color:#22c55e; width:18px; height:18px; }
        .cf-toggle strong { font-size:14px; }
        .cf-toggle small { display:block; color:rgba(255,255,255,0.5); font-size:12.5px; margin-top:2px; }
        .cf-section { background:rgba(20,20,22,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:20px; margin-bottom:14px; }
        .cf-field { margin-bottom:14px; }
        .cf-label { display:block; font-size:11px; font-weight:600; color:rgba(255,255,255,0.6); margin-bottom:7px; letter-spacing:0.04em; }
        .cf-in, .cf-area { width:100%; padding:11px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:#fff; font-size:14.5px; font-family:inherit; }
        .cf-in:focus, .cf-area:focus { outline:none; border-color:rgba(229,45,29,0.5); }
        .cf-area { min-height:90px; resize:vertical; line-height:1.55; }
        .cf-preview { display:flex; gap:14px; align-items:center; margin-top:10px; padding:12px; border:1px dashed rgba(255,255,255,0.1); border-radius:12px; background:rgba(255,255,255,0.02); }
        .cf-prev-img { width:56px; height:56px; border-radius:50%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); overflow:hidden; flex-shrink:0; }
        .cf-prev-img img { width:100%; height:100%; object-fit:cover; }
        .cf-savebar { position:fixed; bottom:18px; left:50%; transform:translateX(-50%); padding:12px 16px; background:rgba(10,10,10,0.95); backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.1); border-radius:100px; display:flex; align-items:center; gap:14px; z-index:50; box-shadow:0 16px 48px rgba(0,0,0,0.6); }
        .cf-save { padding:11px 22px; border:0; border-radius:100px; background:linear-gradient(135deg,#e52d1d,#c9241a); color:#fff; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; font-family:inherit; }
        .cf-save:disabled { opacity:0.5; cursor:not-allowed; }
        .cf-fb { font-size:13px; font-weight:600; padding:6px 14px; border-radius:100px; }
        .cf-fb-ok { background:rgba(34,197,94,0.15); color:#22c55e; }
        .cf-fb-err { background:rgba(239,68,68,0.15); color:#f87171; }
      `}</style>

      <nav className="cf-top">
        <div>
          <Link href={backPath ?? '/admin'} className="cf-back">← Pannello</Link>
          <span className="cf-bartitle">Lo chef</span>
        </div>
        <Link href={`/sites/${siteSlug}`} target="_blank" className="cf-back">Vedi il sito ↗</Link>
      </nav>

      <div className="cf-wrap">
        <p className="cf-hint">La sezione "Lo chef" mostra una foto, nome, ruolo e una breve frase. Compare nei template che la supportano (Cinematico, Aurora, Mercato).</p>

        <label className="cf-toggle">
          <input type="checkbox" checked={!!d.chef_active} onChange={e => set('chef_active', e.target.checked)} />
          <div>
            <strong>Mostra la sezione "Lo chef" sul sito</strong>
            <small>Se spunti, compilare nome + ruolo per pubblicarla.</small>
          </div>
        </label>

        {d.chef_active && (
          <div className="cf-section">
            <div className="cf-field">
              <label className="cf-label">Nome dello chef</label>
              <input className="cf-in" value={d.chef_name || ''} onChange={e => set('chef_name', e.target.value)} placeholder="Es. Marco Rossi" />
            </div>
            <div className="cf-field">
              <label className="cf-label">Ruolo</label>
              <input className="cf-in" value={d.chef_role || ''} onChange={e => set('chef_role', e.target.value)} placeholder="Es. Chef e proprietario" />
            </div>
            <div className="cf-field">
              <label className="cf-label">Frase / citazione (opzionale)</label>
              <textarea className="cf-area" value={d.chef_quote || ''} onChange={e => set('chef_quote', e.target.value)} placeholder="Una frase sulla tua cucina, sulla filosofia, sull'esperienza..." />
            </div>
            <div className="cf-field">
              <label className="cf-label">URL della foto (opzionale)</label>
              <input className="cf-in" value={d.chef_photo_url || ''} onChange={e => set('chef_photo_url', e.target.value)} placeholder="https://..." />
              {d.chef_photo_url && (
                <div className="cf-preview">
                  <div className="cf-prev-img"><img src={d.chef_photo_url} alt="" onError={(e: any) => e.target.style.display = 'none'} /></div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Anteprima foto.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="cf-savebar">
        {fb && <span className={`cf-fb ${fb.ok ? 'cf-fb-ok' : 'cf-fb-err'}`}>{fb.msg}</span>}
        <button type="button" className="cf-save" onClick={save} disabled={pending}>
          {pending ? 'Salvataggio...' : 'Salva sezione chef'}
        </button>
      </div>
    </div>
  )
}
