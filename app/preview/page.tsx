'use client'

import { useState } from 'react'
import { CinematicoTemplate } from '@/templates/cinematico/CinematicoTemplate'
import { BentoTemplate } from '@/templates/bento/BentoTemplate'
import { PanoramicoTemplate } from '@/templates/panoramico/PanoramicoTemplate'

const LOGO_URL = 'https://www.misspoppy.it/wp-content/uploads/2024/05/MissPoppy_logo_full.svg'

const MENU = [
  {
    name: 'Smash Burgers', description: 'Carne 100% italiana, bun artigianali',
    items: [
      { name: 'Poppy Classic', description: 'Doppio smash, cheddar fuso, cipolla caramellata, salsa Poppy', price: 11 },
      { name: 'Truffle Bloom', description: 'Smash patty, crema di tartufo, rucola, parmigiano 24 mesi', price: 14 },
      { name: 'BBQ Beast', description: 'Triplo smash, bacon croccante, onion rings, BBQ affumicata', price: 15 },
      { name: 'Green Poppy', description: 'Beyond patty, avocado, pomodorini, salsa verde, bun integrale', price: 13 },
    ],
  },
  {
    name: 'Bowls', description: 'Fresche, colorate, bilanciate',
    items: [
      { name: 'Poppy Bowl', description: 'Base riso, salmone marinato, avocado, edamame, mango, sesamo', price: 13 },
      { name: 'Chicken Caesar Bowl', description: 'Pollo grigliato, lattuga romana, crostini, parmigiano, dressing Caesar', price: 12 },
      { name: 'Vegan Power', description: 'Quinoa, hummus, falafel, verdure grigliate, tahina', price: 12 },
    ],
  },
  {
    name: 'Wraps & Sides',
    items: [
      { name: 'Chicken Wrap', description: 'Pollo croccante, iceberg, pomodoro, salsa yogurt', price: 9 },
      { name: 'Loaded Fries', description: 'Cheddar, bacon, jalapeño, sour cream', price: 8 },
      { name: 'Sweet Fries', description: 'Patate dolci croccanti, sale rosa, mayo sriracha', price: 6 },
      { name: 'Onion Rings', description: 'Pastella leggera, salsa BBQ', price: 5 },
    ],
  },
  {
    name: 'Dolci & Bevande',
    items: [
      { name: 'Poppy Shake', description: 'Milkshake artigianale — vaniglia, cioccolato o fragola', price: 7 },
      { name: 'Brownie Sundae', description: 'Brownie caldo, gelato, cioccolato fuso, nocciole', price: 8 },
      { name: 'Craft Beer', description: 'Birra artigianale alla spina — rotazione settimanale', price: 6 },
      { name: 'Fresh Lemonade', description: 'Limonata fatta in casa, menta, zenzero', price: 5 },
    ],
  },
]

const GALLERY = [
  { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1400&q=90', alt: 'Smash burger', caption: 'Il nostro signature smash' },
  { url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=85', alt: 'Buddha bowl', caption: 'Poppy bowl — fresca e colorata' },
  { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=85', alt: 'Pizza special', caption: 'Speciale del weekend' },
  { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&q=85', alt: 'Interno locale', caption: 'Il nostro spazio' },
  { url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1200&q=85', alt: 'Cheese burger', caption: 'Double cheese' },
  { url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&q=85', alt: 'Dessert', caption: 'Poppy dessert' },
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
  restaurantName: 'Miss Poppy',
  tagline: 'Blooming taste',
  description: 'Miss Poppy nasce da un\'idea semplice: portare a Padova un fast food che non scende a compromessi. Ingredienti freschi ogni mattina, ricette studiate per sorprendere, un ambiente che ti fa sentire a casa. Non siamo il solito burger bar — siamo il posto dove torni perché ogni volta scopri qualcosa di nuovo.',
  heroImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1920&q=90',
  aboutImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85',
  menuCategories: MENU,
  galleryImages: GALLERY,
  address: 'Via Cavazzana 9, 35123 Padova (PD)',
  phone: '+39 049 123 456',
  email: 'info@misspoppy.it',
  hours: HOURS,
  mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2800.5!2d11.8768!3d45.4064!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI0JzIzLjAiTiAxMcKwNTInMzYuNSJF!5e0!3m2!1sit!2sit!4v1',
  socialLinks: {
    instagram: 'https://www.instagram.com/misspoppy_original/',
    facebook: 'https://www.facebook.com/profile.php?id=61564918059225',
  },
  logoUrl: LOGO_URL,
}

type Template = 'cinematico' | 'bento' | 'panoramico'

const TEMPLATES: { key: Template; label: string; accent: string; desc: string }[] = [
  { key: 'cinematico', label: 'Cinematico', accent: '#e52d1d', desc: 'Scuro, scroll-snap, film' },
  { key: 'bento', label: 'Bento', accent: '#FF6B35', desc: 'Chiaro, griglia modulare' },
  { key: 'panoramico', label: 'Panoramico', accent: '#c9a84c', desc: 'Scuro, scroll orizzontale' },
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
    </>
  )
}
