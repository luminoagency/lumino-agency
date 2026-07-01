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
 *
 * Due modalità:
 *  - clientId presente → cliente scelto dalla lista: nome/email vengono letti
 *    dal DB (autorevoli, non dal browser) e salvati come copia denormalizzata;
 *    client_id memorizza il legame.
 *  - clientId assente  → fallback manuale: si usano clientName/clientEmail.
 */
export async function createOrder(input: {
  clientId?: string | null
  clientName?: string
  clientEmail?: string
  clientWhatsapp?: string
  totalAmount: number
}): Promise<CreateOrderResult> {
  try {
    await assertSuperAdmin()

    const admin = createAdminClient()
    const total = round2(Number(input.totalAmount))
    const clientWhatsapp = (input.clientWhatsapp || '').trim()

    if (!Number.isFinite(total) || total <= 0) {
      return { ok: false, error: 'Importo totale non valido' }
    }

    let clientId: string | null = null
    let clientName: string
    let clientEmail: string

    if (input.clientId) {
      // Cliente dalla lista: fonte di verità = tabella clients.
      const { data: client, error: cErr } = await admin
        .from('clients')
        .select('id, name, email')
        .eq('id', input.clientId)
        .maybeSingle()

      if (cErr) return { ok: false, error: 'Errore lettura cliente' }
      if (!client) return { ok: false, error: 'Cliente selezionato non trovato' }

      clientId = client.id
      clientName = (client.name || '').trim()
      clientEmail = (client.email || '').trim()

      if (!clientEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail)) {
        return {
          ok: false,
          error:
            'Il cliente selezionato non ha un’email valida. Aggiungila in anagrafica o usa l’inserimento manuale.',
        }
      }
    } else {
      // Fallback manuale.
      clientName = (input.clientName || '').trim()
      clientEmail = (input.clientEmail || '').trim()
      if (!clientName) return { ok: false, error: 'Nome cliente obbligatorio' }
      if (!clientEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail)) {
        return { ok: false, error: 'Email cliente non valida' }
      }
    }

    const { deposit, balance } = computeTranches(total)

    const { data, error } = await admin
      .from('orders')
      .insert({
        client_id: clientId,
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
