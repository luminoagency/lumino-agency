export type SiteTier = 'basic' | 'pro' | 'premium'
export type SiteStyle = 'luxury' | 'exotic' | 'modern'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
export type SiteStatus = 'building' | 'live' | 'error'
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface DayHours {
  open: string    // "12:00"
  close: string   // "22:00"
  closed: boolean
}

export type OpeningHours = Record<DayKey, DayHours>

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  photo_url?: string
  available: boolean
  display_order: number
}

export interface MenuCategory {
  id: string
  name: string
  description?: string
  display_order: number
  items: MenuItem[]
}

export interface GalleryImage {
  url: string
  caption?: string
  alt: string
}

export interface TeamMember {
  url: string
  name: string
  role: string
}

export interface SocialLinks {
  instagram?: string
  facebook?: string
  tripadvisor?: string
  google?: string
}

export interface CustomerPreferences {
  allergies?: string[]
  favorites?: string[]
  occasions?: string[]
}

// --- Database row shapes (mirror Supabase exactly) ---

export interface SiteRow {
  id: string
  client_id: string
  slug: string | null
  domain: string | null
  template_style: SiteStyle | null
  tier: SiteTier | null
  active: boolean
  status: SiteStatus
  video_url: string | null
  vercel_url: string | null
  deployed_at: string | null
  created_at: string
}

export interface SiteContentRow {
  id: string
  site_id: string
  restaurant_name: string
  tagline: string | null
  description: string | null
  hero_headline: string | null
  hero_subheadline: string | null
  hero_image_url: string | null
  about_title: string | null
  about_text: string | null
  about_image_url: string | null
  team_photos: TeamMember[]
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  google_place_id: string | null
  google_maps_embed_url: string | null
  opening_hours: OpeningHours
  gallery_images: GalleryImage[]
  style_override: SiteStyle | null
  social_links: SocialLinks
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[]
  created_at: string
  updated_at: string
}

export interface SiteMenuRow {
  id: string
  site_id: string
  categories: MenuCategory[]
  updated_at: string
}

export interface SiteEventRow {
  id: string
  site_id: string
  title: string
  description: string | null
  event_date: string | null
  image_url: string | null
  active: boolean
  created_at: string
}

export interface SiteReservationRow {
  id: string
  site_id: string
  guest_name: string
  guest_email: string | null
  guest_phone: string
  date: string
  time: string
  guests_count: number
  notes: string | null
  status: ReservationStatus
  notified_at: string | null
  reminded_at: string | null
  created_at: string
}

export interface SiteCustomerRow {
  id: string
  site_id: string
  name: string
  email: string | null
  phone: string | null
  visits_count: number
  first_visit: string | null
  last_visit: string | null
  total_spent: number | null
  notes: string | null
  preferences: CustomerPreferences
  created_at: string
  updated_at: string
}

// --- Composite type used by template components ---

export interface RestaurantSiteData {
  site: SiteRow
  content: SiteContentRow
  menu: SiteMenuRow
  events: SiteEventRow[]   // empty array for Basic tier
  style: SiteStyle
  tier: SiteTier
}
