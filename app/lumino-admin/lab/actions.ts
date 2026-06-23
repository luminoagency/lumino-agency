'use server'

/**
 * Server actions del Lumino Lab. Accessibili SOLO al super-admin.
 * Pattern return-data (niente redirect() throw nelle action).
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { BUSINESS_TYPES } from './constants'

const SUPER_ADMINS = ['bylumino06@gmail.com']

async function assertSuperAdmin() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email || '')) {
    throw new Error('Non autorizzato')
  }
  return user
}

const VALID_TYPES = BUSINESS_TYPES.map(t => t.key) as string[]

export interface CreateLabProjectResult {
  ok: boolean
  id?: string
  error?: string
}

/** Crea un nuovo progetto Lab (status bozza, step 1) e ritorna l'id. */
export async function createLabProject(input: {
  businessName: string
  businessType: string
  inputMode: 'url' | 'description'
  inputValue: string
}): Promise<CreateLabProjectResult> {
  try {
    const user = await assertSuperAdmin()

    const business_name = String(input.businessName || '').trim()
    const business_type = VALID_TYPES.includes(input.businessType) ? input.businessType : 'altro'
    const business_input_mode = input.inputMode === 'url' ? 'url' : 'description'
    const business_input_value = String(input.inputValue || '').trim() || null

    if (!business_name) return { ok: false, error: 'Inserisci il nome del business.' }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('lab_projects')
      .insert({
        business_name,
        business_type,
        business_input_mode,
        business_input_value,
        status: 'bozza',
        current_step: 1,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }

    revalidatePath('/lumino-admin/lab')
    return { ok: true, id: data.id }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore imprevisto.' }
  }
}
