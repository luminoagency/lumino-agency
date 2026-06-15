'use client'

import { useState } from 'react'
import { CinematicoTemplate } from '@/templates/cinematico/CinematicoTemplate'
import { BentoTemplate } from '@/templates/bento/BentoTemplate'
import { PanoramicoTemplate } from '@/templates/panoramico/PanoramicoTemplate'
import { AuroraTemplate } from '@/templates/aurora/AuroraTemplate'
import { MercatoTemplate } from '@/templates/mercato/MercatoTemplate'

const LOGO_URL = '' // niente logo demo — il sistema lo genera in pipeline

const MENU = [
  {
    name: 'Smash Burgers', description: 'Carne 100% italiana, bun artigianali',
    items: [
      { name: 'Republic Classic', description: 'Doppio smash, cheddar fuso, cipolla caramellata, salsa Republic', price: 11 },
      { name: 'Truffle Bloom', description: 'Smash patty, crema di tartufo, rucola, parmigiano 24 mesi', price: 14, allergens: ['signature'] },
      { name: 'BBQ Beast', description: 'Triplo smash, bacon croccante, onion rings, BBQ affumicata', price: 15, allergens: ['spicy'] },
      { name: 'Green Republic', description: 'Beyond patty, avocado, pomodorini, salsa verde, bun integrale', price: 13, allergens: ['vegetarian'] },
    ],
  },
  {
    name: 'Bowls', description: 'Fresche, colorate, bilanciate',
    items: [
      { name: 'Republic Bowl', description: 'Base riso, salmone marinato, avocado, edamame, mango, sesamo', price: 13, allergens: ['gf'] },
      { name: 'Chicken Caesar Bowl', description: 'Pollo grigliato, lattuga romana, crostini, parmigiano, dressing Caesar', price: 12 },
      { name: 'Vegan Power', description: 'Quinoa, hummus, falafel, verdure grigliate, tahina', price: 12, allergens: ['vegan', 'gf'] },
    ],
  },
  {
    name: 'Wraps & Sides',
    items: [
      { name: 'Chicken Wrap', description: 'Pollo croccante, iceberg, pomodoro, salsa yogurt', price: 9 },
      { name: 'Loaded Fries', description: 'Cheddar, bacon, jalapeño, sour cream', price: 8, allergens: ['spicy', 'vegetarian'] },
      { name: 'Sweet Fries', description: 'Patate dolci croccanti, sale rosa, mayo sriracha', price: 6, allergens: ['vegan', 'spicy'] },
      { name: 'Onion Rings', description: 'Pastella leggera, salsa BBQ', price: 5, allergens: ['vegetarian'] },
    ],
  },
  {
    name: 'Dolci & Bevande',
    items: [
      { name: 'Republic Shake', description: 'Milkshake artigianale — vaniglia, cioccolato o fragola', price: 7, allergens: ['vegetarian'] },
      { name: 'Brownie Sundae', description: 'Brownie caldo, gelato, cioccolato fuso, nocciole', price: 8, allergens: ['vegetarian'] },
      { name: 'Craft Beer', description: 'Birra artigianale alla spina — rotazione settimanale', price: 6, allergens: ['vegan'] },
      { name: 'Fresh Lemonade', description: 'Limonata fatta in casa, menta, zenzero', price: 5, allergens: ['vegan', 'gf'] },
    ],
  },
]

const CHEF = {
  name: 'Marco Vianello',
  role: 'Chef & Founder',
  quote: 'Quando ho aperto Miss Republic avevo una sola idea: portare a Padova il sapore che cercavo a Brooklyn. Niente compromessi sugli ingredienti, niente paura di sperimentare. Ogni piatto è una piccola dichiarazione d\'amore.',
  photo: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=900&q=85',
  years: 12,
}

const REVIEWS = {
  score: 4.8,
  count: 327,
  source: 'Google',
  items: [
    { author: 'Giulia M.', rating: 5, text: 'Il miglior smash burger di Padova, senza ombra di dubbio. Atmosfera bellissima, staff super gentile e ingredienti che si sentono. Tornerò di sicuro.', source: 'Google', date: '2 settimane fa' },
    { author: 'Davide R.', rating: 5, text: 'Veniamo qui quasi ogni settimana. Truffle Bloom è la mia ossessione. Il fatto che cambino spesso il menu specials lo rende sempre nuovo.', source: 'Tripadvisor', date: '1 mese fa' },
    { author: 'Sara P.', rating: 5, text: 'Sono vegana e finalmente un posto dove ho 5 piatti tra cui scegliere senza sentirmi un\'extra. Il Vegan Power è una bomba.', source: 'Google', date: '3 settimane fa' },
    { author: 'Lorenzo B.', rating: 4, text: 'Cibo eccellente, locale carino, l\'unica nota è che nel weekend l\'attesa è lunga. Suggerisco di prenotare.', source: 'TheFork', date: '1 mese fa' },
  ],
}

const FAQ = [
  { q: 'Avete piatti vegani e senza glutine?', a: 'Sì, abbiamo diversi piatti vegani (Vegan Power, Sweet Fries, Beyond burger) e diversi GF. Tutti i piatti sono marcati con icone nel menu.' },
  { q: 'Posso venire con il mio cane?', a: 'Certo! Abbiamo una zona dehor pet-friendly. Per stare dentro al locale dipende dalla taglia, scrivici prima.' },
  { q: 'Quanti tavoli avete per gruppi grandi?', a: 'Possiamo gestire gruppi fino a 24 persone con un tavolo solo. Per gruppi più grandi facciamo eventi privati su prenotazione.' },
  { q: 'Fate consegne a domicilio?', a: 'Siamo su Deliveroo, Glovo e Just Eat. Per consegne dirette in zona puoi chiamarci.' },
  { q: 'Si può prenotare per occasioni speciali?', a: 'Assolutamente. Compleanni, addii al celibato/nubilato, eventi aziendali — chiamaci e organizziamo tutto.' },
]

// Suggested slots for tonight (used in reservation form)
const TIME_SLOTS = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']

const GALLERY = [
  { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1400&q=90', alt: 'Smash burger', caption: 'Il nostro signature smash' },
  { url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=85', alt: 'Buddha bowl', caption: 'Republic bowl — fresca e colorata' },
  { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=85', alt: 'Pizza special', caption: 'Speciale del weekend' },
  { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&q=85', alt: 'Interno locale', caption: 'Il nostro spazio' },
  { url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1200&q=85', alt: 'Cheese burger', caption: 'Double cheese' },
  { url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&q=85', alt: 'Dessert', caption: 'Republic dessert' },
  { url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=85', alt: 'Food detail', caption: 'Dettaglio' },
]

const HOURS: Record<string, { open: string; close: string; closed?: boolean }> = {
  mon: { open: '11:30', close: '14:30' },
  tue: { open: '11:30', close: '14:30' },
  wed: { open: '11:30', close: '14:30' },
  thu: { open: '11:30', close: '23:00' },
  fri: { open: '11:30', close: '23:30' },
  sat: { open: '11:30', close: '23:30' },
  sun: { open: '12:00', close: '22:00' },
}

const EVENTS = [
  { title: 'Smash Night', description: 'Tutti i burger a 10€ — ogni giovedì sera', date: '2025-06-19' },
  { title: 'Live Music Friday', description: 'Jazz dal vivo con aperitivo incluso', date: '2025-06-20' },
  { title: 'Brunch della Domenica', description: 'Menu brunch speciale dalle 11 alle 15', date: '2025-06-22' },
]

const COMMON = {
  restaurantName: 'Burger Republic',
  tagline: 'Smashed. Stacked. Yours.',
  description: 'Burger Republic nasce da un\'idea semplice: smash burger artigianali, carne 100% italiana macinata fresca ogni mattina, bun fatti da noi. Non siamo il solito burger bar — siamo il posto dove torni perché ogni volta scopri qualcosa di nuovo.',
  heroImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1920&q=90',
  aboutImage: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1200&q=85',
  menuCategories: MENU,
  galleryImages: GALLERY,
  address: 'Via Po 18, 10124 Torino',
  phone: '+39 011 567 890',
  email: 'hey@burgerrepublic.it',
  hours: HOURS,
  mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2820.5!2d7.6869!3d45.0703!2m3!1f0!2f0!3f0',
  socialLinks: {
    instagram: '#',
    facebook: '#',
  },
  logoUrl: LOGO_URL,
  chef: CHEF,
  reviews: REVIEWS,
  faq: FAQ,
  timeSlots: TIME_SLOTS,
  heroImages: [
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1920&q=90',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=90',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=90',
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1920&q=90',
  ],
}

type Template = 'cinematico' | 'bento' | 'panoramico' | 'aurora' | 'mercato'

const TEMPLATES: { key: Template; label: string; accent: string; desc: string }[] = [
  { key: 'cinematico', label: 'Cinematico', accent: '#e52d1d', desc: 'Scuro, scroll-snap, film' },
  { key: 'bento', label: 'Bento', accent: '#FF6B35', desc: 'Chiaro, griglia modulare' },
  { key: 'panoramico', label: 'Panoramico', accent: '#c9a84c', desc: 'Scuro, scroll orizzontale' },
  { key: 'aurora', label: 'Aurora', accent: '#a78bfa', desc: 'Magico, luci animate, particelle' },
  { key: 'mercato', label: 'Mercato', accent: '#b8451f', desc: 'Editoriale, carta, tradizione' },
]

export default function PreviewPage() {
  const [active, setActive] = useState<Template>('cinematico')

  const current = TEMPLATES.find(t => t.key === active)!

  return (
    <>
      {/* Template Switcher */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        gap: 8,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(20px)',
        padding: '8px 12px',
        borderRadius: 50,
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {TEMPLATES.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            style={{
              padding: '8px 20px',
              borderRadius: 50,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.02em',
              transition: 'all 0.3s',
              background: active === t.key ? t.accent : 'transparent',
              color: active === t.key ? '#fff' : 'rgba(255,255,255,0.5)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active Template */}
      {active === 'cinematico' && (
        <CinematicoTemplate
          {...COMMON}
          accentColor="#e52d1d"
          tier="premium"
          events={EVENTS}
          whatsappNumber="39049123456"
        />
      )}
      {active === 'bento' && (
        <BentoTemplate
          {...COMMON}
          aboutImage2="https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80"
          accentColor="#FF6B35"
          tier="premium"
          events={EVENTS}
          whatsappNumber="39049123456"
        />
      )}
      {active === 'panoramico' && (
        <PanoramicoTemplate
          {...COMMON}
          accentColor="#c9a84c"
          tier="premium"
          events={EVENTS}
          whatsappNumber="39049123456"
        />
      )}
      {active === 'aurora' && (
        <AuroraTemplate
          {...COMMON}
          accentColor="#a78bfa"
          tier="premium"
          events={EVENTS}
          whatsappNumber="39049123456"
        />
      )}
      {active === 'mercato' && (
        <MercatoTemplate
          {...COMMON}
          accentColor="#b8451f"
          tier="premium"
          events={EVENTS}
          whatsappNumber="39049123456"
        />
      )}
    </>
  )
}
