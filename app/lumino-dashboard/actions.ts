'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { FeatureKey } from '@/lib/plans'
import { SUPER_ADMINS, DEMO_SITE_SLUG } from './constants'

async function assertSuperAdmin() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email || '')) {
    throw new Error('Non autorizzato')
  }
  return user
}

async function getDemoSiteId(): Promise<string> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('sites')
    .select('id')
    .eq('slug', DEMO_SITE_SLUG)
    .single()
  if (!data) throw new Error('Demo site non trovato. Applica la migrazione 0017 in Supabase.')
  return data.id
}

export async function getDemoSite() {
  await assertSuperAdmin()
  const admin = createAdminClient()
  const { data } = await admin
    .from('sites')
    .select(`
      *,
      content:site_content(*),
      menus:site_menus(*),
      events:site_events(*)
    `)
    .eq('slug', DEMO_SITE_SLUG)
    .maybeSingle()
  return data
}

export async function saveDemoContent(input: Record<string, unknown>) {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    const { error } = await admin
      .from('site_content')
      .upsert({ site_id: siteId, ...input }, { onConflict: 'site_id' })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-dashboard')
    revalidatePath(`/sites/${DEMO_SITE_SLUG}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

export interface MenuCategoryDTO {
  name: string
  description?: string
  items: MenuItemDTO[]
}
export interface MenuItemDTO {
  name: string
  description?: string
  price: number
  allergens?: string[]
}

export async function getDemoMenu(): Promise<{ ok: boolean; categories?: MenuCategoryDTO[]; error?: string }> {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    const { data } = await admin.from('site_menus').select('categories').eq('site_id', siteId).maybeSingle()
    return { ok: true, categories: Array.isArray(data?.categories) ? (data!.categories as any) : [] }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

export async function saveDemoMenu(categories: MenuCategoryDTO[]) {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    await admin.from('site_menus').delete().eq('site_id', siteId)
    if (categories.length) {
      const { error } = await admin.from('site_menus').insert({ site_id: siteId, categories })
      if (error) return { ok: false, error: error.message }
    }
    revalidatePath('/lumino-dashboard')
    revalidatePath('/lumino-dashboard/menu')
    revalidatePath(`/sites/${DEMO_SITE_SLUG}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

export interface EventDTO {
  title: string
  description?: string
  event_date: string
  image_url?: string
  active?: boolean
}

export async function getDemoEvents(): Promise<{ ok: boolean; events?: EventDTO[]; error?: string }> {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_events')
      .select('title, description, event_date, image_url, active')
      .eq('site_id', siteId)
      .order('event_date', { ascending: true })
    return { ok: true, events: (data as EventDTO[]) || [] }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

export async function saveDemoEvents(events: EventDTO[]) {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    await admin.from('site_events').delete().eq('site_id', siteId)
    if (events.length) {
      const rows = events
        .filter(e => e.title && e.event_date)
        .map(e => ({
          site_id: siteId,
          title: e.title,
          description: e.description || null,
          event_date: e.event_date,
          image_url: e.image_url || null,
          active: e.active !== false,
        }))
      if (rows.length) {
        const { error } = await admin.from('site_events').insert(rows)
        if (error) return { ok: false, error: error.message }
      }
    }
    revalidatePath('/lumino-dashboard')
    revalidatePath('/lumino-dashboard/eventi')
    revalidatePath(`/sites/${DEMO_SITE_SLUG}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

export interface ChefDTO {
  chef_active: boolean
  chef_name?: string
  chef_role?: string
  chef_quote?: string
  chef_photo_url?: string
}

export async function saveDemoChef(input: ChefDTO) {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    const { error } = await admin.from('site_content').upsert({
      site_id: siteId,
      chef_active: input.chef_active,
      chef_name: input.chef_name || null,
      chef_role: input.chef_role || null,
      chef_quote: input.chef_quote || null,
      chef_photo_url: input.chef_photo_url || null,
    }, { onConflict: 'site_id' })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-dashboard')
    revalidatePath('/lumino-dashboard/chef')
    revalidatePath(`/sites/${DEMO_SITE_SLUG}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

const DEMO_FEATURE_COL: Record<FeatureKey, string> = {
  reservations:   'feature_reservations_enabled',
  newsletter:     'feature_newsletter_enabled',
  events:         'feature_events_enabled',
  whatsappButton: 'feature_whatsapp_button_enabled',
  reviews:        'feature_reviews_enabled',
  chef:           'feature_chef_section_enabled',
}

export async function setDemoFeatureFlag(feature: FeatureKey, enabled: boolean | null) {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    const col = DEMO_FEATURE_COL[feature]
    const { error } = await admin.from('site_content').upsert(
      { site_id: siteId, [col]: enabled },
      { onConflict: 'site_id' }
    )
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-dashboard')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

export async function publishDemoSite() {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    const { error } = await admin.from('sites').update({ status: 'live' }).eq('id', siteId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-dashboard')
    revalidatePath(`/sites/${DEMO_SITE_SLUG}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

export async function unpublishDemoSite() {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    const { error } = await admin.from('sites').update({ status: 'building' }).eq('id', siteId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-dashboard')
    revalidatePath(`/sites/${DEMO_SITE_SLUG}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

export async function generateDemoSite() {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const { generateSiteContent } = await import('@/lib/pipeline/generate')
    const result = await generateSiteContent({ siteId })
    if (!result.ok) return { ok: false, error: result.error || 'Generazione fallita' }
    revalidatePath('/lumino-dashboard')
    revalidatePath(`/sites/${DEMO_SITE_SLUG}`)
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

export interface ReservationRow {
  id: string
  guest_name: string
  guest_email: string | null
  guest_phone: string
  date: string
  time: string
  guests_count: number
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
  owner_note: string | null
  owner_decided_at: string | null
  ack_email_sent_at: string | null
  outcome_email_sent_at: string | null
  created_at: string
}

export async function getDemoReservations(): Promise<{ ok: boolean; reservations?: ReservationRow[]; error?: string }> {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('site_reservations')
      .select('id, guest_name, guest_email, guest_phone, date, time, guests_count, notes, status, owner_note, owner_decided_at, ack_email_sent_at, outcome_email_sent_at, created_at')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) return { ok: false, error: error.message }
    return { ok: true, reservations: (data as ReservationRow[]) || [] }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

export async function confirmDemoReservation(id: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    const { error } = await admin
      .from('site_reservations')
      .update({ status: 'confirmed', owner_note: note || null, owner_decided_at: new Date().toISOString() })
      .eq('id', id)
      .eq('site_id', siteId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-dashboard/prenotazioni')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

export async function cancelDemoReservation(id: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertSuperAdmin()
    const siteId = await getDemoSiteId()
    const admin = createAdminClient()
    const { error } = await admin
      .from('site_reservations')
      .update({ status: 'cancelled', owner_note: note || null, owner_decided_at: new Date().toISOString() })
      .eq('id', id)
      .eq('site_id', siteId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-dashboard/prenotazioni')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}
