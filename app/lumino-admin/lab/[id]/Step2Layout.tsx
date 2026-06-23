'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateLayoutProposals, chooseLayout, chatLayout } from '../actions'
import type { LayoutProposal, SectionKey } from '@/lib/lab/layout'
import type { ChatMessage } from '@/lib/lab/research'
import { LayoutMockup } from './LayoutMockup'

const serif = { fontFamily: '"Cormorant Garamond", Georgia, serif' }

const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Hero', gallery: 'Galleria', menu: 'Menu', about: 'Chi siamo',
  services: 'Servizi', reviews: 'Recensioni', events: 'Eventi', booking: 'Prenotazioni',
  contact: 'Contatti', map: 'Mappa', team: 'Team', newsletter: 'Newsletter',
}

interface Props {
  projectId: string
  businessName: string
  businessType: string
  initialProposals: LayoutProposal[]
  initialChat: ChatMessage[]
}

export function Step2Layout({ projectId, businessName, businessType, initialProposals, initialChat }: Props) {
  const router = useRouter()
  const [proposals, setProposals] = useState<LayoutProposal[]>(initialProposals)
  const [generating, setGenerating] = useState(false)
  const [stage, setStage] = useState(0)
  const [err, setErr] = useState<string | null>(null)
  const [choosing, setChoosing] = useState<string | null>(null)

  const stages = ['Leggo il report…', 'Immagino le strutture…', 'Scelgo le palette…', 'Compongo i mockup…']

  async function generate() {
    setErr(null)
    setGenerating(true)
    setStage(0)
    const ticker = setInterval(() => setStage(s => Math.min(s + 1, stages.length - 1)), 4000)
    const r = await generateLayoutProposals(projectId)
    clearInterval(ticker)
    setGenerating(false)
    if (r.ok && r.proposals) setProposals(r.proposals)
    else setErr(r.error || 'Errore nella generazione.')
  }

  async function pick(layout: LayoutProposal) {
    setChoosing(layout.name)
    const r = await chooseLayout(projectId, layout)
    if (r.ok) router.refresh()
    else { setChoosing(null); setErr(r.error || 'Errore nel salvare.') }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(800px circle at 12% 18%, rgba(229,45,29,0.06), transparent 50%), radial-gradient(700px circle at 88% 75%, rgba(167,139,250,0.05), transparent 50%)' }} />
      <div className="relative z-10 mx-auto max-w-[1200px] px-5 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-4">
            <a href="/lumino-admin/lab" className="text-xs text-white/50 transition-colors hover:text-white">← Lab</a>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a78bfa]">Step 2 — Layout</div>
              <h1 className="m-0 text-2xl font-normal italic tracking-tight" style={serif}>{businessName}</h1>
            </div>
          </div>
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-white/60">{businessType}</span>
        </div>

        {err && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</div>}

        {proposals.length === 0 ? (
          <div className="mx-auto mt-16 max-w-xl text-center">
            <div className="mb-3 text-4xl">🎨</div>
            <h2 className="m-0 text-2xl font-normal italic" style={serif}>Proposte di layout su misura</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
              L&apos;AI legge il report dello Step 1 e propone 2-3 layout unici, pensati per questo business.
            </p>
            {generating ? (
              <div className="mt-8">
                <div className="mx-auto h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#a78bfa] to-[#e52d1d] transition-all duration-700" style={{ width: `${((stage + 1) / (stages.length + 1)) * 100}%` }} />
                </div>
                <p className="mt-3 text-[13px] text-white/55">{stages[Math.min(stage, stages.length - 1)]}</p>
              </div>
            ) : (
              <button onClick={generate} className="mt-8 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] px-6 py-3 text-[13px] font-bold text-white transition-opacity hover:opacity-90">
                🎨 Genera proposte
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {proposals.map((p, i) => (
                <LayoutCard key={i} layout={p} choosing={choosing === p.name} disabled={!!choosing} onChoose={() => pick(p)} />
              ))}
              <div className="xl:col-span-2">
                <button onClick={generate} disabled={generating}
                  className="w-full rounded-xl border border-white/12 bg-white/[0.03] py-3 text-[13px] font-semibold text-white/70 transition-colors hover:bg-white/[0.06] disabled:opacity-50">
                  {generating ? 'Rigenero…' : '↻ Rigenera proposte'}
                </button>
              </div>
            </div>
            <SideChat projectId={projectId} businessName={businessName} initialChat={initialChat} />
          </div>
        )}
      </div>
    </div>
  )
}

function LayoutCard({ layout, onChoose, choosing, disabled }: { layout: LayoutProposal; onChoose: () => void; choosing: boolean; disabled: boolean }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      <div className="bg-black/30 p-3">
        <LayoutMockup layout={layout} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="m-0 text-xl font-normal italic text-white" style={serif}>{layout.name}</h3>
        <p className="mb-3 mt-1 text-[13px] text-white/55">{layout.description}</p>

        <div className="mb-3 flex items-center gap-1.5">
          {layout.palette.map((c, i) => (
            <span key={i} title={c} className="h-5 w-5 rounded-full border border-white/15" style={{ background: c }} />
          ))}
        </div>

        <div className="mb-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Perché questo layout</div>
          <p className="m-0 text-[13px] leading-relaxed text-white/80">{layout.why}</p>
        </div>

        <div className="mb-4">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Sezioni incluse</div>
          <div className="flex flex-wrap gap-1.5">
            {layout.sections.map((s, i) => (
              <span key={i} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/70">{SECTION_LABELS[s] || s}</span>
            ))}
          </div>
        </div>

        <button onClick={onChoose} disabled={disabled}
          className="mt-auto rounded-lg bg-[#e52d1d] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#c9241a] disabled:opacity-50">
          {choosing ? 'Salvo…' : 'Scegli questo →'}
        </button>
      </div>
    </div>
  )
}

function SideChat({ projectId, businessName, initialChat }: { projectId: string; businessName: string; initialChat: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialChat.length > 0 ? initialChat : [{ role: 'assistant', content: `Vuoi variazioni sul layout di ${businessName}? Dimmi cosa cambiare (struttura, sezioni, palette).` }],
  )
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, pending])

  async function send() {
    const text = input.trim()
    if (!text || pending) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next); setInput(''); setPending(true)
    const r = await chatLayout(projectId, next)
    setPending(false)
    if (r.ok && r.text) setMessages([...next, { role: 'assistant', content: r.text }])
  }

  return (
    <div className="flex h-fit flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] lg:sticky lg:top-5">
      <div className="border-b border-white/[0.08] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">🎨 Assistente Layout</div>
      <div className="flex flex-col gap-2.5 p-4" style={{ maxHeight: '54vh', overflowY: 'auto' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${m.role === 'user' ? 'bg-[#e52d1d]/90 text-white' : 'border border-white/[0.08] bg-white/[0.04] text-white/85'}`}>{m.content}</div>
          </div>
        ))}
        {pending && <div className="text-xs text-white/40">…</div>}
        <div ref={endRef} />
      </div>
      <div className="border-t border-white/[0.08] p-3">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Chiedi una variazione…" disabled={pending}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-[#a78bfa]/50" />
          <button onClick={send} disabled={pending || !input.trim()} className="rounded-lg bg-white/10 px-3 py-2 text-[12px] font-semibold text-white hover:bg-white/15 disabled:opacity-40">→</button>
        </div>
      </div>
    </div>
  )
}
