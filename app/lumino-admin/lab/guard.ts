import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Stessa allowlist del resto di /lumino-admin.
export const SUPER_ADMINS = ['bylumino06@gmail.com']

/**
 * Gate per le pagine del Lab. Usabile nei Server Component (chiama redirect()).
 * - non loggato → /login
 * - loggato ma non super-admin → /lumino-admin (che mostra "Accesso negato")
 */
export async function requireSuperAdmin(nextPath = '/lumino-admin/lab') {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login?next=' + encodeURIComponent(nextPath))
  if (!SUPER_ADMINS.includes(user.email || '')) redirect('/lumino-admin')
  return user
}
