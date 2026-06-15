'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { postSheetEvent } from '@/lib/integrations/googleSheets'

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  if (!email || !password) {
    redirect('/login?error=' + encodeURIComponent('Compila tutti i campi.'))
  }
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect('/login?error=' + encodeURIComponent(translateAuthError(error.message)))
  }
  redirect('/admin')
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

  // Sync signup to Google Sheets (fire-and-forget — never block signup on this)
  try {
    const hdrs = headers()
    const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() || hdrs.get('x-real-ip') || ''
    const userAgent = hdrs.get('user-agent') || ''
    const referrer = hdrs.get('referer') || ''
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
    const { data: restaurant } = await supabase
      .from('restaurants')
      .insert({
        name: restaurantName,
        source: 'signup',
        city: city || null,
        phone: phone || null,
      })
      .select('id')
      .single()
    if (restaurant) {
      const { data: site } = await supabase
        .from('sites')
        .insert({
          restaurant_id: restaurant.id,
          slug,
          tier,
          active: true,
          status: 'draft',
          // dominio scelto dal cliente (se ce l'ha già); altrimenti Lumino lo registra dopo
          custom_domain: tier !== 'basic' && hasDomain === 'yes' ? domain || null : null,
          domain_managed_by_lumino: tier !== 'basic' && hasDomain === 'no',
        })
        .select('id')
        .single()
      if (site) {
        await supabase.from('site_owners').insert({
          user_id: data.user.id,
          site_id: site.id,
          role: 'owner',
        })
        await supabase.from('site_content').insert({
          site_id: site.id,
          restaurant_name: restaurantName,
          // WhatsApp: numero se vuole il bottone, altrimenti null = solo chiamata
          whatsapp_number: tier !== 'basic' && wantsWhatsapp === 'yes' ? whatsappNumber || null : null,
          // Chef: opzionale, solo se ha detto sì
          chef_active: tier !== 'basic' && hasChef === 'yes',
          chef_name: tier !== 'basic' && hasChef === 'yes' ? chefName || null : null,
          chef_role: tier !== 'basic' && hasChef === 'yes' ? chefRole || null : null,
          chef_quote: tier !== 'basic' && hasChef === 'yes' ? chefQuote || null : null,
        })
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
