'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { runUrlResearch, chatResearch, finalizeResearch, advanceToStep } from '../actions'
import type { ResearchReport, ChatMessage } from '@/lib/lab/research'

const serif = { fontFamily: '"Cormorant Garamond", Georgia, serif' }

interface Props {
  projectId: string
  businessName: string
  businessType: string
  inputMode: 'url' | 'description'
  inputValue: string
  initialResearch: ResearchReport | null
  initialChat: ChatMessage[]
}

type View = 'loading-url' | 'chat' | 'report'

export function Step1Research(props: Props) {
  const initialView: View = props.initialResearch
    ? 'report'
    : props.inputMode === 'url'
      ? 'loading-url'
      : 'chat'

  const [view, setView] = useState<View>(initialView)
  const [research, setResearch] = useState<ResearchReport | null>(props.initialResearch)

  return (
    <div className="min-h-screen bg-[#050505] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(800px circle at 12% 18%, rgba(229,45,29,0.06), transparent 50%), radial-gradient(700px circle at 88% 75%, rgba(167,139,250,0.05), transparent 50%)' }}
      />
      <div className="relative z-10 mx-auto max-w-[1200px] px-5 py-6">
        <Header {...props} />
        {view === 'loading-url' && (
          <UrlLoading
            projectId={props.projectId}
            inputValue={props.inputValue}
            onDone={(r) => { setResearch(r); setView('report') }}
            onFallback={() => setView('chat')}
          />
        )}
        {view === 'chat' && (
          <ChatResearch
            projectId={props.projectId}
            businessName={props.businessName}
            initialChat={props.initialChat}
            fellBack={props.inputMode === 'url'}
            onReport={(r) => { setResearch(r); setView('report') }}
          />
        )}
        {view === 'report' && research && (
          <ReportView projectId={props.projectId} businessName={props.businessName} research={research} initialChat={props.initialChat} />
        )}
      </div>
    </div>
  )
}

function Header({ businessName, businessType }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
      <div className="flex items-center gap-4">
        <a href="/lumino-admin/lab" className="text-xs text-white/50 transition-colors hover:text-white">← Lab</a>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e52d1d]">Step 1 — Research</div>
          <h1 className="m-0 text-2xl font-normal italic tracking-tight" style={serif}>{businessName}</h1>
        </div>
      </div>
      <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-white/60">{businessType}</span>
    </div>
  )
}

// ── Modalità A: loading + scrape ──────────────────────────────
function UrlLoading({ projectId, inputValue, onDone, onFallback }: {
  projectId: string; inputValue: string; onDone: (r: ResearchReport) => void; onFallback: () => void
}) {
  const [stage, setStage] = useState(0)
  const [err, setErr] = useState<string | null>(null)
  const started = useRef(false)

  const stages = ['Scraping del sito…', 'Cerco su Google My Business…', 'Analisi AI in corso…', 'Cerco i competitor vicini…']

  useEffect(() => {
    if (started.current) return
    started.current = true
    const ticker = setInterval(() => setStage(s => Math.min(s + 1, stages.length - 1)), 7000)
    runUrlResearch(projectId).then(r => {
      clearInterval(ticker)
      if (r.ok && r.research) {
        setStage(stages.length)
        setTimeout(() => onDone(r.research!), 400)
      } else if (r.fallback) {
        onFallback()
      } else {
        setErr(r.error || 'Errore durante la ricerca.')
      }
    })
    return () => clearInterval(ticker)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pct = Math.min(((stage + 1) / (stages.length + 1)) * 100, 96)

  return (
    <div className="mx-auto mt-16 max-w-xl text-center">
      <div className="mb-3 text-4xl">🔍</div>
      <h2 className="m-0 text-2xl font-normal italic" style={serif}>Sto analizzando il business…</h2>
      <p className="mt-2 break-all text-sm text-white/45">{inputValue}</p>

      {!err ? (
        <>
          <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#e52d1d] to-[#a78bfa] transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 text-[13px] text-white/55">{stages[Math.min(stage, stages.length - 1)]}</p>
        </>
      ) : (
        <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-300">
          {err}
          <div className="mt-3">
            <button onClick={onFallback} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">
              Descrivi tu il business →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modalità B: chat ──────────────────────────────────────────
function ChatResearch({ projectId, businessName, initialChat, fellBack, onReport }: {
  projectId: string; businessName: string; initialChat: ChatMessage[]; fellBack: boolean; onReport: (r: ResearchReport) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat.length > 0 ? initialChat : [{
    role: 'assistant',
    content: fellBack
      ? `Non sono riuscito a scrapare il sito di ${businessName}. Nessun problema — descrivimi tu il business e ti faccio qualche domanda. Cominciamo: cosa offre e dov'è?`
      : `Ciao! Costruiamo insieme la ricerca per ${businessName}. Raccontami: cosa offre e dov'è?`,
  }])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [ready, setReady] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, pending])

  async function send() {
    const text = input.trim()
    if (!text || pending) return
    setErr(null)
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    setPending(true)
    const r = await chatResearch(projectId, next)
    setPending(false)
    if (r.ok && r.text) {
      setMessages([...next, { role: 'assistant', content: r.text }])
      if (r.ready) setReady(true)
    } else {
      setErr(r.error || 'Errore nella chat.')
    }
  }

  async function finalize() {
    setFinalizing(true)
    setErr(null)
    const r = await finalizeResearch(projectId, messages)
    setFinalizing(false)
    if (r.ok && r.research) onReport(r.research)
    else setErr(r.error || 'Errore nel generare il report.')
  }

  return (
    <div className="mx-auto mt-4 max-w-2xl">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="flex flex-col gap-3 p-5" style={{ maxHeight: '58vh', overflowY: 'auto' }}>
          {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
          {pending && <Bubble role="assistant" content="…" />}
          <div ref={endRef} />
        </div>
        <div className="border-t border-white/[0.08] p-3">
          {err && <p className="mb-2 px-1 text-xs text-red-300">{err}</p>}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send() }}
              placeholder="Scrivi la tua risposta…"
              disabled={pending || finalizing}
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#e52d1d]/50"
            />
            <button onClick={send} disabled={pending || finalizing || !input.trim()}
              className="rounded-lg bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/15 disabled:opacity-40">
              Invia
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button onClick={finalize} disabled={finalizing}
          className={`rounded-full px-5 py-3 text-[13px] font-semibold transition-colors disabled:opacity-50 ${
            ready ? 'bg-[#e52d1d] text-white hover:bg-[#c9241a]' : 'border border-white/15 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]'
          }`}>
          {finalizing ? 'Genero il report…' : ready ? '✓ Genera report Research' : 'Genera report (anche ora)'}
        </button>
      </div>
    </div>
  )
}

function Bubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
        isUser ? 'bg-[#e52d1d]/90 text-white' : 'border border-white/[0.08] bg-white/[0.04] text-white/85'
      }`}>
        {content}
      </div>
    </div>
  )
}

// ── Report view ───────────────────────────────────────────────
function ReportView({ projectId, businessName, research, initialChat }: {
  projectId: string; businessName: string; research: ResearchReport; initialChat: ChatMessage[]
}) {
  const router = useRouter()
  const [advancing, setAdvancing] = useState(false)

  async function proceed() {
    setAdvancing(true)
    const r = await advanceToStep(projectId, 2)
    if (r.ok) router.refresh()
    else { setAdvancing(false); alert(r.error || 'Errore') }
  }

  const info = research.info

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
      {/* Main report */}
      <div className="flex flex-col gap-4">
        <Card title="📋 Info estratte">
          <Row k="Nome" v={info.name} />
          <Row k="Tipo" v={info.type} />
          <Row k="Descrizione" v={info.description} />
          <Row k="Indirizzo" v={info.address} />
          <Row k="Telefono" v={info.phone} />
          <Row k="Email" v={info.email} />
          <Row k="Sito" v={info.website} />
          <Row k="Orari" v={info.hours} />
        </Card>

        <Card title="🎙️ Tono di voce">
          <p className="m-0 text-[14px] italic text-white/85">{research.toneOfVoice || '—'}</p>
        </Card>

        {research.photos.length > 0 && (
          <Card title={`🖼️ Foto trovate (${research.photos.length})`}>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {research.photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`foto ${i + 1}`} loading="lazy"
                  className="aspect-square w-full rounded-lg border border-white/10 object-cover" />
              ))}
            </div>
          </Card>
        )}

        <Card title="⚠️ Cosa manca">
          {research.missing.length === 0 ? (
            <p className="m-0 text-sm text-white/50">Nessuna lacuna rilevata.</p>
          ) : (
            <ul className="m-0 flex flex-col gap-1.5 pl-0">
              {research.missing.map((x, i) => (
                <li key={i} className="flex items-start gap-2 text-[13.5px] text-white/80">
                  <span className="mt-0.5 text-amber-400">•</span><span>{x}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="🏁 Competitor più vicini">
          {research.competitors.length === 0 ? (
            <p className="m-0 text-sm text-white/50">Nessun competitor trovato (posizione non determinata).</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {research.competitors.map((c, i) => (
                <div key={i} className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold text-white">{c.name}</span>
                    {c.distanceM != null && <span className="shrink-0 text-[12px] text-white/45">{formatDist(c.distanceM)}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/55">
                    {c.rating != null && <span>⭐ {c.rating} ({c.reviewsCount ?? 0})</span>}
                    {c.website ? <span className="text-[#c4b5fd]">ha un sito</span> : <span className="text-white/35">nessun sito</span>}
                    {c.address && <span className="truncate">{c.address}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <button onClick={proceed} disabled={advancing}
          className="mt-1 w-full rounded-xl bg-gradient-to-r from-[#e52d1d] to-[#a78bfa] py-3.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
          {advancing ? 'Avanzo…' : 'Procedi allo Step 2 — Layout →'}
        </button>
      </div>

      {/* Side chat */}
      <SideChat projectId={projectId} businessName={businessName} initialChat={initialChat} />
    </div>
  )
}

function SideChat({ projectId, businessName, initialChat }: { projectId: string; businessName: string; initialChat: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialChat.length > 0 ? initialChat : [{ role: 'assistant', content: `Chiedimi modifiche o approfondimenti sulla ricerca di ${businessName}.` }],
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
    const r = await chatResearch(projectId, next)
    setPending(false)
    if (r.ok && r.text) setMessages([...next, { role: 'assistant', content: r.text }])
  }

  return (
    <div className="flex h-fit flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] lg:sticky lg:top-5">
      <div className="border-b border-white/[0.08] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
        💬 Assistente Research
      </div>
      <div className="flex flex-col gap-2.5 p-4" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
        {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
        {pending && <Bubble role="assistant" content="…" />}
        <div ref={endRef} />
      </div>
      <div className="border-t border-white/[0.08] p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Chiedi qualcosa…"
            disabled={pending}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-[#e52d1d]/50"
          />
          <button onClick={send} disabled={pending || !input.trim()}
            className="rounded-lg bg-white/10 px-3 py-2 text-[12px] font-semibold text-white hover:bg-white/15 disabled:opacity-40">→</button>
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">{title}</div>
      {children}
    </div>
  )
}

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex gap-3 border-b border-white/[0.05] py-2 last:border-0">
      <span className="w-28 shrink-0 text-[12px] text-white/45">{k}</span>
      <span className="text-[13.5px] text-white/85">{v || <span className="text-white/30">—</span>}</span>
    </div>
  )
}

function formatDist(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`
}
