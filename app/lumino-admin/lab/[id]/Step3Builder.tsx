'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBuildShell, buildOneSection, saveBuild, chatBuild, advanceToStep } from '../actions'
import type { ChatMessage } from '@/lib/lab/research'
import type { SiteSection, SitePage } from '@/lib/lab/builder'

const serif = { fontFamily: '"Cormorant Garamond", Georgia, serif' }

const LABELS: Record<string, string> = {
  hero: 'hero', gallery: 'galleria', menu: 'menu', about: 'chi siamo',
  services: 'servizi', reviews: 'recensioni', events: 'eventi', booking: 'prenotazioni',
  contact: 'contatti', map: 'mappa', team: 'team', newsletter: 'newsletter',
}

interface Props {
  projectId: string
  businessName: string
  businessType: string
  hasBuild: boolean
  initialChat: ChatMessage[]
}

export function Step3Builder({ projectId, businessName, businessType, hasBuild, initialChat }: Props) {
  const router = useRouter()
  const [built, setBuilt] = useState(hasBuild)
  const [building, setBuilding] = useState(false)
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(0)
  const [label, setLabel] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  async function generate() {
    setErr(null); setBuilding(true); setDone(0); setLabel('Preparo la struttura…')
    const shell = await getBuildShell(projectId)
    if (!shell.ok || !shell.pages || !shell.globalConfig || !shell.navigation) { setBuilding(false); setErr(shell.error || 'Errore.'); return }

    const pages = shell.pages
    const totalSections = pages.reduce((n, p) => n + p.sections.length, 0)
    setTotal(totalSections)
    let count = 0
    const builtPages: SitePage[] = []
    for (const page of pages) {
      const sections: SiteSection[] = []
      for (const sk of page.sections) {
        setLabel(`${page.title}: genero ${LABELS[sk] || sk}…`)
        const r = await buildOneSection(projectId, sk)
        if (!r.ok || !r.section) { setBuilding(false); setErr(r.error || `Errore sezione ${sk} (${page.title}).`); return }
        sections.push(r.section)
        count++; setDone(count)
      }
      builtPages.push({ slug: page.slug, title: page.title, sections, isHomepage: page.isHomepage || page.slug === 'home' })
    }

    setLabel('Salvo il sito…')
    const save = await saveBuild(projectId, { pages: builtPages, globalConfig: shell.globalConfig, navigation: shell.navigation, locales: shell.locales, defaultLocale: shell.defaultLocale })
    setBuilding(false)
    if (!save.ok) { setErr(save.error || 'Errore nel salvataggio.'); return }
    setBuilt(true)
    setIframeKey(k => k + 1)
  }

  async function advance() {
    setAdvancing(true)
    const r = await advanceToStep(projectId, 4)
    if (r.ok) router.refresh()
    else { setAdvancing(false); setErr(r.error || 'Errore.') }
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="min-h-screen bg-[#050505] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(800px circle at 12% 18%, rgba(229,45,29,0.06), transparent 50%), radial-gradient(700px circle at 88% 75%, rgba(167,139,250,0.05), transparent 50%)' }} />
      <div className="relative z-10 mx-auto max-w-[1280px] px-5 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-4">
            <a href="/lumino-admin/lab" className="text-xs text-white/50 transition-colors hover:text-white">← Lab</a>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#22c55e]">Step 3 — Builder</div>
              <h1 className="m-0 text-2xl font-normal italic tracking-tight" style={serif}>{businessName}</h1>
            </div>
          </div>
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-white/60">{businessType}</span>
        </div>

        {err && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</div>}

        {!built && !building ? (
          <div className="mx-auto mt-16 max-w-xl text-center">
            <div className="mb-3 text-4xl">🏗️</div>
            <h2 className="m-0 text-2xl font-normal italic" style={serif}>Genera il sito completo</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
              L&apos;AI costruisce il sito sezione per sezione usando il report e il layout scelto, con i dati reali del business.
            </p>
            <button onClick={generate} className="mt-8 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] px-6 py-3 text-[13px] font-bold text-white transition-opacity hover:opacity-90">
              🏗️ Genera sito
            </button>
          </div>
        ) : building ? (
          <div className="mx-auto mt-16 max-w-md text-center">
            <div className="mb-4 text-3xl">🏗️</div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] transition-all duration-500" style={{ width: `${Math.max(pct, 6)}%` }} />
            </div>
            <p className="mt-3 text-[13px] text-white/70">{label}</p>
            {total > 0 && <p className="mt-1 text-[12px] text-white/40">{done}/{total} sezioni</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">Anteprima live</span>
                <div className="flex items-center gap-2">
                  <a href={`/lab-preview/${projectId}`} target="_blank" rel="noreferrer" className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/70 hover:bg-white/[0.08]">↗ Apri</a>
                  <button onClick={generate} className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/70 hover:bg-white/[0.08]">↻ Rigenera</button>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-white">
                <iframe
                  key={iframeKey}
                  src={`/lab-preview/${projectId}?t=${iframeKey}`}
                  title="Anteprima sito"
                  className="block w-full"
                  style={{ height: '70vh', border: 'none' }}
                />
              </div>
              <button onClick={advance} disabled={advancing}
                className="mt-4 w-full rounded-xl bg-[#e52d1d] py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#c9241a] disabled:opacity-50">
                {advancing ? 'Avanzo…' : 'Procedi allo Step 4 — Editor →'}
              </button>
            </div>
            <SideChat projectId={projectId} businessName={businessName} initialChat={initialChat} />
          </div>
        )}
      </div>
    </div>
  )
}

function SideChat({ projectId, businessName, initialChat }: { projectId: string; businessName: string; initialChat: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialChat.length > 0 ? initialChat : [{ role: 'assistant', content: `Il sito di ${businessName} è pronto. Vuoi modifiche al volo prima dell'editor? Dimmi cosa cambiare.` }],
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
    const r = await chatBuild(projectId, next)
    setPending(false)
    if (r.ok && r.text) setMessages([...next, { role: 'assistant', content: r.text }])
  }

  return (
    <div className="flex h-fit flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] lg:sticky lg:top-5">
      <div className="border-b border-white/[0.08] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">🏗️ Assistente Builder</div>
      <div className="flex flex-col gap-2.5 p-4" style={{ maxHeight: '58vh', overflowY: 'auto' }}>
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
            placeholder="Chiedi una modifica…" disabled={pending}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-[#22c55e]/50" />
          <button onClick={send} disabled={pending || !input.trim()} className="rounded-lg bg-white/10 px-3 py-2 text-[12px] font-semibold text-white hover:bg-white/15 disabled:opacity-40">→</button>
        </div>
      </div>
    </div>
  )
}
