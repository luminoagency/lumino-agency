'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BUSINESS_TYPES, STATUS_COLUMNS, TOTAL_STEPS,
  businessTypeMeta, stepLabel, type LabStatus,
} from './constants'
import { createLabProject } from './actions'

export interface LabProjectCard {
  id: string
  businessName: string
  businessType: string
  status: string
  currentStep: number
  lastAccess: string
}

const COLUMN_ACCENT: Record<LabStatus, string> = {
  bozza: 'bg-white/40',
  in_costruzione: 'bg-amber-400',
  pubblicato: 'bg-green-400',
}

const serif = { fontFamily: '"Cormorant Garamond", Georgia, serif' }

export function LabBoard({ projects }: { projects: LabProjectCard[] }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  const byStatus = (s: string) => projects.filter(p => p.status === s)

  return (
    <div className="min-h-screen bg-[#050505] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" />

      {/* glow background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(800px circle at 12% 18%, rgba(229,45,29,0.06), transparent 50%), radial-gradient(700px circle at 88% 75%, rgba(167,139,250,0.05), transparent 50%)' }}
      />

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 py-6">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-4">
            <Link href="/lumino-admin" className="text-xs text-white/50 transition-colors hover:text-white">← Control</Link>
            <h1 className="m-0 text-3xl font-normal tracking-tight" style={serif}>
              🔬 Lumino <em className="bg-gradient-to-r from-[#e52d1d] to-[#a78bfa] bg-clip-text not-italic text-transparent">Lab</em>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-[#e52d1d] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#c9241a]"
          >
            + Nuovo progetto
          </button>
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STATUS_COLUMNS.map(col => {
            const items = byStatus(col.key)
            return (
              <div key={col.key} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={`h-2 w-2 rounded-full ${COLUMN_ACCENT[col.key]}`} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">{col.label}</span>
                  <span className="text-[11px] font-bold text-white/30">{items.length}</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/[0.08] px-3 py-8 text-center text-xs text-white/30">
                      Nessun progetto
                    </div>
                  )}
                  {items.map(p => {
                    const meta = businessTypeMeta(p.businessType)
                    return (
                      <Link
                        key={p.id}
                        href={`/lumino-admin/lab/${p.id}`}
                        className="block rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <span className="text-[15px] font-semibold leading-snug text-white">{p.businessName}</span>
                          <span className="shrink-0 text-lg leading-none" title={meta.label}>{meta.icon}</span>
                        </div>
                        <div className="mb-3 text-xs text-white/45">{meta.label}</div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/70">
                            Step {Math.min(p.currentStep, TOTAL_STEPS)}/{TOTAL_STEPS} — {stepLabel(p.currentStep)}
                          </span>
                          <span className="text-[11px] text-white/35">{p.lastAccess}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {modalOpen && (
        <NewProjectModal
          onClose={() => setModalOpen(false)}
          onCreated={(id) => router.push(`/lumino-admin/lab/${id}`)}
        />
      )}
    </div>
  )
}

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState<string>('ristorante')
  const [inputMode, setInputMode] = useState<'url' | 'description'>('url')
  const [inputValue, setInputValue] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = businessName.trim().length > 1 && !pending

  async function submit() {
    setError(null)
    setPending(true)
    const r = await createLabProject({ businessName, businessType, inputMode, inputValue })
    if (r.ok && r.id) {
      onCreated(r.id)
    } else {
      setError(r.error || 'Errore nella creazione.')
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141416] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 mb-1 text-2xl font-normal italic text-white" style={serif}>Nuovo progetto</h2>
        <p className="mb-5 mt-0 text-[13px] text-white/45">Step 0 — registra il business, poi parte il Lab.</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-300">
            {error}
          </div>
        )}

        <label className="mb-1.5 block text-[12px] font-medium text-white/65">Nome business</label>
        <input
          autoFocus
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Es. Trattoria del Sole"
          className="mb-4 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#e52d1d]/50"
        />

        <label className="mb-1.5 block text-[12px] font-medium text-white/65">Tipo business</label>
        <select
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="mb-4 w-full cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#e52d1d]/50"
        >
          {BUSINESS_TYPES.map(t => (
            <option key={t.key} value={t.key} className="bg-[#1a1a1a]">{t.icon} {t.label}</option>
          ))}
        </select>

        <label className="mb-1.5 block text-[12px] font-medium text-white/65">Come fornisci i dati?</label>
        <div className="mb-3 grid grid-cols-2 gap-2">
          {(['url', 'description'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setInputMode(mode)}
              className={`rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                inputMode === mode
                  ? 'border-[#e52d1d] bg-[#e52d1d]/10 text-white'
                  : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20'
              }`}
            >
              {mode === 'url' ? 'URL' : 'Descrizione'}
            </button>
          ))}
        </div>

        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          rows={inputMode === 'url' ? 2 : 4}
          placeholder={inputMode === 'url'
            ? 'https://sito-del-business.it oppure link Google Maps / Instagram'
            : 'Descrivi il business: cosa fa, dove si trova, stile, punti di forza…'}
          className="mb-5 w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#e52d1d]/50"
        />

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex-1 rounded-lg border border-white/12 bg-white/[0.04] py-2.5 text-[13px] font-semibold text-white/75 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="flex-1 rounded-lg bg-[#e52d1d] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#c9241a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? 'Creazione…' : 'Crea progetto'}
          </button>
        </div>
      </div>
    </div>
  )
}
