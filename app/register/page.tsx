'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { registerAction } from '../auth/actions'
import { PLANS, type PlanKey } from '@/lib/plans'

type Step = 1 | 2 | 3 | 4 | 5

interface FormState {
  restaurantName: string
  city: string
  phone: string
  plan: PlanKey
  hasDomain: '' | 'yes' | 'no'
  domain: string
  wantsWhatsapp: '' | 'yes' | 'no'
  whatsappNumber: string
  hasChef: '' | 'yes' | 'no'
  chefName: string
  chefRole: string
  chefQuote: string
  email: string
  password: string
}

const INITIAL: FormState = {
  restaurantName: '',
  city: '',
  phone: '',
  plan: 'pro',
  hasDomain: '',
  domain: '',
  wantsWhatsapp: '',
  whatsappNumber: '',
  hasChef: '',
  chefName: '',
  chefRole: '',
  chefQuote: '',
  email: '',
  password: '',
}

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  const [step, setStep] = useState<Step>(1)
  const [d, setD] = useState<FormState>(INITIAL)
  const [pending, startTransition] = useTransition()
  const errorMsg = searchParams?.error

  const isProPlus = d.plan === 'pro' || d.plan === 'premium'

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setD(prev => ({ ...prev, [k]: v }))
  }

  function validStep(s: Step): boolean {
    if (s === 1) return d.restaurantName.trim().length > 1
    if (s === 2) return !!d.plan
    if (s === 3) {
      if (isProPlus) {
        if (d.hasDomain === '') return false
        if (d.hasDomain === 'yes' && !d.domain.trim()) return false
        if (d.wantsWhatsapp === '') return false
        if (d.wantsWhatsapp === 'yes' && !d.whatsappNumber.trim()) return false
        if (d.hasChef === 'yes' && !d.chefName.trim()) return false
      }
      return true
    }
    if (s === 4) return d.email.includes('@') && d.password.length >= 8
    return true
  }

  function next() {
    if (validStep(step) && step < 5) setStep((step + 1) as Step)
  }
  function back() {
    if (step > 1) setStep((step - 1) as Step)
  }

  async function submit() {
    const fd = new FormData()
    fd.set('restaurantName', d.restaurantName)
    fd.set('city', d.city)
    fd.set('phone', d.phone)
    fd.set('plan', d.plan)
    fd.set('hasDomain', d.hasDomain)
    fd.set('domain', d.domain)
    fd.set('wantsWhatsapp', d.wantsWhatsapp)
    fd.set('whatsappNumber', d.whatsappNumber)
    fd.set('hasChef', d.hasChef)
    fd.set('chefName', d.chefName)
    fd.set('chefRole', d.chefRole)
    fd.set('chefQuote', d.chefQuote)
    fd.set('email', d.email)
    fd.set('password', d.password)
    startTransition(() => { registerAction(fd) })
  }

  return (
    <div className="rg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #050505; }
        .rg-root {
          min-height: 100vh; background: #050505; color: #fff;
          font-family: 'Inter', system-ui, sans-serif;
          padding: 32px 18px 64px;
          display: flex; flex-direction: column; align-items: center;
          position: relative; overflow-x: hidden;
        }
        .rg-root::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(700px circle at 18% 12%, rgba(229,45,29,0.08), transparent 50%),
            radial-gradient(600px circle at 82% 85%, rgba(167,139,250,0.07), transparent 50%);
        }
        .rg-wrap { width: 100%; max-width: 520px; position: relative; z-index: 1; }
        .rg-header { text-align: center; margin-bottom: 28px; }
        .rg-logo {
          display: inline-flex; align-items: baseline; gap: 5px;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 30px; font-weight: 500; letter-spacing: -0.01em;
          color: #fff; text-decoration: none; line-height: 1;
        }
        .rg-logo-dot { width: 7px; height: 7px; border-radius: 50%; background: #e52d1d; box-shadow: 0 0 12px #e52d1d; align-self: flex-end; margin-bottom: 6px; }
        .rg-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 36px; font-style: italic; font-weight: 400;
          color: #fff; letter-spacing: -0.025em; line-height: 1.1;
          margin: 22px 0 6px;
        }
        .rg-sub { color: rgba(255,255,255,0.55); font-size: 14.5px; line-height: 1.5; margin: 0; }

        /* Step progress */
        .rg-steps { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 26px 0 22px; }
        .rg-step-dot {
          width: 28px; height: 4px; border-radius: 2px;
          background: rgba(255,255,255,0.12);
          transition: background 0.4s, transform 0.4s;
        }
        .rg-step-dot.done { background: linear-gradient(90deg, #e52d1d, #a78bfa); }
        .rg-step-dot.current { background: #fff; transform: scaleY(1.5); }

        .rg-card {
          background: rgba(20, 20, 22, 0.7);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          padding: 28px 24px;
          backdrop-filter: blur(20px);
        }
        .rg-step-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic; font-weight: 400;
          font-size: 24px; letter-spacing: -0.015em;
          margin: 0 0 4px;
        }
        .rg-step-sub { color: rgba(255,255,255,0.55); font-size: 13.5px; line-height: 1.5; margin: 0 0 22px; }

        .rg-field { margin-bottom: 16px; }
        .rg-label { display: block; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.72); margin-bottom: 7px; letter-spacing: 0.02em; }
        .rg-label-opt { color: rgba(255,255,255,0.4); font-weight: 400; margin-left: 6px; }
        .rg-input, .rg-select {
          width: 100%; padding: 13px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #fff; font-size: 14.5px; font-family: inherit;
          outline: none; transition: border-color 0.2s, background 0.2s;
        }
        .rg-input:focus, .rg-select:focus { border-color: rgba(229,45,29,0.5); background: rgba(255,255,255,0.06); }
        .rg-input::placeholder { color: rgba(255,255,255,0.3); }

        .rg-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* Plan cards */
        .rg-plan-grid { display: flex; flex-direction: column; gap: 10px; }
        .rg-plan {
          padding: 16px 18px;
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: border-color 0.25s, background 0.25s, transform 0.25s;
          position: relative;
        }
        .rg-plan:hover { border-color: rgba(255,255,255,0.18); }
        .rg-plan.selected { border-color: #a78bfa; background: linear-gradient(180deg, rgba(167,139,250,0.08), rgba(255,255,255,0.02)); }
        .rg-plan-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .rg-plan-name { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 22px; font-weight: 400; color: #fff; }
        .rg-plan-price { color: #fff; font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
        .rg-plan-price small { color: rgba(255,255,255,0.45); font-weight: 400; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; margin-right: 4px; }
        .rg-plan-desc { color: rgba(255,255,255,0.55); font-size: 12.5px; line-height: 1.5; margin: 0; }
        .rg-plan-badge {
          position: absolute; top: -10px; right: 14px;
          padding: 4px 10px; background: #a78bfa; color: #050505;
          font-size: 9px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
          border-radius: 100px; white-space: nowrap;
        }

        /* Choice yes/no */
        .rg-choice-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 6px; }
        .rg-choice {
          padding: 14px 16px;
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          cursor: pointer;
          text-align: center;
          font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8);
          transition: all 0.2s;
        }
        .rg-choice:hover { border-color: rgba(255,255,255,0.2); color: #fff; }
        .rg-choice.selected { border-color: #e52d1d; background: rgba(229,45,29,0.08); color: #fff; }

        .rg-help { color: rgba(255,255,255,0.45); font-size: 12px; line-height: 1.5; margin: 6px 0 0; }
        .rg-info {
          margin-top: 12px; padding: 12px 14px;
          background: rgba(167,139,250,0.06);
          border: 1px solid rgba(167,139,250,0.15);
          border-radius: 10px;
          color: rgba(255,255,255,0.75); font-size: 12.5px; line-height: 1.55;
        }
        .rg-info-icon { color: #a78bfa; margin-right: 6px; font-weight: 700; }

        /* Summary */
        .rg-summary { background: rgba(255,255,255,0.02); border-radius: 12px; padding: 16px 18px; margin-bottom: 14px; border: 1px solid rgba(255,255,255,0.06); }
        .rg-sum-row { display: flex; justify-content: space-between; align-items: baseline; padding: 7px 0; font-size: 13.5px; gap: 12px; }
        .rg-sum-row + .rg-sum-row { border-top: 1px dashed rgba(255,255,255,0.06); }
        .rg-sum-k { color: rgba(255,255,255,0.5); flex-shrink: 0; }
        .rg-sum-v { color: #fff; text-align: right; font-weight: 500; }

        /* Buttons */
        .rg-actions { display: flex; gap: 10px; margin-top: 22px; }
        .rg-btn {
          flex: 1; padding: 14px 16px;
          font-family: inherit; font-size: 13px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          border-radius: 12px; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          border: 0;
        }
        .rg-btn-primary {
          background: linear-gradient(135deg, #e52d1d, #c9241a); color: #fff;
          box-shadow: 0 12px 30px rgba(229,45,29,0.35);
        }
        .rg-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 36px rgba(229,45,29,0.45); }
        .rg-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .rg-btn-ghost {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.75);
        }
        .rg-btn-ghost:hover { background: rgba(255,255,255,0.08); color: #fff; }

        .rg-footer { text-align: center; margin-top: 22px; color: rgba(255,255,255,0.5); font-size: 13px; }
        .rg-footer a { color: #fff; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.3); }

        .rg-error {
          padding: 12px 14px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px; color: #f87171; font-size: 13px;
          margin-bottom: 18px;
        }

        @media (max-width: 440px) {
          .rg-row-2 { grid-template-columns: 1fr; }
          .rg-card { padding: 22px 18px; }
          .rg-title { font-size: 30px; }
        }
      `}</style>

      <div className="rg-wrap">
        <div className="rg-header">
          <Link href="/" className="rg-logo">
            <span>Lumino</span>
            <span className="rg-logo-dot" />
          </Link>
          <h1 className="rg-title">Inizia il tuo sito</h1>
          <p className="rg-sub">Pochi passaggi. Niente burocrazia. Il sito è pronto entro 24h.</p>
        </div>

        <div className="rg-steps">
          {[1, 2, 3, 4, 5].map(n => (
            <div
              key={n}
              className={`rg-step-dot ${n < step ? 'done' : n === step ? 'current' : ''}`}
            />
          ))}
        </div>

        {errorMsg && <div className="rg-error">{decodeURIComponent(errorMsg)}</div>}

        <div className="rg-card">
          {step === 1 && (
            <>
              <h2 className="rg-step-title">Il tuo ristorante</h2>
              <p className="rg-step-sub">Le basi. Tutto il resto lo facciamo noi.</p>

              <div className="rg-field">
                <label className="rg-label">Nome del ristorante</label>
                <input
                  className="rg-input"
                  type="text"
                  value={d.restaurantName}
                  onChange={e => set('restaurantName', e.target.value)}
                  placeholder="Es. Trattoria del Sole"
                  autoFocus
                />
              </div>

              <div className="rg-row-2">
                <div className="rg-field">
                  <label className="rg-label">Città <span className="rg-label-opt">opzionale</span></label>
                  <input
                    className="rg-input"
                    type="text"
                    value={d.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="Es. Milano"
                  />
                </div>
                <div className="rg-field">
                  <label className="rg-label">Telefono <span className="rg-label-opt">opzionale</span></label>
                  <input
                    className="rg-input"
                    type="tel"
                    value={d.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+39 ..."
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="rg-step-title">Scegli il piano</h2>
              <p className="rg-step-sub">Puoi cambiarlo quando vuoi.</p>

              <div className="rg-plan-grid">
                {PLANS.map(p => (
                  <div
                    key={p.key}
                    className={`rg-plan ${d.plan === p.key ? 'selected' : ''}`}
                    onClick={() => set('plan', p.key)}
                  >
                    {p.badge && <span className="rg-plan-badge">{p.badge}</span>}
                    <div className="rg-plan-top">
                      <span className="rg-plan-name">{p.name}</span>
                      <span className="rg-plan-price"><small>da</small>€{p.priceFrom}</span>
                    </div>
                    <p className="rg-plan-desc">{p.description}</p>
                  </div>
                ))}
              </div>
              <p className="rg-help">Il prezzo finale varia per zona e tipo di locale. Si parte con il 50% all'avvio del lavoro.</p>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="rg-step-title">Personalizzazioni</h2>
              <p className="rg-step-sub">
                {isProPlus ? 'Quattro veloci scelte sul tuo sito.' : 'Per Basic non serve altro — passi avanti.'}
              </p>

              {!isProPlus && (
                <div className="rg-info">
                  <span className="rg-info-icon">✦</span>
                  Con Basic prendiamo tutto da Google: foto, recensioni, mappa, orari. Tu non devi caricare nulla.
                </div>
              )}

              {isProPlus && (
                <>
                  {/* Dominio */}
                  <div className="rg-field" style={{ marginTop: 6 }}>
                    <label className="rg-label">Hai già un dominio tuo?</label>
                    <div className="rg-choice-row">
                      <div className={`rg-choice ${d.hasDomain === 'yes' ? 'selected' : ''}`} onClick={() => set('hasDomain', 'yes')}>Sì, ce l'ho</div>
                      <div className={`rg-choice ${d.hasDomain === 'no' ? 'selected' : ''}`} onClick={() => set('hasDomain', 'no')}>No, registratelo voi</div>
                    </div>
                    {d.hasDomain === 'yes' && (
                      <input
                        className="rg-input"
                        type="text"
                        style={{ marginTop: 10 }}
                        value={d.domain}
                        onChange={e => set('domain', e.target.value)}
                        placeholder="es. tuoristorante.it"
                      />
                    )}
                    {d.hasDomain === 'no' && (
                      <div className="rg-info">
                        <span className="rg-info-icon">✓</span>
                        Lo registriamo noi. Costo incluso nel prezzo, paghi con la prima rata.
                      </div>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div className="rg-field">
                    <label className="rg-label">Vuoi un pulsante WhatsApp sul sito?</label>
                    <div className="rg-choice-row">
                      <div className={`rg-choice ${d.wantsWhatsapp === 'yes' ? 'selected' : ''}`} onClick={() => set('wantsWhatsapp', 'yes')}>Sì</div>
                      <div className={`rg-choice ${d.wantsWhatsapp === 'no' ? 'selected' : ''}`} onClick={() => set('wantsWhatsapp', 'no')}>No, solo chiamata</div>
                    </div>
                    {d.wantsWhatsapp === 'yes' && (
                      <input
                        className="rg-input"
                        type="tel"
                        style={{ marginTop: 10 }}
                        value={d.whatsappNumber}
                        onChange={e => set('whatsappNumber', e.target.value)}
                        placeholder="+39 ..."
                      />
                    )}
                  </div>

                  {/* Chef */}
                  <div className="rg-field">
                    <label className="rg-label">Vuoi una sezione "Lo chef"? <span className="rg-label-opt">opzionale</span></label>
                    <div className="rg-choice-row">
                      <div className={`rg-choice ${d.hasChef === 'yes' ? 'selected' : ''}`} onClick={() => set('hasChef', 'yes')}>Sì, mettiamola</div>
                      <div className={`rg-choice ${d.hasChef === 'no' ? 'selected' : ''}`} onClick={() => set('hasChef', 'no')}>No, salta</div>
                    </div>
                    {d.hasChef === 'yes' && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input
                          className="rg-input"
                          type="text"
                          value={d.chefName}
                          onChange={e => set('chefName', e.target.value)}
                          placeholder="Nome dello chef"
                        />
                        <input
                          className="rg-input"
                          type="text"
                          value={d.chefRole}
                          onChange={e => set('chefRole', e.target.value)}
                          placeholder="Ruolo (es. Chef e proprietario)"
                        />
                        <input
                          className="rg-input"
                          type="text"
                          value={d.chefQuote}
                          onChange={e => set('chefQuote', e.target.value)}
                          placeholder="Una frase dello chef (opzionale)"
                        />
                      </div>
                    )}
                  </div>

                  {/* Eventi info */}
                  <div className="rg-info">
                    <span className="rg-info-icon">📅</span>
                    <strong>Eventi:</strong> potrai aggiungerli quando vuoi dal pannello admin. Il sito parte senza.
                  </div>
                </>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="rg-step-title">Il tuo account</h2>
              <p className="rg-step-sub">Per accedere al pannello quando il sito è pronto.</p>

              <div className="rg-field">
                <label className="rg-label">Email</label>
                <input
                  className="rg-input"
                  type="email"
                  value={d.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="tu@ristorante.it"
                  autoComplete="email"
                />
              </div>

              <div className="rg-field">
                <label className="rg-label">Password <span className="rg-label-opt">minimo 8 caratteri</span></label>
                <input
                  className="rg-input"
                  type="password"
                  value={d.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="rg-step-title">Riepilogo</h2>
              <p className="rg-step-sub">Controlla che sia tutto giusto, poi conferma.</p>

              <div className="rg-summary">
                <div className="rg-sum-row"><span className="rg-sum-k">Ristorante</span><span className="rg-sum-v">{d.restaurantName}</span></div>
                {d.city && <div className="rg-sum-row"><span className="rg-sum-k">Città</span><span className="rg-sum-v">{d.city}</span></div>}
                {d.phone && <div className="rg-sum-row"><span className="rg-sum-k">Telefono</span><span className="rg-sum-v">{d.phone}</span></div>}
                <div className="rg-sum-row"><span className="rg-sum-k">Piano</span><span className="rg-sum-v">{PLANS.find(p => p.key === d.plan)?.name} · da €{PLANS.find(p => p.key === d.plan)?.priceFrom}</span></div>
                {isProPlus && (
                  <>
                    <div className="rg-sum-row"><span className="rg-sum-k">Dominio</span><span className="rg-sum-v">{d.hasDomain === 'yes' ? d.domain : 'Lo registriamo noi'}</span></div>
                    <div className="rg-sum-row"><span className="rg-sum-k">WhatsApp</span><span className="rg-sum-v">{d.wantsWhatsapp === 'yes' ? d.whatsappNumber : 'No, solo chiamata'}</span></div>
                    <div className="rg-sum-row"><span className="rg-sum-k">Sezione chef</span><span className="rg-sum-v">{d.hasChef === 'yes' ? d.chefName : 'No'}</span></div>
                  </>
                )}
                <div className="rg-sum-row"><span className="rg-sum-k">Email</span><span className="rg-sum-v">{d.email}</span></div>
              </div>

              <div className="rg-info">
                <span className="rg-info-icon">✓</span>
                Dopo la conferma ti contattiamo entro 24h per il pagamento del 50% e per qualsiasi dettaglio. Il sito è pronto subito dopo.
              </div>
            </>
          )}

          <div className="rg-actions">
            {step > 1 && (
              <button type="button" className="rg-btn rg-btn-ghost" onClick={back} disabled={pending}>
                ← Indietro
              </button>
            )}
            {step < 5 && (
              <button type="button" className="rg-btn rg-btn-primary" onClick={next} disabled={!validStep(step)}>
                Avanti →
              </button>
            )}
            {step === 5 && (
              <button type="button" className="rg-btn rg-btn-primary" onClick={submit} disabled={pending}>
                {pending ? 'Sto creando...' : 'Conferma e crea account'}
              </button>
            )}
          </div>
        </div>

        <div className="rg-footer">
          Hai già un account? <Link href="/login">Accedi</Link>
        </div>
      </div>
    </div>
  )
}
