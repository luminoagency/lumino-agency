/** Risoluzione progetto dal dominio (Layer 5) — SERVER ONLY. */

import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export function normalizeHost(host: string): string {
  return String(host || '').replace(/^www\./i, '').split(':')[0].toLowerCase().trim()
}

export async function resolveProjectFromHost(host: string): Promise<{ projectId: string; project: any } | null> {
  const h = normalizeHost(host)
  if (!h) return null
  const admin = createAdminClient()

  // 1) colonna dedicata custom_domain (se migration 0019 applicata)
  try {
    const { data } = await admin.from('lab_projects').select('*').eq('custom_domain', h).maybeSingle()
    if (data) return { projectId: data.id, project: data }
  } catch { /* colonna assente */ }

  // 2) fallback: project_data.publish.customDomain
  try {
    const { data } = await admin.from('lab_projects').select('*').not('project_data', 'is', null).limit(500)
    const match = (data || []).find((p: any) => {
      const cd = p.project_data?.publish?.customDomain
      return cd && normalizeHost(cd) === h
    })
    if (match) return { projectId: match.id, project: match }
  } catch { /* noop */ }

  return null
}
