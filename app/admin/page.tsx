'use client'

import { useState } from 'react'

type Tier = 'basic' | 'pro' | 'premium'
type NavItem = 'Dashboard' | 'Menu' | 'Orari' | 'Prenotazioni' | 'Eventi' | 'Foto & Gallery' | 'Testi' | 'Clienti CRM'

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
  { id: 1, nome: 'Marco Rossi', telefono: '+39 333 123 4567', email: 'marco.rossi@email.it', visite: 12, ultima: '2026-06-10', speso: '€ 284', pref: 'Truffle Bloom, no cipolla', note: 'Cliente fedele, preferisce tavolo finestra' },
  { id: 2, nome: 'Giulia Bianchi', telefono: '+39 347 987 6543', email: 'giulia.b@email.it', visite: 7, ultima: '2026-06-08', speso: '€ 156', pref: 'Green Poppy, Vegan Power', note: 'Vegana, allergia arachidi' },
  { id: 3, nome: 'Luca Ferretti', telefono: '+39 320 456 7890', email: 'l.ferretti@email.it', visite: 18, ultima: '2026-06-12', speso: '€ 412', pref: 'BBQ Beast, Loaded Fries', note: 'Prenota spesso per gruppi di lavoro' },
  { id: 4, nome: 'Sofia Marino', telefono: '+39 348 234 5678', email: 'sofia.m@email.it', visite: 4, ultima: '2026-06-01', speso: '€ 89', pref: 'Chicken Caesar Bowl', note: '' },
  { id: 5, nome: 'Andrea Conti', telefono: '+39 331 876 5432', email: 'a.conti@email.it', visite: 9, ultima: '2026-06-09', speso: '€ 198', pref: 'Poppy Classic, Poppy Shake', note: 'Compleanno il 23 luglio' },
  { id: 6, nome: 'Elena Romano', telefono: '+39 349 543 2109', email: 'e.romano@email.it', visite: 22, ultima: '2026-06-13', speso: '€ 531', pref: 'Truffle Bloom, Brownie Sundae', note: 'Cliente VIP — sconto 10% applicato' },
]

const initialTesti = {
  nomeRistorante: 'Miss Poppy',
  tagline: 'Smash Burgers & Good Vibes',
  descrizione: 'Miss Poppy è il posto dove i sapori autentici incontrano un\'atmosfera rilassata e accogliente. I nostri smash burger sono preparati con ingredienti freschi ogni giorno, cotti al momento per darti il massimo gusto ad ogni morso.',
  heroHeadline: 'Il Burger che non ti aspetti',
  heroSubheadline: 'Smash burgers artigianali, bowls freschi e vibes uniche nel cuore della città.',
  aboutTitle: 'La nostra storia',
  aboutText: 'Nati dalla passione per il cibo vero, Miss Poppy ha aperto le sue porte con una missione semplice: portare in tavola hamburger onesti, ingredienti di qualità e un\'esperienza che vale il viaggio.',
  seoTitle: 'Miss Poppy — Smash Burgers & Bowls | Ristorante',
  seoDesc: 'Miss Poppy serve i migliori smash burger artigianali, bowls freschi e dolci fatti in casa. Visita il nostro ristorante e scopri il gusto autentico.',
  keywords: 'smash burger, bowls, ristorante, hamburger artigianale, Miss Poppy',
}

function LockedOverlay({ message }: { message: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,15,15,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 8 }}>
      <div style={{ fontSize: 32, marginBottom: 12, color: C.muted }}>⟠</div>
      <p style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{message}</p>
      <p style={{ color: C.muted, fontSize: 13 }}>Aggiorna il piano per sbloccare questa funzione</p>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 24px', flex: 1 }}>
      <p style={{ color: C.muted, fontSize: 12, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ color: C.text, fontSize: 26, fontWeight: 700 }}>{value}</p>
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

// ── PAGES ────────────────────────────────────────────────────────────────────

function DashboardPage() {
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
      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        <StatCard label="Visite oggi" value="247" />
        <StatCard label="Prenotazioni attive" value="12" />
        <StatCard label="Piatti nel menu" value="15" />
        <StatCard label="Visite questa settimana" value="1.843" />
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
          <p style={{ color: C.text, fontWeight: 600, fontSize: 14, margin: 0 }}>Ultime prenotazioni</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Nome', 'Data', 'Ora', 'Persone', 'Stato'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 24px', color: C.muted, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentRes.map((r, i) => (
              <tr key={i} style={{ borderBottom: i < recentRes.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <td style={{ padding: '12px 24px', color: C.text, fontSize: 13 }}>{r.nome}</td>
                <td style={{ padding: '12px 24px', color: C.muted, fontSize: 13 }}>{r.data}</td>
                <td style={{ padding: '12px 24px', color: C.muted, fontSize: 13 }}>{r.ora}</td>
                <td style={{ padding: '12px 24px', color: C.muted, fontSize: 13 }}>{r.persone}</td>
                <td style={{ padding: '12px 24px' }}>
                  <span style={{ color: statoColor(r.stato), fontSize: 12, fontWeight: 500 }}>{r.stato}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MenuPage() {
  const [menu, setMenu] = useState(initialMenuData)
  const toggleAvailable = (catIdx: number, itemId: number) => {
    setMenu(prev => prev.map((cat, ci) => ci !== catIdx ? cat : {
      ...cat,
      items: cat.items.map(it => it.id === itemId ? { ...it, available: !it.available } : it)
    }))
  }

  return (
    <div>
      {menu.map((cat, ci) => (
        <div key={ci} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <h3 style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: 0 }}>{cat.category}</h3>
            <span style={{ color: C.muted, fontSize: 12 }}>{cat.items.length} piatti</span>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
            {cat.items.map((item, ii) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: ii < cat.items.length - 1 ? `1px solid ${C.border}` : 'none', gap: 12 }}>
                <Toggle value={item.available} onChange={() => toggleAvailable(ci, item.id)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: 0, marginBottom: 2 }}>{item.name}</p>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.desc}</p>
                </div>
                <span style={{ color: C.accent, fontSize: 14, fontWeight: 700, marginRight: 16, flexShrink: 0 }}>€ {item.price}</span>
                <button style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', padding: '4px 6px' }} onMouseEnter={e => (e.currentTarget.style.color = C.accent)} onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>Modifica</button>
                <button style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', padding: '4px 6px' }} onMouseEnter={e => (e.currentTarget.style.color = C.accent)} onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>Elimina</button>
              </div>
            ))}
          </div>
          <button style={{ background: 'none', border: `1px solid ${C.accent}`, color: C.accent, fontSize: 12, borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>+ Aggiungi piatto</button>
        </div>
      ))}
      <button style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, borderRadius: 6, padding: '10px 20px', cursor: 'pointer', marginTop: 8 }}>+ Nuova categoria</button>
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
      <SectionTitle>Orari di apertura</SectionTitle>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        {orari.map((o, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < orari.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <span style={{ color: C.text, fontSize: 13, fontWeight: 500, width: 100, flexShrink: 0 }}>{o.day}</span>
            <input type="time" value={o.open} onChange={e => update(i, 'open', e.target.value)} disabled={o.closed} style={{ ...InputStyle({ width: 110 }), opacity: o.closed ? 0.3 : 1 }} />
            <span style={{ color: C.muted, fontSize: 12 }}>—</span>
            <input type="time" value={o.close} onChange={e => update(i, 'close', e.target.value)} disabled={o.closed} style={{ ...InputStyle({ width: 110 }), opacity: o.closed ? 0.3 : 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <span style={{ color: C.muted, fontSize: 12 }}>Chiuso</span>
              <Toggle value={o.closed} onChange={v => update(i, 'closed', v)} />
            </div>
          </div>
        ))}
      </div>
      <button style={{ background: C.accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, borderRadius: 6, padding: '10px 22px', cursor: 'pointer' }}>Salva modifiche</button>
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
  const update = (id: number, stato: 'confirmed' | 'cancelled') => {
    setItems(prev => prev.map(r => r.id === id ? { ...r, stato } : r))
  }

  return (
    <div style={{ position: 'relative' }}>
      {tier === 'basic' && <LockedOverlay message="Passa a Pro per gestire le prenotazioni" />}
      <SectionTitle>Prenotazioni</SectionTitle>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Nome', 'Data', 'Ora', 'Persone', 'Stato', 'Azioni'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 20px', color: C.muted, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <td style={{ padding: '12px 20px', color: C.text, fontSize: 13, fontWeight: 500 }}>{r.nome}</td>
                <td style={{ padding: '12px 20px', color: C.muted, fontSize: 13 }}>{r.data}</td>
                <td style={{ padding: '12px 20px', color: C.muted, fontSize: 13 }}>{r.ora}</td>
                <td style={{ padding: '12px 20px', color: C.muted, fontSize: 13 }}>{r.persone}</td>
                <td style={{ padding: '12px 20px' }}><span style={statoStyle(r.stato)}>{r.stato === 'confirmed' ? 'Confermata' : r.stato === 'pending' ? 'In attesa' : 'Cancellata'}</span></td>
                <td style={{ padding: '12px 20px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => update(r.id, 'confirmed')} style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: 12, cursor: 'pointer', padding: 0 }}>Conferma</button>
                    <button onClick={() => update(r.id, 'cancelled')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', padding: 0 }}>Cancella</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EventiPage({ tier }: { tier: Tier }) {
  const [eventi, setEventi] = useState(initialEventi)
  const toggleActive = (id: number) => setEventi(prev => prev.map(e => e.id === id ? { ...e, active: !e.active } : e))

  return (
    <div style={{ position: 'relative' }}>
      {tier === 'basic' && <LockedOverlay message="Passa a Pro per gestire gli eventi" />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <SectionTitle>Eventi</SectionTitle>
        <button style={{ background: C.accent, border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>+ Nuovo evento</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {eventi.map(e => (
          <div key={e.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <p style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 4 }}>{e.title}</p>
                <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{e.date}</p>
              </div>
              <Toggle value={e.active} onChange={() => toggleActive(e.id)} />
            </div>
            <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{e.desc}</p>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 11, color: e.active ? '#22c55e' : C.muted, fontWeight: 500 }}>{e.active ? 'Attivo' : 'Inattivo'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FotoPage({ tier }: { tier: Tier }) {
  const placeholder = (label: string, h = 160) => (
    <div style={{ background: '#222', border: `1px dashed ${C.border}`, borderRadius: 8, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
      <span style={{ color: C.muted, fontSize: 13 }}>{label}</span>
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      {tier !== 'premium' && <LockedOverlay message="Passa a Premium per gestire le foto" />}
      <SectionTitle>Foto & Gallery</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 10, marginTop: 0 }}>Hero Image</p>
          {placeholder('Hero Image', 200)}
          <button style={{ background: 'none', border: `1px solid ${C.accent}`, color: C.accent, fontSize: 12, borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Carica foto</button>
        </div>
        <div>
          <p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 10, marginTop: 0 }}>About Image</p>
          {placeholder('About Image', 200)}
          <button style={{ background: 'none', border: `1px solid ${C.accent}`, color: C.accent, fontSize: 12, borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Carica foto</button>
        </div>
      </div>
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: 0 }}>Gallery</p>
          <button style={{ background: 'none', border: `1px solid ${C.accent}`, color: C.accent, fontSize: 12, borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Carica foto</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: '#222', border: `1px dashed ${C.border}`, borderRadius: 8, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: C.muted, fontSize: 12 }}>Foto {i + 1}</span>
            </div>
          ))}
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
      <SectionTitle>Testi del sito</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 14, marginTop: 0 }}>Informazioni generali</p>
          {field('Nome ristorante', 'nomeRistorante')}
          {field('Tagline', 'tagline')}
          {field('Descrizione', 'descrizione', true)}
          {field('Hero headline', 'heroHeadline')}
          {field('Hero subheadline', 'heroSubheadline')}
          {field('About title', 'aboutTitle')}
          {field('About text', 'aboutText', true)}
        </div>
        <div>
          <p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 14, marginTop: 0 }}>SEO</p>
          {field('SEO Title', 'seoTitle')}
          {field('SEO Description', 'seoDesc', true)}
          {field('Keywords (separate da virgola)', 'keywords')}
        </div>
      </div>
      <button style={{ background: C.accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, borderRadius: 6, padding: '10px 24px', cursor: 'pointer', marginTop: 8 }}>Salva</button>
    </div>
  )
}

function CRMPage({ tier }: { tier: Tier }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div style={{ position: 'relative' }}>
      {tier !== 'premium' && <LockedOverlay message="Passa a Premium per accedere al CRM clienti" />}
      <SectionTitle>Clienti CRM</SectionTitle>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Nome', 'Telefono', 'Email', 'Visite', 'Ultima visita', 'Speso totale'].map(h => (
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
                  <td style={{ padding: '12px 20px', color: C.muted, fontSize: 13 }}>{c.visite}</td>
                  <td style={{ padding: '12px 20px', color: C.muted, fontSize: 13 }}>{c.ultima}</td>
                  <td style={{ padding: '12px 20px', color: C.accent, fontSize: 13, fontWeight: 600 }}>{c.speso}</td>
                </tr>
                {expanded === c.id && (
                  <tr key={`exp-${c.id}`} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td colSpan={6} style={{ padding: '12px 20px 16px', background: 'rgba(255,255,255,0.02)' }}>
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
        </table>
      </div>
    </div>
  )
}

// ── ROOT ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [nav, setNav] = useState<NavItem>('Dashboard')
  const [tier, setTier] = useState<Tier>('basic')

  const navItems: { label: NavItem; lock?: 'pro' | 'premium' }[] = [
    { label: 'Dashboard' },
    { label: 'Menu' },
    { label: 'Orari' },
    { label: 'Prenotazioni', lock: 'pro' },
    { label: 'Eventi', lock: 'pro' },
    { label: 'Foto & Gallery', lock: 'premium' },
    { label: 'Testi', lock: 'premium' },
    { label: 'Clienti CRM', lock: 'premium' },
  ]

  const isLocked = (lock?: 'pro' | 'premium') => {
    if (!lock) return false
    if (lock === 'pro') return tier === 'basic'
    if (lock === 'premium') return tier !== 'premium'
    return false
  }

  const tierLabel = tier === 'basic' ? 'BASIC' : tier === 'pro' ? 'PRO' : 'PREMIUM'
  const tierColor = tier === 'basic' ? C.accent : tier === 'pro' ? '#f97316' : '#eab308'

  const renderPage = () => {
    switch (nav) {
      case 'Dashboard': return <DashboardPage />
      case 'Menu': return <MenuPage />
      case 'Orari': return <OrariPage />
      case 'Prenotazioni': return <PrenotazioniPage tier={tier} />
      case 'Eventi': return <EventiPage tier={tier} />
      case 'Foto & Gallery': return <FotoPage tier={tier} />
      case 'Testi': return <TestiPage tier={tier} />
      case 'Clienti CRM': return <CRMPage tier={tier} />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, background: C.sidebar, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0 }}>
        <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, flexShrink: 0 }} />
            <span style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>Miss Poppy</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {navItems.map(({ label, lock }) => {
            const active = nav === label
            const locked = isLocked(lock)
            return (
              <div key={label} onClick={() => setNav(label)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 20px', cursor: 'pointer', borderLeft: active ? `2px solid ${C.accent}` : '2px solid transparent', background: active ? 'rgba(255,255,255,0.04)' : 'transparent', marginBottom: 1 }} onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
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
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${tierColor}18`, border: `1px solid ${tierColor}40`, borderRadius: 6, padding: '5px 10px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: tierColor }} />
            <span style={{ color: tierColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>{tierLabel}</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{ height: 56, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, background: C.bg, zIndex: 5 }}>
          <h1 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: 0 }}>{nav}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>Piano:</span>
            <select value={tier} onChange={e => setTier(e.target.value as Tier)} style={{ background: C.input, border: `1px solid ${C.inputBorder}`, color: C.text, borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 28, flex: 1 }}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}
