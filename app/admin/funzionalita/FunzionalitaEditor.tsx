'use client'

import { useState, useTransition } from 'react'
import { setFeatureFlag, type FeatureFlags } from '../actions/site'
import { PLAN_FEATURE_DEFAULTS, type FeatureKey, type PlanKey } from '@/lib/plans'

const FEATURES: Array<{ key: FeatureKey; col: keyof FeatureFlags; icon: string; name: string; sub: string }> = [
  { key: 'reservations',   col: 'feature_reservations_enabled',    icon: '📋', name: 'Prenotazioni online', sub: 'Modulo prenotazione tavolo sul sito' },
  { key: 'events',         col: 'feature_events_enabled',          icon: '📅', name: 'Eventi',               sub: 'Pubblica eventi sul sito' },
  { key: 'whatsappButton', col: 'feature_whatsapp_button_enabled', icon: '💬', name: 'Pulsante WhatsApp',    sub: 'Bottone fisso che apre WhatsApp' },
  { key: 'reviews',        col: 'feature_reviews_enabled',         icon: '⭐', name: 'Recensioni',           sub: 'Sezione recensioni + form scrittura' },
  { key: 'chef',           col: 'feature_chef_section_enabled',    icon: '👨‍🍳', name: 'Sezione "Lo chef"', sub: 'Foto + frase dello chef sul sito' },
]

interface Props {
  tier: string
  featureFlags: FeatureFlags
}

export function FunzionalitaEditor({ tier, featureFlags }: Props) {
  const [flags, setFlags] = useState<FeatureFlags>(featureFlags)
  const planDefaults = PLAN_FEATURE_DEFAULTS[tier as PlanKey] || PLAN_FEATURE_DEFAULTS.basic
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg?: string } | null>(null)

  function toggleFeature(feature: FeatureKey, col: keyof FeatureFlags, currentEnabled: boolean) {
    setFeedback(null)
    // Default del piano ON: toggle OFF → false, toggle ON → null (torna al default).
    const planAllows = planDefaults[feature]
    const next = currentEnabled ? false : (planAllows ? null : true)
    setFlags(prev => ({ ...prev, [col]: next }))
    startTransition(async () => {
      const r = await setFeatureFlag(feature, next)
      if (!r.ok) {
        setFlags(prev => ({ ...prev, [col]: currentEnabled ? true : false }))
        setFeedback({ ok: false, msg: r.error || 'Errore' })
      } else {
        setFeedback({ ok: true, msg: `✓ ${currentEnabled ? 'Disattivato' : 'Attivato'}` })
        setTimeout(() => setFeedback(null), 2500)
      }
    })
  }

  return (
    <div className="ac-wrap">
      <div className="ac-head">
        <h1 className="ac-title">Funzionalità del sito</h1>
        <p className="ac-sub">Accendi o spegni le sezioni del tuo sito. Quando spente, scompaiono completamente.</p>
      </div>

      <div className="ae-feat-grid">
        {FEATURES.map(f => {
          const planAllows = planDefaults[f.key]
          const override = flags[f.col]
          const isActive = planAllows && override !== false
          const locked = !planAllows
          return (
            <div key={f.key} className={`ae-feat ${locked ? 'locked' : ''} ${isActive && !locked ? 'on' : ''}`}>
              <div className="ae-feat-head">
                <span className="ae-feat-icon">{f.icon}</span>
                <div className="ae-feat-meta">
                  <p className="ae-feat-name">{f.name}</p>
                  <p className="ae-feat-sub">{f.sub}</p>
                </div>
                {locked ? (
                  <a href="/pricing" className="ae-feat-badge">Solo Pro</a>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleFeature(f.key, f.col, isActive)}
                    disabled={pending}
                    className={`ae-toggle ${isActive ? 'on' : ''}`}
                    aria-label={`${f.name} ${isActive ? 'attivo' : 'disattivato'}`}
                  >
                    <span className="ae-toggle-knob" />
                  </button>
                )}
              </div>
            </div>
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
