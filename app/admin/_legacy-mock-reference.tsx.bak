'use client'

import { useState, useTransition } from 'react'
import { logoutAction } from '../auth/actions'
import { saveSiteContent, saveMenuItems, saveEvents } from './actions/site'

// ── Reusable SaveButton with loading + success/error state ────────────────────
function SaveButton({ onSave, label = 'Salva', style }: { onSave: () => Promise<{ ok: boolean; error?: string }>; label?: string; style?: React.CSSProperties }) {
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<{ ok?: boolean; error?: string } | null>(null)

  const handleClick = () => {
    setState(null)
    startTransition(async () => {
      const r = await onSave()
      setState(r)
      setTimeout(() => setState(null), 3500)
    })
  }

  const bg = state?.ok ? '#22c55e' : state?.error ? '#ef4444' : (style?.background || '#e52d1d')
  const text = pending ? 'Salvataggio…' : state?.ok ? '✓ Salvato' : state?.error ? '✕ Errore' : label

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        onClick={handleClick}
        disabled={pending}
        style={{
          padding: '10px 22px',
          background: bg,
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: pending ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.25s',
          opacity: pending ? 0.7 : 1,
          ...style,
          background: bg,
        }}
      >
        {text}
      </button>
      {state?.error && (
        <span style={{ color: '#ef4444', fontSize: 12 }}>{state.error}</span>
      )}
    </div>
  )
}

type Tier = 'basic' | 'pro' | 'premium'
type NavItem = 'Dashboard' | 'Menu' | 'Orari' | 'Prenotazioni' | 'Eventi' | 'Foto & Gallery' | 'Testi' | 'Chef' | 'Recensioni' | 'FAQ' | 'Newsletter' | 'Clienti CRM' | 'Personalizza'

const C = {
  bg: '#0f0f0f',
  sidebar: '#151515',
  card: '#1a1a1a',
  border: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  muted: '#777',
  accent: '#e52d1d',
  input: '#222',
  inputBorder: 'rgba(255,255,255,0.1)',
}

const initialMenuData = [
  { category: 'Smash Burgers', items: [
    { id: 1, name: 'Poppy Classic', desc: 'Doppio smash, cheddar, pickles, salsa speciale', price: 11, available: true },
    { id: 2, name: 'Truffle Bloom', desc: 'Smash, funghi, tartufo, mozzarella fior di latte', price: 14, available: true },
    { id: 3, name: 'BBQ Beast', desc: 'Triplo smash, bacon croccante, salsa BBQ fumé', price: 15, available: true },
    { id: 4, name: 'Green Poppy', desc: 'Patty vegetale, avocado, pomodoro secco, rucola', price: 13, available: false },
  ]},
  { category: 'Bowls', items: [
    { id: 5, name: 'Poppy Bowl', desc: 'Riso, pollo grigliato, verdure di stagione, salsa tahini', price: 13, available: true },
    { id: 6, name: 'Chicken Caesar Bowl', desc: 'Riso, pollo, lattuga, parmigiano, croutons', price: 12, available: true },
    { id: 7, name: 'Vegan Power', desc: 'Quinoa, ceci speziati, avocado, verdure arrosto', price: 12, available: true },
  ]},
  { category: 'Wraps & Sides', items: [
    { id: 8, name: 'Chicken Wrap', desc: 'Pollo croccante, insalata, salsa piccante', price: 9, available: true },
    { id: 9, name: 'Loaded Fries', desc: 'Patatine con cheddar fuso, bacon, cipolla verde', price: 8, available: true },
    { id: 10, name: 'Sweet Fries', desc: 'Patatine di patata dolce con dip allo yogurt', price: 6, available: true },
    { id: 11, name: 'Onion Rings', desc: 'Anelli di cipolla in pastella croccante', price: 5, available: true },
  ]},
  { category: 'Dolci & Bevande', items: [
    { id: 12, name: 'Poppy Shake', desc: 'Milkshake artigianale — cioccolato, fragola o vaniglia', price: 7, available: true },
    { id: 13, name: 'Brownie Sundae', desc: 'Brownie caldo con gelato e caramello salato', price: 8, available: true },
    { id: 14, name: 'Craft Beer', desc: 'Birra artigianale locale — chiedi le disponibili', price: 6, available: true },
    { id: 15, name: 'Fresh Lemonade', desc: 'Limonata fresca con menta e zenzero', price: 5, available: true },
  ]},
]

const initialOrari = [
  { day: 'Lunedì', open: '11:30', close: '14:30', closed: false },
  { day: 'Martedì', open: '11:30', close: '14:30', closed: false },
  { day: 'Mercoledì', open: '11:30', close: '14:30', closed: false },
  { day: 'Giovedì', open: '11:30', close: '23:00', closed: false },
  { day: 'Venerdì', open: '11:30', close: '23:30', closed: false },
  { day: 'Sabato', open: '11:30', close: '23:30', closed: false },
  { day: 'Domenica', open: '12:00', close: '22:00', closed: false },
]

const initialPrenotazioni = [
  { id: 1, nome: 'Marco Rossi', data: '2026-06-15', ora: '20:00', persone: 4, stato: 'confirmed' as const },
  { id: 2, nome: 'Giulia Bianchi', data: '2026-06-15', ora: '20:30', persone: 2, stato: 'pending' as const },
  { id: 3, nome: 'Luca Ferretti', data: '2026-06-16', ora: '19:30', persone: 6, stato: 'confirmed' as const },
  { id: 4, nome: 'Sofia Marino', data: '2026-06-16', ora: '21:00', persone: 3, stato: 'pending' as const },
  { id: 5, nome: 'Andrea Conti', data: '2026-06-17', ora: '20:00', persone: 5, stato: 'cancelled' as const },
]

const initialEventi = [
  { id: 1, title: 'Serata DJ — Giovedì Beat', date: '2026-06-19', desc: 'Musica dal vivo con DJ resident ogni giovedì sera.', active: true },
  { id: 2, title: 'Burger Festival Weekend', date: '2026-06-20', desc: 'Menu speciale con 5 burger in edizione limitata per il weekend.', active: true },
  { id: 3, title: 'Apertura Terrazza Estiva', date: '2026-07-01', desc: 'Inaugurazione del nuovo spazio esterno con cocktail di benvenuto.', active: false },
]

const initialClienti = [
  { id: 1, nome: 'Marco Rossi', telefono: '+39 333 123 4567', email: 'marco.rossi@email.it', prenotazioni: 12, ultima: '2026-06-10', pref: 'Truffle Bloom, no cipolla', note: 'Cliente fedele, preferisce tavolo finestra' },
  { id: 2, nome: 'Giulia Bianchi', telefono: '+39 347 987 6543', email: 'giulia.b@email.it', prenotazioni: 7, ultima: '2026-06-08', pref: 'Green Poppy, Vegan Power', note: 'Vegana, allergia arachidi' },
  { id: 3, nome: 'Luca Ferretti', telefono: '+39 320 456 7890', email: 'l.ferretti@email.it', prenotazioni: 18, ultima: '2026-06-12', pref: 'BBQ Beast, Loaded Fries', note: 'Prenota spesso per gruppi di lavoro' },
  { id: 4, nome: 'Sofia Marino', telefono: '+39 348 234 5678', email: 'sofia.m@email.it', prenotazioni: 4, ultima: '2026-06-01', pref: 'Chicken Caesar Bowl', note: '' },
  { id: 5, nome: 'Andrea Conti', telefono: '+39 331 876 5432', email: 'a.conti@email.it', prenotazioni: 9, ultima: '2026-06-09', pref: 'Poppy Classic, Poppy Shake', note: 'Compleanno il 23 luglio' },
  { id: 6, nome: 'Elena Romano', telefono: '+39 349 543 2109', email: 'e.romano@email.it', prenotazioni: 22, ultima: '2026-06-13', pref: 'Truffle Bloom, Brownie Sundae', note: 'Cliente VIP' },
]

const initialTesti = {
  nomeRistorante: 'Burger Republic',
  tagline: 'Smash Burgers & Good Vibes',
  descrizione: 'Burger Republic è il posto dove i sapori autentici incontrano un\'atmosfera rilassata e accogliente. I nostri smash burger sono preparati con ingredienti freschi ogni giorno, cotti al momento per darti il massimo gusto ad ogni morso.',
  heroHeadline: 'Il Burger che non ti aspetti',
  heroSubheadline: 'Smash burgers artigianali, bowls freschi e vibes uniche nel cuore della città.',
  aboutTitle: 'La nostra storia',
  aboutText: 'Nati dalla passione per il cibo vero, Burger Republic ha aperto le sue porte con una missione semplice: portare in tavola hamburger onesti, ingredienti di qualità e un\'esperienza che vale il viaggio.',
  seoTitle: 'Burger Republic — Smash Burgers & Bowls | Ristorante',
  seoDesc: 'Burger Republic serve i migliori smash burger artigianali, bowls freschi e dolci fatti in casa. Visita il nostro ristorante e scopri il gusto autentico.',
  keywords: 'smash burger, bowls, ristorante, hamburger artigianale, Burger Republic',
}

function LockedOverlay({ message }: { message: string }) {
  const [showModal, setShowModal] = useState(false)
  const requiredTier = message.includes('Premium') ? 'premium' : 'pro'
  const tierColor = requiredTier === 'premium' ? '#e52d1d' : '#a78bfa'
  const tierLabel = requiredTier === 'premium' ? 'Premium' : 'Pro'

  return (
    <>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(15,15,15,0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        borderRadius: 8,
        padding: 24,
        textAlign: 'center',
      }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${tierColor}, ${tierColor}88)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          fontSize: 24,
          boxShadow: `0 12px 32px ${tierColor}55`,
        }}>✦</div>
        <p style={{ color: C.text, fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: 22, fontWeight: 400, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{message}</p>
        <p style={{ color: C.muted, fontSize: 13, margin: '0 0 22px', maxWidth: 380, lineHeight: 1.5 }}>Sblocca questa sezione e tante altre funzionalità per far crescere il tuo locale.</p>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '12px 28px',
            background: tierColor,
            color: '#fff',
            border: 'none',
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'transform 0.25s, box-shadow 0.25s',
            boxShadow: `0 12px 28px ${tierColor}50`,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          Passa a {tierLabel} ↗
        </button>
      </div>
      {showModal && <UpgradeModal onClose={() => setShowModal(false)} />}
    </>
  )
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const plans = [
    { key: 'basic', name: 'Basic', accent: '#888', price: '49', tagline: 'Per cominciare', features: ['Sito completo online', 'Menu con allergeni', 'Orari + contatti', 'Chef + FAQ', 'Galleria foto'] },
    { key: 'pro', name: 'Pro', accent: '#a78bfa', price: '89', tagline: 'Più scelto', highlight: true, features: ['Tutto Basic +', 'Prenotazioni online', 'Eventi & comunicazioni', 'Newsletter', 'Recensioni gestite', 'Dominio personalizzato'] },
    { key: 'premium', name: 'Premium', accent: '#e52d1d', price: '149', tagline: 'Controllo totale', features: ['Tutto Pro +', 'Foto upload custom', 'Modifica testi', 'CRM clienti', 'Cambio template live', 'WhatsApp bot Ezio', 'Supporto prioritario'] },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0f0f12',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '32px 28px',
        maxWidth: 1000,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: 14, right: 14,
          width: 32, height: 32,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>×</button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#a78bfa', margin: '0 0 12px', fontWeight: 600 }}>✦ aggiorna il piano</p>
          <h2 style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 300, letterSpacing: '-0.03em', margin: 0, color: '#fff' }}>
            Sblocca tutto il <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #e52d1d, #a78bfa)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>potenziale</em>.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="upm-grid">
          {plans.map(p => (
            <div key={p.key} style={{
              padding: '24px 18px',
              background: p.highlight ? 'linear-gradient(180deg, rgba(167,139,250,0.1), rgba(20,20,22,0.7))' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${p.highlight ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 16,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {p.highlight && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', padding: '4px 12px', background: '#a78bfa', color: '#0a0a0a', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 100 }}>{p.tagline}</div>
              )}
              <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: '1.7rem', fontWeight: 400, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{p.name}</h3>
              {!p.highlight && <p style={{ color: '#888', fontSize: 12, margin: '0 0 14px' }}>{p.tagline}</p>}
              {p.highlight && <div style={{ height: 14 }} />}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                <span style={{ color: '#888', fontSize: 14 }}>€</span>
                <span style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: '2.6rem', fontWeight: 400, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{p.price}</span>
                <span style={{ color: '#666', fontSize: 11 }}>/ mese</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', flex: 1 }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', color: '#ccc', fontSize: 12.5, lineHeight: 1.4 }}>
                    <span style={{ flexShrink: 0, width: 14, height: 14, borderRadius: '50%', background: 'rgba(34,197,94,0.18)', color: '#22c55e', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/pricing" style={{
                display: 'block',
                padding: '11px 16px',
                background: p.highlight ? '#a78bfa' : p.accent === '#888' ? 'rgba(255,255,255,0.06)' : p.accent,
                color: p.highlight ? '#0a0a0a' : '#fff',
                textDecoration: 'none',
                textAlign: 'center',
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                borderRadius: 10,
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >Scegli {p.name}</a>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#666', fontSize: 11, marginTop: 22, marginBottom: 0 }}>
          Cambi piano quando vuoi. Disdici quando vuoi. Niente vincoli.
        </p>

        <style>{`
          @media (max-width: 768px) {
            .upm-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent, trend, icon }: { label: string; value: string; accent?: string; trend?: string; icon?: React.ReactNode }) {
  return (
    <div
      className="lum-stat-card"
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
        e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
      }}
      style={accent ? { ['--accent-glow' as any]: accent } : undefined}
    >
      <div className="lum-stat-card-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ color: C.muted, fontSize: 11, margin: 0, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
          {icon && <span style={{ opacity: 0.5 }}>{icon}</span>}
        </div>
        <p className="lum-stat-value" style={{ margin: 0 }}>{value}</p>
        {trend && <p style={{ color: '#22c55e', fontSize: 12, margin: '8px 0 0', fontWeight: 600 }}>{trend}</p>}
      </div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, background: value ? '#22c55e' : '#333', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.15s' }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
    </div>
  )
}

function InputStyle(extra?: React.CSSProperties): React.CSSProperties {
  return { background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 6, color: C.text, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', ...extra }
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>{children}</h2>
}

function AddEventForm({ onAdd, onCancel }: { onAdd: (title: string, desc: string, date: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  return (
    <div className="lum-card" style={{ marginBottom: 18, padding: 22 }}>
      <div className="lum-card-content">
        <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: 18, fontWeight: 400, color: C.text, margin: '0 0 14px' }}>Nuovo evento</h3>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Titolo (es. Live Jazz Friday)" style={{ marginBottom: 10, fontWeight: 600 }} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ marginBottom: 10 }} />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Descrizione dell'evento" style={{ marginBottom: 14, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="lum-btn-ghost" onClick={onCancel}>Annulla</button>
          <button className="lum-btn-primary" onClick={() => { if (title.trim()) onAdd(title.trim(), desc.trim(), date) }}>Crea evento</button>
        </div>
      </div>
    </div>
  )
}

function AddDishForm({ onAdd, onCancel }: { onAdd: (name: string, desc: string, price: number) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState('')
  return (
    <div className="lum-menu-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: 18, background: 'rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nome piatto (es. Truffle Burger)" />
        <input type="number" step="0.5" value={price} onChange={e => setPrice(e.target.value)} placeholder="Prezzo €" />
      </div>
      <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Descrizione breve" />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="lum-btn-ghost" onClick={onCancel}>Annulla</button>
        <button className="lum-btn-primary" onClick={() => { if (name.trim()) onAdd(name.trim(), desc.trim(), parseFloat(price) || 0) }}>Aggiungi piatto</button>
      </div>
    </div>
  )
}

function PageHeader({ eyebrow, title, accent, sub, action }: { eyebrow: string; title: React.ReactNode; accent?: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="lum-page-header">
      <div>
        <p className="lum-page-eyebrow">{eyebrow}</p>
        <h1 className="lum-page-title">{title}</h1>
        {sub && <p className="lum-page-sub">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── PAGES ────────────────────────────────────────────────────────────────────

function DashboardPage({ goTo }: { goTo: (n: NavItem) => void }) {
  const recentRes = [
    { nome: 'Marco Rossi', data: '15 Giu', ora: '20:00', persone: 4, stato: 'Confermata' },
    { nome: 'Giulia Bianchi', data: '15 Giu', ora: '20:30', persone: 2, stato: 'In attesa' },
    { nome: 'Luca Ferretti', data: '16 Giu', ora: '19:30', persone: 6, stato: 'Confermata' },
    { nome: 'Sofia Marino', data: '16 Giu', ora: '21:00', persone: 3, stato: 'In attesa' },
    { nome: 'Andrea Conti', data: '17 Giu', ora: '20:00', persone: 5, stato: 'Cancellata' },
  ]
  const statoColor = (s: string) => s === 'Confermata' ? '#22c55e' : s === 'In attesa' ? '#f59e0b' : '#ef4444'

  return (
    <div>
      {/* Hero greeting */}
      <div className="lum-hero">
        <p className="lum-hero-eyebrow">Buongiorno, Burger Republic ✦</p>
        <h1 className="lum-hero-title">
          <span style={{ display: 'inline-block' }}>Il tuo sito</span>{' '}
          <em>brilla</em> oggi.
        </h1>
        <div className="lum-hero-meta">
          <span className="lum-hero-pulse" /> Sito online · ultimo update 2 ore fa
        </div>
      </div>

      {/* Bento stats grid */}
      <div className="lum-bento-stats">
        <div className="lum-bento-cell lum-bento-large">
          <StatCard label="Visite al sito · 7 giorni" value="1.843" trend="↑ 12% vs settimana scorsa" />
        </div>
        <div className="lum-bento-cell">
          <StatCard label="Visite al sito · oggi" value="247" accent="#a78bfa" />
        </div>
        <div className="lum-bento-cell">
          <StatCard label="Prenotazioni · 7gg" value="12" accent="#f0abfc" trend="+3 oggi" />
        </div>
        <div className="lum-bento-cell">
          <StatCard label="Piatti nel menu" value="15" accent="#60a5fa" />
        </div>
        <div className="lum-bento-cell lum-bento-wide">
          <div className="lum-quick-actions">
            <p style={{ color: C.muted, fontSize: 11, margin: 0, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>Azioni rapide</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <button className="lum-action-btn" onClick={() => goTo('Menu')}>+ Piatto</button>
              <button className="lum-action-btn" onClick={() => goTo('Eventi')}>+ Evento</button>
              <button className="lum-action-btn" onClick={() => window.open('/preview', '_blank')}>Vedi sito ↗</button>
              <button className="lum-action-btn" onClick={() => goTo('Menu')}>Anteprima menu</button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent reservations */}
      <div className="lum-section-card" style={{ marginTop: 24 }}>
        <div className="lum-section-header">
          <p style={{ color: C.text, fontWeight: 600, fontSize: 14, margin: 0 }}>Ultime prenotazioni</p>
          <span style={{ color: C.muted, fontSize: 12 }}>{recentRes.length} totali</span>
        </div>
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Nome', 'Data', 'Ora', 'Persone', 'Stato'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 24px', color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentRes.map((r, i) => (
              <tr key={i} className="lum-table-row" style={{ borderBottom: i < recentRes.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <td style={{ padding: '14px 24px', color: C.text, fontSize: 13, fontWeight: 500 }}>{r.nome}</td>
                <td style={{ padding: '14px 24px', color: C.muted, fontSize: 13 }}>{r.data}</td>
                <td style={{ padding: '14px 24px', color: C.muted, fontSize: 13 }}>{r.ora}</td>
                <td style={{ padding: '14px 24px', color: C.muted, fontSize: 13 }}>{r.persone}</td>
                <td style={{ padding: '14px 24px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 100,
                    background: statoColor(r.stato) + '20',
                    color: statoColor(r.stato),
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statoColor(r.stato) }} />
                    {r.stato}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}

function MenuPage() {
  const [menu, setMenu] = useState(initialMenuData)
  const [editing, setEditing] = useState<{ catIdx: number; itemId: number } | null>(null)
  const [adding, setAdding] = useState<number | null>(null)  // catIdx
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  const toggleAvailable = (catIdx: number, itemId: number) => {
    setMenu(prev => prev.map((cat, ci) => ci !== catIdx ? cat : {
      ...cat,
      items: cat.items.map(it => it.id === itemId ? { ...it, available: !it.available } : it)
    }))
  }
  const updateItem = (catIdx: number, itemId: number, patch: any) => {
    setMenu(prev => prev.map((cat, ci) => ci !== catIdx ? cat : {
      ...cat,
      items: cat.items.map(it => it.id === itemId ? { ...it, ...patch } : it)
    }))
  }
  const deleteItem = (catIdx: number, itemId: number) => {
    setMenu(prev => prev.map((cat, ci) => ci !== catIdx ? cat : {
      ...cat,
      items: cat.items.filter(it => it.id !== itemId)
    }))
  }
  const addItem = (catIdx: number, name: string, desc: string, price: number) => {
    setMenu(prev => prev.map((cat, ci) => ci !== catIdx ? cat : {
      ...cat,
      items: [...cat.items, { id: Date.now(), name, desc, price, available: true }]
    }))
    setAdding(null)
  }
  const addCategory = (name: string) => {
    if (!name.trim()) return
    setMenu(prev => [...prev, { category: name.trim(), items: [] }])
    setNewCategoryName('')
    setShowNewCategory(false)
  }
  const deleteCategory = (catIdx: number) => {
    if (!confirm('Eliminare la categoria e tutti i suoi piatti?')) return
    setMenu(prev => prev.filter((_, i) => i !== catIdx))
  }
  const totalDishes = menu.reduce((s, c) => s + c.items.length, 0)

  return (
    <div>
      <PageHeader
        eyebrow="✦ la carta"
        title={<>Il tuo <em>menu</em></>}
        sub={`${totalDishes} piatti in ${menu.length} categorie. Trascina per riordinare, attiva/disattiva con il toggle.`}
      />

      {menu.map((cat, ci) => (
        <div key={ci} className="lum-menu-cat-card">
          <div className="lum-menu-cat-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 className="lum-menu-cat-title">{cat.category}</h3>
              <span className="lum-menu-cat-count">{cat.items.length} piatti</span>
            </div>
            <button className="lum-btn-danger" onClick={() => deleteCategory(ci)}>Elimina categoria</button>
          </div>
          <div className="lum-section-card" style={{ marginBottom: 10 }}>
            {cat.items.map((item) => editing?.catIdx === ci && editing?.itemId === item.id ? (
              <div key={item.id} className="lum-menu-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: 18, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <input value={item.name} onChange={e => updateItem(ci, item.id, { name: e.target.value })} placeholder="Nome piatto" />
                  <input type="number" step="0.5" value={item.price} onChange={e => updateItem(ci, item.id, { price: parseFloat(e.target.value) || 0 })} placeholder="Prezzo €" />
                </div>
                <textarea value={item.desc} onChange={e => updateItem(ci, item.id, { desc: e.target.value })} rows={2} placeholder="Descrizione" />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="lum-btn-danger" onClick={() => deleteItem(ci, item.id)}>Elimina</button>
                  <button className="lum-btn-primary" onClick={() => setEditing(null)}>Fatto</button>
                </div>
              </div>
            ) : (
              <div key={item.id} className="lum-menu-row">
                <Toggle value={item.available} onChange={() => toggleAvailable(ci, item.id)} />
                <div className="lum-menu-row-info">
                  <p className="lum-menu-row-name">{item.name}</p>
                  <p className="lum-menu-row-desc">{item.desc}</p>
                </div>
                <span className="lum-menu-row-price">€{item.price}</span>
                <button className="lum-btn-ghost" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setEditing({ catIdx: ci, itemId: item.id })}>Modifica</button>
              </div>
            ))}
            {adding === ci && (
              <AddDishForm onCancel={() => setAdding(null)} onAdd={(n, d, p) => addItem(ci, n, d, p)} />
            )}
          </div>
          {adding !== ci && (
            <button className="lum-btn-ghost" style={{ marginTop: 4 }} onClick={() => setAdding(ci)}>+ Aggiungi piatto</button>
          )}
        </div>
      ))}
      {showNewCategory && (
        <div className="lum-card" style={{ marginBottom: 16, padding: 18 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nome categoria (es. Antipasti)" autoFocus onKeyDown={e => { if (e.key === 'Enter') addCategory(newCategoryName) }} />
            <button className="lum-btn-primary" onClick={() => addCategory(newCategoryName)}>Aggiungi</button>
            <button className="lum-btn-ghost" onClick={() => { setShowNewCategory(false); setNewCategoryName('') }}>Annulla</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' }}>
        {!showNewCategory && <button className="lum-btn-ghost" onClick={() => setShowNewCategory(true)}>+ Nuova categoria</button>}
        <SaveButton
          label="Salva menu"
          onSave={() => saveMenuItems(
            menu.flatMap(cat => cat.items.map((it, idx) => ({
              category: cat.category,
              name: it.name,
              description: it.desc,
              price: it.price,
              available: it.available,
              display_order: idx,
            })))
          )}
        />
      </div>
    </div>
  )
}

function OrariPage() {
  const [orari, setOrari] = useState(initialOrari)
  const update = (i: number, field: string, val: string | boolean) => {
    setOrari(prev => prev.map((o, idx) => idx !== i ? o : { ...o, [field]: val }))
  }
  return (
    <div>
      <PageHeader
        eyebrow="✦ il calendario"
        title={<>Orari di <em>apertura</em></>}
        sub="Quando siete aperti, quando chiusi. Aggiorna in tempo reale sul tuo sito."
      />
      <div style={{ marginBottom: 24 }}>
        {orari.map((o, i) => (
          <div key={i} className={`lum-day-card ${o.closed ? 'closed' : ''}`}>
            <span className="lum-day-card-day">{o.day}</span>
            <input type="time" value={o.open} onChange={e => update(i, 'open', e.target.value)} disabled={o.closed} />
            <input type="time" value={o.close} onChange={e => update(i, 'close', e.target.value)} disabled={o.closed} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: C.muted, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>{o.closed ? 'Chiuso' : 'Aperto'}</span>
              <Toggle value={!o.closed} onChange={v => update(i, 'closed', !v)} />
            </div>
          </div>
        ))}
      </div>
      <SaveButton
        label="Salva orari"
        onSave={() => {
          // Map Italian day name → 3-letter code expected by site_content.opening_hours
          const dayMap: Record<string, string> = { 'Lunedì': 'mon', 'Martedì': 'tue', 'Mercoledì': 'wed', 'Giovedì': 'thu', 'Venerdì': 'fri', 'Sabato': 'sat', 'Domenica': 'sun' }
          const hours: Record<string, { open: string; close: string; closed: boolean }> = {}
          orari.forEach(o => { hours[dayMap[o.day] || o.day] = { open: o.open, close: o.close, closed: o.closed } })
          // opening_hours isn't in SiteContentInput yet — passing as extra field via cast
          return saveSiteContent({ ...(({ opening_hours: hours }) as any) } as any)
        }}
      />
    </div>
  )
}

function PrenotazioniPage({ tier }: { tier: Tier }) {
  const [items, setItems] = useState(initialPrenotazioni)
  const statoStyle = (s: string): React.CSSProperties => ({
    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
    background: s === 'confirmed' ? 'rgba(34,197,94,0.15)' : s === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
    color: s === 'confirmed' ? '#22c55e' : s === 'pending' ? '#f59e0b' : '#ef4444',
  })
  const update = async (id: number, stato: 'confirmed' | 'cancelled') => {
    // Optimistic local update
    setItems(prev => prev.map(r => r.id === id ? { ...r, stato } : r))
    // Try to call the real backend (will be no-op for demo numeric IDs, real for UUIDs)
    try {
      const { updateReservationStatus } = await import('./actions/site')
      await updateReservationStatus(String(id), stato)
    } catch (e) {
      // silently ignore for demo data
    }
  }

  const pending = items.filter(i => i.stato === 'pending').length
  return (
    <div style={{ position: 'relative' }}>
      {tier === 'basic' && <LockedOverlay message="Passa a Pro per gestire le prenotazioni" />}
      <PageHeader
        eyebrow="✦ il tavolo"
        title={<>Le tue <em>prenotazioni</em></>}
        sub={`${items.length} totali, ${pending} in attesa di conferma. Conferma o rifiuta direttamente da qui.`}
      />
      <div className="lum-section-card">
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Nome', 'Data', 'Ora', 'Persone', 'Stato', 'Azioni'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '14px 22px', color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={r.id} className="lum-table-row" style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td style={{ padding: '14px 22px', color: C.text, fontSize: 14, fontWeight: 600 }}>{r.nome}</td>
                <td style={{ padding: '14px 22px', color: C.muted, fontSize: 13 }}>{r.data}</td>
                <td style={{ padding: '14px 22px', color: C.muted, fontSize: 13, fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontWeight: 500 }}>{r.ora}</td>
                <td style={{ padding: '14px 22px', color: C.muted, fontSize: 13 }}>{r.persone}</td>
                <td style={{ padding: '14px 22px' }}>
                  <span className="lum-pill" style={statoStyle(r.stato)}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.stato === 'confirmed' ? '#22c55e' : r.stato === 'pending' ? '#f59e0b' : '#ef4444' }} />
                    {r.stato === 'confirmed' ? 'Confermata' : r.stato === 'pending' ? 'In attesa' : 'Cancellata'}
                  </span>
                </td>
                <td style={{ padding: '14px 22px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {r.stato !== 'confirmed' && <button onClick={() => update(r.id, 'confirmed')} className="lum-btn-ghost" style={{ padding: '5px 12px', fontSize: 11, color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}>Conferma</button>}
                    {r.stato !== 'cancelled' && <button onClick={() => update(r.id, 'cancelled')} className="lum-btn-danger">Cancella</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}

function EventiPage({ tier }: { tier: Tier }) {
  const [eventi, setEventi] = useState(initialEventi)
  const [editing, setEditing] = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)
  const toggleActive = (id: number) => setEventi(prev => prev.map(e => e.id === id ? { ...e, active: !e.active } : e))
  const updateEv = (id: number, patch: any) => setEventi(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  const deleteEv = (id: number) => setEventi(prev => prev.filter(e => e.id !== id))
  const addEv = (title: string, desc: string, date: string) => {
    setEventi(prev => [{ id: Date.now(), title, desc, date, active: true }, ...prev])
    setShowNew(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      {tier === 'basic' && <LockedOverlay message="Passa a Pro per gestire gli eventi" />}
      <PageHeader
        eyebrow="✦ in programma"
        title={<>I tuoi <em>eventi</em></>}
        sub="Serate speciali, live music, brunch, degustazioni. Tutto quello che fa tornare la gente."
        action={!showNew ? <button className="lum-btn-primary" onClick={() => setShowNew(true)}>+ Nuovo evento</button> : null}
      />
      {showNew && <AddEventForm onCancel={() => setShowNew(false)} onAdd={addEv} />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {eventi.map(e => {
          const d = new Date(e.date)
          if (editing === e.id) {
            return (
              <div key={e.id} className="lum-event-card" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <input value={e.title} onChange={ev => updateEv(e.id, { title: ev.target.value })} placeholder="Titolo evento" style={{ marginBottom: 10, fontWeight: 600 }} />
                <input type="date" value={e.date} onChange={ev => updateEv(e.id, { date: ev.target.value })} style={{ marginBottom: 10 }} />
                <textarea value={e.desc} onChange={ev => updateEv(e.id, { desc: ev.target.value })} rows={3} placeholder="Descrizione" style={{ marginBottom: 10, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="lum-btn-danger" onClick={() => { deleteEv(e.id); setEditing(null) }}>Elimina</button>
                  <button className="lum-btn-primary" onClick={() => setEditing(null)}>Fatto</button>
                </div>
              </div>
            )
          }
          return (
            <div key={e.id} className="lum-event-card">
              <div className="lum-event-date">
                <span className="lum-event-date-day">{d.getDate().toString().padStart(2, '0')}</span>
                <span className="lum-event-date-month">{d.toLocaleDateString('it-IT', { month: 'short' })}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                <h3 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{e.title}</h3>
                <Toggle value={e.active} onChange={() => toggleActive(e.id)} />
              </div>
              <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{e.desc}</p>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="lum-pill" style={{ background: e.active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: e.active ? '#22c55e' : C.muted }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.active ? '#22c55e' : C.muted }} />
                  {e.active ? 'Visibile sul sito' : 'Nascosto'}
                </span>
                <button className="lum-btn-ghost" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setEditing(e.id)}>Modifica</button>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 20 }}>
        <SaveButton
          label="Salva eventi"
          onSave={() => saveEvents(eventi.map(e => ({ title: e.title, description: e.desc, event_date: e.date, active: e.active })))}
        />
      </div>
    </div>
  )
}

function FotoPage({ tier }: { tier: Tier }) {
  const [logoUrl, setLogoUrl] = useState('')
  const [heroUrl, setHeroUrl] = useState('')
  const [aboutUrl, setAboutUrl] = useState('')
  const [gallery, setGallery] = useState<string[]>(['', '', '', '', '', ''])

  const imgZone = (val: string, onChange: (v: string) => void, label: string, h: number) => (
    <div style={{
      background: val ? 'transparent' : 'rgba(255,255,255,0.025)',
      border: val ? '1px solid rgba(255,255,255,0.08)' : '1px dashed rgba(255,255,255,0.12)',
      borderRadius: 12,
      height: h,
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {val ? (
        <>
          <img src={val} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <button onClick={() => onChange('')} style={{ position: 'absolute', top: 8, right: 8, padding: '4px 10px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Rimuovi</button>
        </>
      ) : (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 14, textAlign: 'center', gap: 6 }}>
          <span style={{ fontSize: 22, opacity: 0.4 }}>⬆</span>
          <span style={{ color: C.muted, fontSize: 12, fontWeight: 600 }}>{label}</span>
          <input
            placeholder="Incolla URL foto..."
            value={val}
            onChange={e => onChange(e.target.value)}
            style={{ marginTop: 4, fontSize: 11, padding: '6px 10px', maxWidth: 280 }}
          />
        </div>
      )}
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      {tier !== 'premium' && <LockedOverlay message="Passa a Premium per gestire le foto" />}
      <PageHeader
        eyebrow="✦ l'occhio"
        title={<>Foto & <em>gallery</em></>}
        sub="Le foto sono il primo motivo che convince qualcuno a entrare. Carica le migliori, alta risoluzione."
      />

      {/* LOGO upload */}
      <div className="lum-card" style={{ marginBottom: 24, padding: 22 }}>
        <div className="lum-card-content">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: 20, fontWeight: 400, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>Il tuo <em style={{ color: C.accent }}>logo</em></h3>
            <span style={{ color: C.muted, fontSize: 12 }}>Apparirà su hero, header e mobile bar</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 18, alignItems: 'center' }} className="lum-chef-grid-2">
            <div style={{ aspectRatio: '1', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
              ) : (
                <span style={{ color: C.muted, fontSize: 11, textAlign: 'center', padding: 12 }}>Nessun logo<br />caricato</span>
              )}
            </div>
            <div>
              <label style={{ color: C.muted, fontSize: 11, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>URL del logo</label>
              <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://... (PNG o SVG con sfondo trasparente)" style={{ marginBottom: 8 }} />
              <p style={{ color: C.muted, fontSize: 11, lineHeight: 1.5, margin: 0 }}>Consigliato: SVG o PNG ad alta risoluzione con sfondo trasparente. Lo facciamo lavorare bene sia su sfondo chiaro che scuro.</p>
              <div style={{ marginTop: 10 }}>
                <SaveButton label="Salva logo" onSave={() => saveSiteContent({ ...({ logo_url: logoUrl } as any) })} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HERO + ABOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }} className="lum-chef-grid-2">
        <div>
          <p style={{ color: C.muted, fontSize: 11, marginBottom: 10, marginTop: 0, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>Hero — copertina</p>
          {imgZone(heroUrl, setHeroUrl, 'Hero image', 240)}
        </div>
        <div>
          <p style={{ color: C.muted, fontSize: 11, marginBottom: 10, marginTop: 0, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>About — storia</p>
          {imgZone(aboutUrl, setAboutUrl, 'About image', 240)}
        </div>
      </div>

      {/* GALLERY */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ color: C.muted, fontSize: 11, margin: 0, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>Gallery — atmosfera, piatti, dettagli</p>
          <button className="lum-btn-ghost" onClick={() => setGallery([...gallery, ''])}>+ Aggiungi slot</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {gallery.map((url, i) => (
            <div key={i}>
              {imgZone(url, v => setGallery(gallery.map((u, idx) => idx === i ? v : u)), `Foto ${i + 1}`, 160)}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <SaveButton label="Salva foto" onSave={() => saveSiteContent({ ...({ hero_image_url: heroUrl, about_image_url: aboutUrl, gallery_images: gallery.filter(Boolean).map(url => ({ url, alt: '', caption: '' })) } as any) })} />
        </div>
      </div>
    </div>
  )
}

function TestiPage({ tier }: { tier: Tier }) {
  const [t, setT] = useState(initialTesti)
  const set = (k: keyof typeof initialTesti, v: string) => setT(prev => ({ ...prev, [k]: v }))
  const field = (label: string, k: keyof typeof initialTesti, multiline?: boolean) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6 }}>{label}</label>
      {multiline
        ? <textarea value={t[k]} onChange={e => set(k, e.target.value)} rows={3} style={{ ...InputStyle(), resize: 'vertical' as const }} />
        : <input value={t[k]} onChange={e => set(k, e.target.value)} style={InputStyle()} />
      }
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      {tier !== 'premium' && <LockedOverlay message="Passa a Premium per modificare i testi" />}
      <PageHeader
        eyebrow="✦ la voce"
        title={<>I <em>testi</em> del sito</>}
        sub="Ogni parola che il visitatore legge. Sii sincero, breve, specifico. Le persone si stancano subito dei testi gonfi."
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }} className="lum-chef-grid-2">
        <div className="lum-card" style={{ padding: 24 }} onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--my', `${((e.clientY-r.top)/r.height)*100}%`); }}>
          <div className="lum-card-content">
            <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: 22, fontWeight: 400, color: C.text, margin: '0 0 18px', letterSpacing: '-0.02em' }}>Informazioni <em style={{ color: C.accent }}>generali</em></h3>
            {field('Nome ristorante', 'nomeRistorante')}
            {field('Tagline', 'tagline')}
            {field('Descrizione', 'descrizione', true)}
            {field('Hero headline', 'heroHeadline')}
            {field('Hero subheadline', 'heroSubheadline')}
            {field('About title', 'aboutTitle')}
            {field('About text', 'aboutText', true)}
          </div>
        </div>
        <div className="lum-card" style={{ padding: 24, alignSelf: 'flex-start' }} onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--my', `${((e.clientY-r.top)/r.height)*100}%`); }}>
          <div className="lum-card-content">
            <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: 22, fontWeight: 400, color: C.text, margin: '0 0 18px', letterSpacing: '-0.02em' }}>SEO & <em style={{ color: C.accent }}>ricerca</em></h3>
            {field('SEO Title', 'seoTitle')}
            {field('SEO Description', 'seoDesc', true)}
            {field('Keywords (separate da virgola)', 'keywords')}
            <p style={{ color: C.muted, fontSize: 11, lineHeight: 1.6, marginTop: 16 }}>Questi testi compaiono solo su Google quando qualcuno cerca il tuo locale. Tieni il titolo breve (60 caratteri) e la descrizione concreta (160 caratteri).</p>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <SaveButton
          label="Salva testi"
          onSave={() => saveSiteContent({
            description: t.descrizione,
            tagline: t.tagline,
            about: t.aboutText,
          })}
        />
      </div>
    </div>
  )
}

function CRMPage({ tier }: { tier: Tier }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const totalReservations = initialClienti.reduce((sum, c) => sum + c.prenotazioni, 0)
  const recentCount = initialClienti.filter(c => c.ultima >= '2026-06-01').length
  return (
    <div style={{ position: 'relative' }}>
      {tier !== 'premium' && <LockedOverlay message="Passa a Premium per accedere al CRM clienti" />}
      <PageHeader
        eyebrow="✦ chi torna"
        title={<>I tuoi <em>habitué</em></>}
        sub="Clienti riconosciuti dal numero di telefono o dall'email. Sapere cosa preferiscono ti fa partire avanti."
      />
      <div className="lum-bento-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 22 }}>
        <div className="lum-bento-cell"><StatCard label="Clienti attivi" value={initialClienti.length.toString()} accent="#a78bfa" /></div>
        <div className="lum-bento-cell"><StatCard label="Prenotazioni totali" value={totalReservations.toString()} accent="#60a5fa" /></div>
        <div className="lum-bento-cell"><StatCard label="Attivi questo mese" value={recentCount.toString()} accent="#22c55e" /></div>
      </div>
      <div className="lum-section-card">
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Nome', 'Telefono', 'Email', 'Prenotazioni', 'Ultima prenotazione'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 20px', color: C.muted, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialClienti.map((c, i) => (
              <>
                <tr key={c.id} onClick={() => setExpanded(expanded === c.id ? null : c.id)} style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 20px', color: C.text, fontSize: 13, fontWeight: 500 }}>{c.nome}</td>
                  <td style={{ padding: '12px 20px', color: C.muted, fontSize: 13 }}>{c.telefono}</td>
                  <td style={{ padding: '12px 20px', color: C.muted, fontSize: 13 }}>{c.email}</td>
                  <td style={{ padding: '12px 20px', color: C.accent, fontSize: 13, fontWeight: 600 }}>{c.prenotazioni}</td>
                  <td style={{ padding: '12px 20px', color: C.muted, fontSize: 13 }}>{c.ultima}</td>
                </tr>
                {expanded === c.id && (
                  <tr key={`exp-${c.id}`} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td colSpan={5} style={{ padding: '12px 20px 16px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', gap: 32 }}>
                        <div>
                          <p style={{ color: C.muted, fontSize: 11, marginBottom: 4, marginTop: 0 }}>PREFERENZE</p>
                          <p style={{ color: C.text, fontSize: 13, margin: 0 }}>{c.pref || '—'}</p>
                        </div>
                        <div>
                          <p style={{ color: C.muted, fontSize: 11, marginBottom: 4, marginTop: 0 }}>NOTE</p>
                          <p style={{ color: C.text, fontSize: 13, margin: 0 }}>{c.note || '—'}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}

// ── NEW PAGES (Chef, FAQ, Recensioni, Newsletter, Personalizza) ──────────────

function ChefPage() {
  const [chef, setChef] = useState({
    name: 'Marco Vianello',
    role: 'Chef & Founder',
    quote: 'Quando ho aperto Burger Republic avevo una sola idea: portare a Padova il sapore che cercavo a Brooklyn. Niente compromessi sugli ingredienti, niente paura di sperimentare.',
    photoUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=900&q=85',
    years: 12,
    show: true,
  })
  return (
    <div>
      <PageHeader
        eyebrow="✦ il volto"
        title={<>Lo <em>chef</em></>}
        sub="Una faccia, un nome, una frase. È quello che fa percepire un ristorante reale."
        action={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ color: C.muted, fontSize: 12 }}>Mostra sul sito</span><Toggle value={chef.show} onChange={v => setChef({ ...chef, show: v })} /></div>}
      />
      <div className="lum-card" style={{ maxWidth: 820, padding: 28 }} onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--my', `${((e.clientY-r.top)/r.height)*100}%`); }}>
        <div className="lum-card-content">
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 20, marginBottom: 22, alignItems: 'flex-start' }} className="lum-chef-grid">
            <div style={{ aspectRatio: '4/5', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
              {chef.photoUrl && <img src={chef.photoUrl} alt={chef.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              {chef.years > 0 && (
                <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '4px 10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: 100, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>{chef.years} anni</div>
              )}
            </div>
            <div>
              <label style={{ color: C.muted, fontSize: 11, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>URL foto</label>
              <input value={chef.photoUrl} onChange={e => setChef({ ...chef, photoUrl: e.target.value })} placeholder="https://..." style={{ marginBottom: 10 }} />
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.55, margin: 0 }}>Una foto naturale dello chef. In cucina, davanti al locale, in azione. Sguardo verso la macchina o di lato.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }} className="lum-chef-grid-2">
            <div>
              <label style={{ color: C.muted, fontSize: 11, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Nome</label>
              <input value={chef.name} onChange={e => setChef({ ...chef, name: e.target.value })} />
            </div>
            <div>
              <label style={{ color: C.muted, fontSize: 11, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Ruolo</label>
              <input value={chef.role} onChange={e => setChef({ ...chef, role: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: C.muted, fontSize: 11, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Anni di esperienza</label>
            <input type="number" min={0} max={70} value={chef.years} onChange={e => setChef({ ...chef, years: parseInt(e.target.value) || 0 })} style={{ maxWidth: 160 }} />
          </div>
          <div>
            <label style={{ color: C.muted, fontSize: 11, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Quote / Manifesto personale</label>
            <textarea value={chef.quote} onChange={e => setChef({ ...chef, quote: e.target.value })} rows={4} style={{ resize: 'vertical', fontFamily: '"Fraunces", Georgia, serif', fontSize: 15, fontStyle: 'italic' }} />
            <p style={{ color: C.muted, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>Una frase sincera, prima persona. Niente marketing, parla come parli ai clienti al tavolo.</p>
          </div>
          <div style={{ marginTop: 22 }}>
            <SaveButton
              label="Salva chef"
              onSave={() => saveSiteContent({
                chef_name: chef.name,
                chef_role: chef.role,
                chef_quote: chef.quote,
                chef_photo_url: chef.photoUrl,
                chef_years: chef.years,
              })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function FAQPage() {
  const [faq, setFaq] = useState([
    { id: 1, q: 'Avete piatti vegani e senza glutine?', a: 'Sì, abbiamo diversi piatti vegani (Vegan Power, Sweet Fries) e senza glutine. Tutti sono marcati nel menu con icone V/GF.' },
    { id: 2, q: 'Posso venire con il mio cane?', a: 'Certo! Abbiamo una zona dehor pet-friendly. Per stare dentro al locale dipende dalla taglia, scrivici prima.' },
    { id: 3, q: 'Quanti tavoli per gruppi grandi?', a: 'Possiamo gestire gruppi fino a 24 persone con un tavolo solo. Per gruppi più grandi facciamo eventi privati.' },
  ])
  const add = () => setFaq([...faq, { id: Date.now(), q: '', a: '' }])
  const remove = (id: number) => setFaq(faq.filter(f => f.id !== id))
  const update = (id: number, key: 'q' | 'a', val: string) => setFaq(faq.map(f => f.id === id ? { ...f, [key]: val } : f))
  return (
    <div>
      <PageHeader
        eyebrow="✦ Q & A"
        title={<>Domande <em>frequenti</em></>}
        sub="Le domande che i clienti ti fanno via WhatsApp o al telefono. Rispondi qui una volta sola e risparmi tempo."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820 }}>
        {faq.map((f, i) => (
          <div key={f.id} className="lum-faq-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: `${C.accent}22`, color: C.accent, fontSize: 11, fontWeight: 700, fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}>{i + 1}</span>
              <input value={f.q} onChange={e => update(f.id, 'q', e.target.value)} placeholder="Scrivi la domanda..." style={{ fontWeight: 600, fontSize: 14 }} />
            </div>
            <textarea value={f.a} onChange={e => update(f.id, 'a', e.target.value)} placeholder="Scrivi la risposta..." rows={3} style={{ resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button onClick={() => remove(f.id)} className="lum-btn-danger">Rimuovi</button>
            </div>
          </div>
        ))}
        <button onClick={add} style={{ padding: '12px 18px', background: 'transparent', color: C.accent, border: `1px dashed ${C.accent}55`, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = `${C.accent}10` }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.accent}55`; e.currentTarget.style.background = 'transparent' }}
        >+ Aggiungi domanda</button>
        <div style={{ marginTop: 8 }}>
          <SaveButton
            label="Salva FAQ"
            onSave={() => saveSiteContent({ faq: faq.filter(f => f.q.trim() && f.a.trim()).map(f => ({ q: f.q, a: f.a })) })}
          />
        </div>
      </div>
    </div>
  )
}

function RecensioniPage({ tier }: { tier: Tier }) {
  const [reviews] = useState([
    { id: 1, author: 'Giulia M.', rating: 5, text: 'Il miglior smash burger di Padova, senza ombra di dubbio. Atmosfera bellissima.', source: 'Google', date: '2 settimane fa', show: true },
    { id: 2, author: 'Davide R.', rating: 5, text: 'Veniamo qui quasi ogni settimana. Truffle Bloom è la mia ossessione.', source: 'Tripadvisor', date: '1 mese fa', show: true },
    { id: 3, author: 'Sara P.', rating: 5, text: 'Sono vegana e finalmente un posto dove ho 5 piatti tra cui scegliere.', source: 'Google', date: '3 settimane fa', show: true },
    { id: 4, author: 'Lorenzo B.', rating: 4, text: 'Cibo eccellente, locale carino, l\'unica nota è che nel weekend l\'attesa è lunga.', source: 'TheFork', date: '1 mese fa', show: false },
  ])
  const locked = tier === 'basic'
  return (
    <div style={{ position: 'relative' }}>
      <PageHeader
        eyebrow="✦ social proof"
        title={<>Le <em>voci</em> dei clienti</>}
        sub="Recensioni sincronizzate automaticamente da Google e Tripadvisor. Mostra le migliori sul sito."
      />
      <div className="lum-card" style={{ marginBottom: 22, padding: '18px 24px' }}>
        <div className="lum-card-content" style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#eab308', fontSize: 16, letterSpacing: '0.15em', textShadow: '0 0 14px rgba(234,179,8,0.4)' }}>★★★★★</div>
            <div style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: 30, fontWeight: 400, marginTop: 6, color: C.text, letterSpacing: '-0.03em' }}>4.8 <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>/ 5</span></div>
          </div>
          <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <p style={{ color: C.muted, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Recensioni</p>
            <p style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: '4px 0 0' }}>327+</p>
          </div>
          <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <p style={{ color: C.muted, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Fonti</p>
            <p style={{ color: C.text, fontSize: 13, margin: '6px 0 0' }}>Google · Tripadvisor</p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 920 }}>
        {reviews.map(r => (
          <div key={r.id} className={`lum-review ${!r.show ? 'disabled' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#eab308', fontSize: 14, letterSpacing: '0.1em' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{r.author}</span>
                <span className="lum-pill" style={{ background: 'rgba(255,255,255,0.05)', color: C.muted }}>{r.source}</span>
                <span style={{ color: C.muted, fontSize: 11 }}>{r.date}</span>
              </div>
              <Toggle value={r.show} onChange={() => {}} />
            </div>
            <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, margin: 0, fontStyle: 'italic', fontFamily: '"Fraunces", Georgia, serif' }}>"{r.text}"</p>
          </div>
        ))}
      </div>
      {locked && <LockedOverlay message="Disponibile dal piano Pro" />}
    </div>
  )
}

function NewsletterPage({ tier }: { tier: Tier }) {
  const [subscribers] = useState([
    { id: 1, email: 'marco.rossi@email.it', date: '2026-06-10' },
    { id: 2, email: 'giulia.b@email.it', date: '2026-06-08' },
    { id: 3, email: 'l.ferretti@email.it', date: '2026-06-05' },
    { id: 4, email: 'sofia.m@email.it', date: '2026-06-01' },
  ])
  const locked = tier === 'basic'
  return (
    <div style={{ position: 'relative' }}>
      <PageHeader
        eyebrow="✦ il tuo pubblico"
        title={<>La <em>newsletter</em></>}
        sub="I clienti che hanno scelto di ricevere notizie. Mandagli novità del menu, eventi, offerte."
      />
      <div className="lum-bento-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="lum-bento-cell"><StatCard label="Iscritti totali" value={subscribers.length.toString()} accent="#a78bfa" /></div>
        <div className="lum-bento-cell"><StatCard label="Ultimi 30 giorni" value="+12" accent="#22c55e" trend="↑ 38% vs mese scorso" /></div>
        <div className="lum-bento-cell"><StatCard label="Tasso apertura" value="68%" accent="#f0abfc" /></div>
      </div>
      <div className="lum-card" style={{ marginBottom: 18, maxWidth: 820, padding: '20px 24px' }}>
        <div className="lum-card-content">
          <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: 22, fontWeight: 400, color: C.text, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Scrivi una <em style={{ color: C.accent }}>nuova mail</em></h3>
          <input placeholder="Oggetto della mail..." style={{ marginBottom: 10, fontWeight: 600 }} />
          <textarea placeholder="Scrivi il messaggio..." rows={5} style={{ resize: 'vertical', marginBottom: 14 }} />
          <button className="lum-btn-primary">Invia a {subscribers.length} iscritti</button>
        </div>
      </div>
      <div className="lum-section-card" style={{ maxWidth: 820 }}>
        <div className="lum-section-header">
          <p style={{ color: C.text, fontWeight: 600, fontSize: 14, margin: 0 }}>Lista iscritti</p>
          <button className="lum-btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }}>Esporta CSV</button>
        </div>
        {subscribers.map((s, i) => (
          <div key={s.id} className="lum-menu-row" style={{ borderBottom: i < subscribers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', background: `${C.accent}22`, color: C.accent, fontSize: 12, fontWeight: 700 }}>{s.email[0].toUpperCase()}</span>
            <div className="lum-menu-row-info">
              <p className="lum-menu-row-name">{s.email}</p>
              <p className="lum-menu-row-desc">Iscritto il {s.date}</p>
            </div>
          </div>
        ))}
      </div>
      {locked && <LockedOverlay message="Disponibile dal piano Pro" />}
    </div>
  )
}

function PersonalizzaPage({ tier, template, setTemplate, accentColor }: { tier: Tier; template: string; setTemplate: (t: string) => void; accentColor: string }) {
  const [custom, setCustom] = useState({ accent: accentColor, font: 'Inter' })
  const fonts = ['Inter', 'Playfair Display', 'Cormorant Garamond', 'Fraunces']
  const presets = ['#e52d1d', '#FF6B35', '#b58a2f', '#a78bfa', '#b8451f', '#5e8a3a', '#1e88e5', '#d63384']
  const locked = tier !== 'premium'
  return (
    <div style={{ position: 'relative' }}>
      <PageHeader
        eyebrow="✦ premium only"
        title={<>Il tuo <em>stile</em></>}
        sub="Esclusiva Premium. Scegli template, colore, font. Le modifiche si applicano in tempo reale al sito pubblico."
      />

      {/* Template picker */}
      <div className="lum-card" style={{ marginBottom: 18, padding: 24 }}>
        <div className="lum-card-content">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: 22, fontWeight: 400, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>Template</h3>
            <span style={{ color: C.muted, fontSize: 12 }}>scegli il tuo stile</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {Object.entries(TEMPLATE_ACCENTS).map(([k, v]) => (
              <div
                key={k}
                onClick={() => setTemplate(k)}
                style={{
                  padding: 14,
                  background: template === k ? `${v.accent}18` : 'rgba(255,255,255,0.025)',
                  border: `2px solid ${template === k ? v.accent : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (template !== k) e.currentTarget.style.borderColor = `${v.accent}88` }}
                onMouseLeave={e => { if (template !== k) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
              >
                <div style={{ width: '100%', height: 80, borderRadius: 8, background: `linear-gradient(135deg, ${v.accent} 0%, ${v.accent}55 100%)`, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
                  {template === k && <span style={{ position: 'absolute', top: 6, right: 6, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', background: 'rgba(0,0,0,0.4)', borderRadius: 100, backdropFilter: 'blur(8px)' }}>✓ ATTIVO</span>}
                </div>
                <p style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic' }}>{v.label}</p>
                <p style={{ color: C.muted, fontSize: 10, margin: '4px 0 0', letterSpacing: '0.1em', fontFamily: 'monospace', textTransform: 'uppercase' }}>{v.accent}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Color picker */}
      <div className="lum-card" style={{ marginBottom: 18, padding: 24 }}>
        <div className="lum-card-content">
        <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: 22, fontWeight: 400, color: C.text, margin: '0 0 18px', letterSpacing: '-0.02em' }}>Colore <em style={{ color: custom.accent }}>principale</em></h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <input type="color" value={custom.accent} onChange={e => setCustom({ ...custom, accent: e.target.value })} style={{ width: 60, height: 40, border: 'none', background: 'transparent', cursor: 'pointer' }} />
          <input value={custom.accent} onChange={e => setCustom({ ...custom, accent: e.target.value })} style={InputStyle({ maxWidth: 140 })} />
        </div>
        <p style={{ color: C.muted, fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Preset</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {presets.map(p => (
            <div key={p} onClick={() => setCustom({ ...custom, accent: p })} style={{ width: 44, height: 44, borderRadius: '50%', background: p, cursor: 'pointer', border: custom.accent === p ? `3px solid #fff` : `2px solid rgba(255,255,255,0.1)`, transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: custom.accent === p ? `0 0 20px ${p}77` : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            />
          ))}
        </div>
        </div>
      </div>

      {/* Font picker */}
      <div className="lum-card" style={{ marginBottom: 18, padding: 24 }}>
        <div className="lum-card-content">
        <h3 style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: 22, fontWeight: 400, color: C.text, margin: '0 0 18px', letterSpacing: '-0.02em' }}>Font dei <em style={{ color: custom.accent }}>titoli</em></h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {fonts.map(f => (
            <div
              key={f}
              onClick={() => setCustom({ ...custom, font: f })}
              style={{
                padding: '18px 22px',
                background: custom.font === f ? `${custom.accent}15` : 'rgba(255,255,255,0.025)',
                border: `2px solid ${custom.font === f ? custom.accent : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: f,
                transition: 'all 0.25s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (custom.font !== f) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={e => { if (custom.font !== f) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
            >
              <p style={{ color: C.text, fontSize: 19, margin: 0, fontWeight: 500, fontStyle: f.includes('Fraunces') || f.includes('Cormorant') ? 'italic' : 'normal' }}>{f}</p>
              <p style={{ color: C.muted, fontSize: 11, margin: '6px 0 0', fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>Aa Bb Cc — 0123456789</p>
            </div>
          ))}
        </div>
        </div>
      </div>

      <SaveButton
        label="Salva e pubblica"
        style={{ background: custom.accent }}
        onSave={() => saveSiteContent({ theme_template: template, theme_accent: custom.accent, theme_font: custom.font })}
      />
      {locked && <LockedOverlay message="Personalizzazione disponibile solo con piano Premium" />}
    </div>
  )
}

// ── ROOT ─────────────────────────────────────────────────────────────────────

const TEMPLATE_ACCENTS: Record<string, { label: string; accent: string }> = {
  cinematico: { label: 'Cinematico', accent: '#e52d1d' },
  bento: { label: 'Bento', accent: '#FF6B35' },
  panoramico: { label: 'Panoramico', accent: '#b58a2f' },
  aurora: { label: 'Aurora', accent: '#a78bfa' },
  mercato: { label: 'Mercato', accent: '#b8451f' },
}

export default function AdminPage() {
  const [nav, setNav] = useState<NavItem>('Dashboard')
  const [tier, setTier] = useState<Tier>('basic')
  const [template, setTemplate] = useState<string>('cinematico')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Override C.accent based on chosen template — restaurant-specific
  const accentColor = TEMPLATE_ACCENTS[template].accent

  const navItems: { label: NavItem; lock?: 'pro' | 'premium' }[] = [
    { label: 'Dashboard' },
    { label: 'Menu' },
    { label: 'Orari' },
    { label: 'Chef' },
    { label: 'FAQ' },
    { label: 'Prenotazioni', lock: 'pro' },
    { label: 'Eventi', lock: 'pro' },
    { label: 'Recensioni', lock: 'pro' },
    { label: 'Newsletter', lock: 'pro' },
    { label: 'Foto & Gallery', lock: 'premium' },
    { label: 'Testi', lock: 'premium' },
    { label: 'Clienti CRM', lock: 'premium' },
    { label: 'Personalizza', lock: 'premium' },
  ]

  const isLocked = (lock?: 'pro' | 'premium') => {
    if (!lock) return false
    if (lock === 'pro') return tier === 'basic'
    if (lock === 'premium') return tier !== 'premium'
    return false
  }

  const tierLabel = tier === 'basic' ? 'BASIC' : tier === 'pro' ? 'PRO' : 'PREMIUM'
  const tierColor = tier === 'basic' ? accentColor : tier === 'pro' ? '#f97316' : '#eab308'

  const renderPage = () => {
    switch (nav) {
      case 'Dashboard': return <DashboardPage goTo={setNav} />
      case 'Menu': return <MenuPage />
      case 'Orari': return <OrariPage />
      case 'Chef': return <ChefPage />
      case 'FAQ': return <FAQPage />
      case 'Prenotazioni': return <PrenotazioniPage tier={tier} />
      case 'Eventi': return <EventiPage tier={tier} />
      case 'Recensioni': return <RecensioniPage tier={tier} />
      case 'Newsletter': return <NewsletterPage tier={tier} />
      case 'Foto & Gallery': return <FotoPage tier={tier} />
      case 'Testi': return <TestiPage tier={tier} />
      case 'Clienti CRM': return <CRMPage tier={tier} />
      case 'Personalizza': return <PersonalizzaPage tier={tier} template={template} setTemplate={setTemplate} accentColor={accentColor} />
    }
  }

  const handleNavClick = (label: NavItem) => {
    setNav(label)
    setSidebarOpen(false)  // close drawer on mobile after pick
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&display=swap');

        /* ── ANIMATED BACKGROUND aurora ── */
        body { background: ${C.bg}; }
        .lum-admin { display: flex; min-height: 100vh; position: relative; }
        .lum-admin::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(800px circle at 12% 18%, ${accentColor}13, transparent 50%),
            radial-gradient(700px circle at 88% 75%, #a78bfa10, transparent 50%),
            radial-gradient(600px circle at 50% 100%, #60a5fa0a, transparent 50%);
          pointer-events: none;
          animation: lumAurora 22s ease-in-out infinite alternate;
        }
        @keyframes lumAurora {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          50% { transform: translate(3%, -2%) scale(1.05); opacity: 0.85; }
          100% { transform: translate(-2%, 3%) scale(0.98); opacity: 1; }
        }
        .lum-admin > * { position: relative; z-index: 1; }

        /* ── HERO greeting ── */
        .lum-hero {
          margin-bottom: 32px;
          padding: 24px 0 8px;
        }
        .lum-hero-eyebrow {
          font-size: 12px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${accentColor};
          margin: 0 0 12px;
          font-weight: 600;
        }
        .lum-hero-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 300;
          letter-spacing: -0.03em;
          line-height: 1.05;
          color: ${C.text};
          margin: 0 0 18px;
        }
        .lum-hero-title em {
          font-style: italic;
          background: linear-gradient(135deg, ${accentColor}, #a78bfa);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .lum-hero-meta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 7px 14px;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.25);
          border-radius: 100px;
          color: #22c55e;
          font-size: 12px;
          font-weight: 600;
        }
        .lum-hero-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34,197,94,0.7);
          animation: lumPulse 2s ease-in-out infinite;
        }
        @keyframes lumPulse {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }

        /* ── BENTO stats ── */
        .lum-bento-stats {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 14px;
        }
        .lum-bento-cell { min-height: 130px; }
        .lum-bento-large { grid-column: 1; grid-row: 1 / span 2; }
        .lum-bento-wide { grid-column: 2 / span 3; grid-row: 2; }

        /* ── STAT CARD with cursor-glow ── */
        .lum-stat-card {
          position: relative;
          background: rgba(20, 20, 22, 0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 20px 22px;
          overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s;
          backdrop-filter: blur(20px);
          height: 100%;
          box-sizing: border-box;
        }
        .lum-stat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), var(--accent-glow, ${accentColor})22, transparent 40%);
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
        }
        .lum-stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.14);
        }
        .lum-stat-card:hover::before { opacity: 1; }
        .lum-stat-card-content { position: relative; z-index: 1; }
        .lum-stat-value {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 400;
          letter-spacing: -0.03em;
          line-height: 1;
          color: ${C.text};
        }
        .lum-bento-large .lum-stat-value {
          font-size: clamp(2.6rem, 5vw, 4.2rem);
        }

        /* ── QUICK ACTIONS ── */
        .lum-quick-actions {
          background: linear-gradient(135deg, rgba(167,139,250,0.08), rgba(96,165,250,0.04));
          border: 1px solid rgba(167,139,250,0.18);
          border-radius: 14px;
          padding: 18px 22px;
          height: 100%;
          box-sizing: border-box;
        }
        .lum-action-btn {
          padding: 7px 14px;
          background: rgba(255,255,255,0.06);
          color: ${C.text};
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .lum-action-btn:hover {
          background: ${accentColor};
          border-color: ${accentColor};
          transform: translateY(-2px);
        }

        /* ── SECTION CARD ── */
        .lum-section-card {
          background: rgba(20, 20, 22, 0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }

        /* ── PAGE HEADER ── */
        .lum-page-header {
          margin-bottom: 28px;
          padding: 18px 0 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }
        .lum-page-eyebrow {
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${accentColor};
          margin: 0 0 8px;
          font-weight: 600;
        }
        .lum-page-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(1.6rem, 3.5vw, 2.4rem);
          font-weight: 300;
          letter-spacing: -0.03em;
          line-height: 1.05;
          color: ${C.text};
          margin: 0;
        }
        .lum-page-title em {
          font-style: italic;
          color: ${accentColor};
        }
        .lum-page-sub {
          color: ${C.muted};
          font-size: 13px;
          margin: 8px 0 0;
          max-width: 600px;
          line-height: 1.5;
        }

        /* ── PREMIUM CARD with cursor-glow ── */
        .lum-card {
          position: relative;
          background: rgba(20, 20, 22, 0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 20px 22px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s, box-shadow 0.3s;
        }
        .lum-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), ${accentColor}1a, transparent 40%);
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
        }
        .lum-card:hover {
          border-color: rgba(255,255,255,0.14);
        }
        .lum-card:hover::before { opacity: 1; }
        .lum-card-content { position: relative; z-index: 1; }

        /* ── INPUTS upgraded ── */
        .lum-input, .lum-content input:not([type="checkbox"]):not([type="radio"]):not([type="color"]), .lum-content textarea, .lum-content select {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: ${C.text};
          padding: 11px 14px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s, background 0.2s;
        }
        .lum-content input:focus, .lum-content textarea:focus, .lum-content select:focus {
          border-color: ${accentColor};
          background: rgba(255,255,255,0.06);
        }
        .lum-content input::placeholder, .lum-content textarea::placeholder {
          color: rgba(255,255,255,0.3);
        }

        /* ── PRIMARY BUTTON ── */
        .lum-btn-primary {
          padding: 11px 22px;
          background: linear-gradient(135deg, ${accentColor}, ${accentColor}cc);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.25s, box-shadow 0.3s;
        }
        .lum-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px ${accentColor}44;
        }
        .lum-btn-ghost {
          padding: 10px 18px;
          background: rgba(255,255,255,0.04);
          color: ${C.text};
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .lum-btn-ghost:hover {
          border-color: ${accentColor};
          color: ${accentColor};
        }
        .lum-btn-danger {
          padding: 7px 14px;
          background: rgba(239,68,68,0.1);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .lum-btn-danger:hover {
          background: rgba(239,68,68,0.2);
        }

        /* ── PILL BADGE ── */
        .lum-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        /* ── DAY CARD (orari) ── */
        .lum-day-card {
          display: grid;
          grid-template-columns: 130px 1fr 1fr auto;
          gap: 14px;
          align-items: center;
          padding: 14px 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          margin-bottom: 8px;
          transition: border-color 0.2s, background 0.2s;
        }
        .lum-day-card:hover {
          border-color: rgba(255,255,255,0.1);
        }
        .lum-day-card-day {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 18px;
          font-style: italic;
          color: ${C.text};
        }
        .lum-day-card.closed {
          opacity: 0.55;
        }
        @media (max-width: 768px) {
          .lum-day-card {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
            gap: 10px;
          }
          .lum-day-card-day {
            grid-column: 1 / span 2;
            font-size: 16px;
          }
        }

        /* ── MENU ITEM premium ── */
        .lum-menu-cat-card {
          margin-bottom: 28px;
        }
        .lum-menu-cat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .lum-menu-cat-title {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic;
          font-size: 22px;
          font-weight: 400;
          color: ${C.text};
          margin: 0;
        }
        .lum-menu-cat-count {
          padding: 3px 9px;
          background: rgba(255,255,255,0.06);
          border-radius: 100px;
          color: ${C.muted};
          font-size: 11px;
          font-weight: 600;
        }
        .lum-menu-row {
          display: flex;
          align-items: center;
          padding: 14px 18px;
          gap: 14px;
          transition: background 0.2s, padding 0.2s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .lum-menu-row:last-child { border-bottom: none; }
        .lum-menu-row:hover {
          background: rgba(255,255,255,0.025);
          padding-left: 22px;
        }
        .lum-menu-row-info { flex: 1; min-width: 0; }
        .lum-menu-row-name {
          color: ${C.text};
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 3px;
        }
        .lum-menu-row-desc {
          color: ${C.muted};
          font-size: 12.5px;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lum-menu-row-price {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic;
          font-size: 18px;
          color: ${accentColor};
          font-weight: 500;
          white-space: nowrap;
        }

        /* ── FAQ ── */
        .lum-faq-card {
          padding: 16px 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          margin-bottom: 10px;
          transition: border-color 0.2s;
        }
        .lum-faq-card:hover {
          border-color: rgba(255,255,255,0.12);
        }

        /* ── REVIEW item ── */
        .lum-review {
          padding: 16px 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          margin-bottom: 10px;
          transition: opacity 0.2s, border-color 0.2s;
        }
        .lum-review.disabled { opacity: 0.45; }
        .lum-review:hover { border-color: rgba(255,255,255,0.12); }

        /* ── EVENT card ── */
        .lum-event-card {
          padding: 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .lum-event-card:hover {
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-2px);
        }
        .lum-event-date {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, ${accentColor}, ${accentColor}99);
          color: #fff;
          border-radius: 12px;
          margin-bottom: 12px;
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic;
        }
        .lum-event-date-day {
          font-size: 22px;
          line-height: 1;
          font-weight: 500;
        }
        .lum-event-date-month {
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0.85;
          margin-top: 2px;
          font-family: 'Inter', sans-serif;
          font-style: normal;
          font-weight: 600;
        }
        .lum-section-header {
          padding: 18px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .lum-table-row {
          transition: background 0.2s;
        }
        .lum-table-row:hover {
          background: rgba(255,255,255,0.025);
        }

        /* ── SIDEBAR upgrade ── */
        .lum-sidebar {
          width: 230px;
          flex-shrink: 0;
          background: rgba(18, 18, 20, 0.85);
          backdrop-filter: blur(24px);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 40;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .lum-main { margin-left: 230px !important; }
        .lum-topbar {
          background: rgba(15, 15, 17, 0.7) !important;
          backdrop-filter: blur(20px);
          border-bottom-color: rgba(255,255,255,0.06) !important;
        }
        .lum-main {
          margin-left: 220px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-width: 0;
        }
        .lum-topbar {
          height: 56px;
          border-bottom: 1px solid ${C.border};
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          background: ${C.bg};
          z-index: 5;
          gap: 12px;
        }
        .lum-hamburger {
          display: none;
          background: transparent;
          border: 1px solid ${C.border};
          color: ${C.text};
          width: 38px;
          height: 38px;
          border-radius: 6px;
          cursor: pointer;
          padding: 0;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lum-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 30;
          display: none;
          opacity: 0;
          transition: opacity 0.25s;
        }
        .lum-content {
          padding: 24px;
          flex: 1;
          overflow-x: hidden;
        }
        .lum-tier-select {
          background: ${C.input};
          border: 1px solid ${C.inputBorder};
          color: ${C.text};
          border-radius: 6px;
          padding: 5px 10px;
          font-size: 12px;
          cursor: pointer;
          outline: none;
        }
        @media (max-width: 768px) {
          .lum-sidebar {
            transform: translateX(-100%);
            box-shadow: 0 0 40px rgba(0,0,0,0.5);
          }
          .lum-sidebar.lum-open {
            transform: translateX(0);
          }
          .lum-overlay.lum-open {
            display: block;
            opacity: 1;
          }
          .lum-main {
            margin-left: 0 !important;
          }
          .lum-hamburger {
            display: inline-flex;
          }
          .lum-topbar {
            padding: 0 16px;
          }
          .lum-content {
            padding: 16px;
          }
          .lum-topbar h1 {
            font-size: 14px !important;
          }
          .lum-tier-label-text {
            display: none;
          }
          /* Stat cards: 4-col → 2-col on tablet/mobile */
          .lum-stat-row {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          /* Generic 2-col grids inside admin → 1-col on mobile */
          .lum-content [style*="grid-template-columns: 1fr 1fr"]:not([style*="repeat"]),
          .lum-content [style*="gridTemplateColumns: '1fr 1fr'"]:not([style*="repeat"]) {
            grid-template-columns: 1fr !important;
          }
          /* Tables: enable horizontal scroll wrapper */
          .lum-content table {
            font-size: 12px;
          }
          .lum-content table th, .lum-content table td {
            padding: 8px 10px !important;
          }
          /* Larger touch targets for inputs */
          .lum-content input, .lum-content textarea, .lum-content select {
            font-size: 14px !important;
          }
          /* Section title smaller */
          .lum-content h2 {
            font-size: 15px !important;
          }
          /* Chef photo+content: stack */
          .lum-content [style*="120px"][style*="150px"] {
            margin-bottom: 14px;
          }
        }
        @media (max-width: 480px) {
          .lum-stat-row {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .lum-content {
            padding: 14px !important;
          }
          .lum-content table {
            font-size: 11.5px;
          }
          .lum-content table th, .lum-content table td {
            padding: 7px 8px !important;
          }
          /* Force most 3-col grids to 1-col */
          .lum-content [style*="repeat(3, 1fr)"]:not([class*="lum-stat-row"]) {
            grid-template-columns: 1fr !important;
          }
          .lum-content [style*="repeat(auto-fill"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .lum-bento-stats {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto;
          }
          .lum-bento-large {
            grid-column: 1 / span 2;
            grid-row: auto;
          }
          .lum-bento-wide {
            grid-column: 1 / span 2;
            grid-row: auto;
          }
          .lum-bento-cell { min-height: 120px; }
          .lum-hero { padding: 12px 0 4px; margin-bottom: 22px; }
          .lum-hero-title { font-size: 1.7rem; }
          .lum-section-header { padding: 14px 16px; }
        }
      `}</style>
      <div className="lum-admin">
        {/* Overlay for mobile drawer */}
        <div
          className={`lum-overlay ${sidebarOpen ? 'lum-open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`lum-sidebar ${sidebarOpen ? 'lum-open' : ''}`}>
          <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
              <span style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>Burger Republic</span>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
            {navItems.map(({ label, lock }) => {
              const active = nav === label
              const locked = isLocked(lock)
              return (
                <div
                  key={label}
                  onClick={() => handleNavClick(label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 20px',
                    cursor: 'pointer',
                    borderLeft: active ? `2px solid ${accentColor}` : '2px solid transparent',
                    background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                    marginBottom: 1,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ color: active ? C.text : C.muted, fontSize: 13, fontWeight: active ? 500 : 400 }}>{label}</span>
                  {locked && lock && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: lock === 'pro' ? 'rgba(249,115,22,0.15)' : 'rgba(234,179,8,0.15)', color: lock === 'pro' ? '#f97316' : '#eab308', letterSpacing: '0.03em' }}>
                      {lock === 'pro' ? 'PRO' : 'PREMIUM'}
                    </span>
                  )}
                </div>
              )
            })}
          </nav>
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${tierColor}18`, border: `1px solid ${tierColor}40`, borderRadius: 6, padding: '5px 10px', width: 'fit-content' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: tierColor }} />
              <span style={{ color: tierColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>{tierLabel}</span>
            </div>
            <select
              value={template}
              onChange={e => setTemplate(e.target.value)}
              style={{
                background: C.input,
                border: `1px solid ${C.inputBorder}`,
                color: C.muted,
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 11,
                cursor: 'pointer',
                outline: 'none',
                width: '100%',
                letterSpacing: '0.05em',
              }}
            >
              {Object.entries(TEMPLATE_ACCENTS).map(([k, v]) => (
                <option key={k} value={k}>Template: {v.label}</option>
              ))}
            </select>
            <form action={logoutAction}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: `1px solid ${C.inputBorder}`,
                  color: C.muted,
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textTransform: 'uppercase',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.inputBorder }}
              >
                Esci
              </button>
            </form>
          </div>
        </aside>

        {/* Main */}
        <div className="lum-main">
          {/* Top bar */}
          <div className="lum-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <button
                className="lum-hamburger"
                onClick={() => setSidebarOpen(true)}
                aria-label="Apri menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <h1 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nav}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span className="lum-tier-label-text" style={{ color: C.muted, fontSize: 12 }}>Piano:</span>
              <select value={tier} onChange={e => setTier(e.target.value as Tier)} className="lum-tier-select">
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="lum-content">
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  )
}
