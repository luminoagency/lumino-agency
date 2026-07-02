import { requireSuperAdmin } from '../lab/guard';
import { createAdminClient } from '@/lib/supabase/admin';
import SubscriptionsDashboard, { type SubRow } from './SubscriptionsDashboard';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function SubscriptionsPage() {
  await requireSuperAdmin('/lumino-admin/subscriptions');
  const admin = createAdminClient();

  let rows: any[] = [];
  try {
    const { data } = await admin
      .from('lab_subscriptions')
      .select('*, lab_projects(business_name)')
      .order('created_at', { ascending: false });
    rows = data || [];
  } catch { /* tabelle non ancora create (migration 0020) */ }

  const items: SubRow[] = rows.map(r => ({
    id: r.id,
    projectId: r.project_id,
    businessName: r.lab_projects?.business_name || '—',
    status: r.status,
    monthly: Number(r.monthly_amount) || 0,
    nextBilling: r.next_billing_date || undefined,
  }));

  return <SubscriptionsDashboard items={items} />;
}
