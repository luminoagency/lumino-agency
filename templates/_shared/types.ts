export type AllergenTag = 'vegan' | 'vegetarian' | 'gf' | 'spicy' | 'signature' | 'nuts'

export interface MenuItem {
  name: string
  description?: string
  price: number
  allergens?: AllergenTag[]
}

export interface MenuCategory {
  name: string
  description?: string
  items: MenuItem[]
}

export interface ChefInfo {
  name: string
  role: string
  quote: string
  photo?: string
  years?: number
}

export interface ReviewItem {
  author: string
  rating: number
  text: string
  source?: string
  date?: string
}

export interface ReviewsInfo {
  score: number
  count: number
  source: string
  items: ReviewItem[]
}

export interface FAQItem {
  q: string
  a: string
}

/* Allergen icon mapping — used in menu rendering */
export const ALLERGEN_LABELS: Record<AllergenTag, { label: string; short: string; color: string; title: string }> = {
  vegan:      { label: 'Vegano', short: 'V', color: '#5e8a3a', title: '100% vegetale' },
  vegetarian: { label: 'Vegetariano', short: 'VG', color: '#7a9a4a', title: 'Vegetariano' },
  gf:         { label: 'Senza glutine', short: 'GF', color: '#c98a3a', title: 'Senza glutine' },
  spicy:      { label: 'Piccante', short: '🌶', color: '#d44a2c', title: 'Piccante' },
  signature:  { label: 'Signature', short: '★', color: '#c9a84c', title: 'Il piatto firma' },
  nuts:       { label: 'Frutta a guscio', short: '⚠', color: '#a67c52', title: 'Contiene frutta a guscio' },
}
