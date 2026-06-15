'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { postSheetEvent } from '@/lib/integrations/googleSheets'
import { trackEvent } from '@/lib/tracking'

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const nextRaw = String(formData.get('next') || '')
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/admin'

  if (!email || !password) {
    redirect('/login?error=' + encodeURIComponent('Compila tutti i campi.') + '&next=' + encodeURIComponent(next))
  }
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect('/login?error=' + encodeURIComponent(translateAuthError(error.message)) + '&next=' + encodeURIComponent(next))
  }
  redirect(next)
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const restaurantName = String(formData.get('restaurantName') || '').trim()

  // Onboarding fields (vedi memoria onboarding-form-decisions)
  const planInput = String(formData.get('plan') || 'basic')
  const tier = (['basic', 'pro', 'premium'].includes(planInput) ? planInput : 'basic') as 'basic' | 'pro' | 'premium'
  const city = String(formData.get('city') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const hasDomain = String(formData.get('hasDomain') || '')
  const domain = String(formData.get('domain') || '').trim()
  const wantsWhatsapp = String(formData.get('wantsWhatsapp') || '')
  const whatsappNumber = String(formData.get('whatsappNumber') || '').trim()
  const hasChef = String(formData.get('hasChef') || '')
  const chefName = String(formData.get('chefName') || '').trim()
  const chefRole = String(formData.get('chefRole') || '').trim()
  const chefQuote = String(formData.get('chefQuote') || '').trim()

  if (!email || !password || !restaurantName) {
    redirect('/register?error=' + encodeURIComponent('Compila tutti i campi.'))
  }
  if (password.length < 8) {
    redirect('/register?error=' + encodeURIComponent('La password deve avere almeno 8 caratteri.'))
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { restaurant_name: restaurantName },
    },
  })
  if (error) {
    redirect('/register?error=' + encodeURIComponent(translateAuthError(error.message)))
  }

  // Sync signup to Google Sheets — fire-and-forget, MAI bloccare il signup
  try {
    const hdrs = headers()
    const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() || hdrs.get('x-real-ip') || ''
    const userAgent = hdrs.get('user-agent') || ''
    const referrer = hdrs.get('referer') || ''
    // Nuovo sistema (lib/tracking) — Apps Script con secret token
    trackEvent('signup', {
      email,
      restaurantName,
      plan: tier,
      ip,
      userAgent,
      referrer,
    }).catch(() => {})
    // Vecchio sistema (lib/integrations/googleSheets) — no-op se GOOGLE_SHEETS_WEBHOOK_URL non è settato
    postSheetEvent({
      kind: 'signup',
      email,
      restaurantName,
      plan: tier,
      ip,
      userAgent,
      referrer,
    }).catch(() => {})
  } catch {}

  // Auto-create restaurant + site + site_owner + site_content for this user
  if (data.user) {
    const slug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + data.user.id.slice(0, 6)
    const { data: restaurant, error: restErr } = await supabase
      .from('restaurants')
      .insert({
        name: restaurantName,
        city: city || null,
        phone: phone || null,
      })
      .select('id')
      .single()
    if (restErr) console.error('[register] restaurant insert failed:', restErr.message)
    if (restaurant) {
      // Crea il client (chain restaurant → client → site)
      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .insert({
          restaurant_id: restaurant.id,
          name: restaurantName,
          email,
          phone: phone || null,
          plan: tier,
        })
        .select('id')
        .single()
      if (clientErr) console.error('[register] client insert failed:', clientErr.message)
      if (!client) return

      const { data: site, error: siteErr } = await supabase
        .from('sites')
        .insert({
          client_id: client.id,
          slug,
          tier,
          active: true,
          status: 'building',  // legacy DB constraint: 'building' | 'live' | 'error'
          // dominio scelto dal cliente (se ce l'ha già); se no → Lumino lo registra dopo (campo 0009)
          // Nota: custom_domain e domain_managed_by_lumino vengono inseriti solo se la migrazione 0009 è applicata
          ...(tier !== 'basic' && hasDomain === 'yes' ? { custom_domain: domain || null } : {}),
          ...(tier !== 'basic' && hasDomain === 'no' ? { domain_managed_by_lumino: true } : {}),
        })
        .select('id')
        .single()
      if (siteErr) console.error('[register] site insert failed:', siteErr.message)
      if (site) {
        const { error: ownerErr } = await supabase.from('site_owners').insert({
          user_id: data.user.id,
          site_id: site.id,
          role: 'owner',
        })
        if (ownerErr) console.error('[register] site_owner insert failed:', ownerErr.message)
        // site_content: insertiamo le colonne base + (se la migrazione 0008/0009 è applicata) anche
        // chef_*, whatsapp_number. Usiamo spread condizionale così se le colonne non esistono
        // si fa un retry pulito senza di esse.
        const baseContent = {
          site_id: site.id,
          restaurant_name: restaurantName,
          phone: phone || null,
          city: city || null,
          whatsapp: tier !== 'basic' && wantsWhatsapp === 'yes' ? whatsappNumber || null : null,
        }
        const extendedContent: any = { ...baseContent }
        if (tier !== 'basic' && wantsWhatsapp === 'yes' && whatsappNumber) {
          extendedContent.whatsapp_number = whatsappNumber
        }
        if (tier !== 'basic' && hasChef === 'yes' && chefName) {
          extendedContent.chef_active = true
          extendedContent.chef_name = chefName
          extendedContent.chef_role = chefRole || null
          extendedContent.chef_quote = chefQuote || null
        }
        let { error: contentErr } = await supabase.from('site_content').insert(extendedContent)
        if (contentErr && /column .* does not exist|Could not find the/i.test(contentErr.message)) {
          // Migrazione 0008/0009 non ancora applicata: retry con i campi base
          contentErr = (await supabase.from('site_content').insert(baseContent)).error
        }
        if (contentErr) console.error('[register] site_content insert failed:', contentErr.message)
      }
    }
  }

  redirect('/register/grazie')
}

export async function logoutAction() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  if (!email) {
    redirect('/forgot-password?error=' + encodeURIComponent('Inserisci la tua email.'))
  }
  const supabase = createClient()

  // Get the site origin to send a proper redirect URL.
  // Il link email DEVE passare da /auth/callback per scambiare il code con una sessione,
  // altrimenti updateUser() su /reset-password fallisce con "Auth session missing!".
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })
  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent(translateAuthError(error.message)))
  }
  // Always show success even if email doesn't exist (don't leak)
  redirect('/forgot-password?sent=1')
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get('password') || '')
  const confirmPassword = String(formData.get('confirmPassword') || '')
  if (!password || password.length < 8) {
    redirect('/reset-password?error=' + encodeURIComponent('La password deve avere almeno 8 caratteri.'))
  }
  if (password !== confirmPassword) {
    redirect('/reset-password?error=' + encodeURIComponent('Le password non coincidono.'))
  }
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    redirect('/reset-password?error=' + encodeURIComponent(translateAuthError(error.message)))
  }
  redirect('/login?reset=1')
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email o password non corretti.'
  if (m.includes('user already registered')) return 'Esiste già un account con questa email.'
  if (m.includes('email not confirmed')) return 'Devi confermare la mail prima di accedere. Controlla la tua casella.'
  if (m.includes('rate limit')) return 'Troppi tentativi. Riprova tra qualche minuto.'
  return message
}
