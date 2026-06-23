import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from './guard'
import { LabBoard, type LabProjectCard } from './LabBoard'

export const metadata = { title: 'Lumino Lab · Super Admin' }
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  if (!Number.isFinite(then)) return '—'
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ora'
  if (min < 60) return `${min} min fa`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h fa`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}g fa`
  const mo = Math.floor(d / 30)
  return `${mo} mes${mo === 1 ? 'e' : 'i'} fa`
}

export default async function LabPage() {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('lab_projects')
    .select('id, business_name, business_type, status, current_step, updated_at')
    .order('updated_at', { ascending: false })
    .limit(500)

  const projects: LabProjectCard[] = (data || []).map(p => ({
    id: p.id,
    businessName: p.business_name,
    businessType: p.business_type,
    status: p.status,
    currentStep: p.current_step ?? 1,
    lastAccess: relativeTime(p.updated_at),
  }))

  return <LabBoard projects={projects} />
}
