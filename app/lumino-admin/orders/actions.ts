'use server'

/**
 * Server actions per gli ordini a preventivo (pagamenti 30/70).
 * Accessibili SOLO al super-admin Lumino. Pattern return-data.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { computeTranches, round2 } from '@/lib/orders/tranche'

const SUPER_ADMINS = ['bylumino06@gmail.com']

async function assertSuperAdmin() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email || '')) {
    throw new Error('Non autorizzato')
  }
  return user
}

export interface CreateOrderResult {
  ok: boolean
  id?: string
  error?: string
}

/**
 * Crea un nuovo ordine con importo totale concordato.
 * Calcola acconto (30%) e saldo (70%) a 2 decimali e salva.
 */
export async function createOrder(input: {
  clientName: string
  clientEmail: string
  clientWhatsapp?: string
  totalAmount: number
}): Promise<CreateOrderResult> {
  try {
    await assertSuperAdmin()

    const clientName = (input.clientName || '').trim()
    const clientEmail = (input.clientEmail || '').trim()
    const clientWhatsapp = (input.clientWhatsapp || '').trim()
    const total = round2(Number(input.totalAmount))

    if (!clientName) return { ok: false, error: 'Nome cliente obbligatorio' }
    if (!clientEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail)) {
      return { ok: false, error: 'Email cliente non valida' }
    }
    if (!Number.isFinite(total) || total <= 0) {
      return { ok: false, error: 'Importo totale non valido' }
    }

    const { deposit, balance } = computeTranches(total)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('orders')
      .insert({
        client_name: clientName,
        client_email: clientEmail,
        client_whatsapp: clientWhatsapp || null,
        total_amount: total,
        deposit_amount: deposit,
        balance_amount: balance,
      })
      .select('id')
      .single()

    if (error) {
      return { ok: false, error: 'Errore salvataggio ordine: ' + error.message }
    }

    revalidatePath('/lumino-admin/orders')
    return { ok: true, id: data.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto'
    return { ok: false, error: msg }
  }
}
