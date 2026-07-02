import { requireClient } from '../_auth';
import AdminShell from '../AdminShell';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user, project } = await requireClient();
  const cfg = project?.project_data?.build?.globalConfig;
  const businessName = cfg?.businessName || project?.business_name || 'Il tuo sito';
  return (
    <AdminShell active="settings" businessName={businessName} email={user.email} logo={cfg?.logo?.url}>
      <SettingsClient
        email={user.email}
        fullName={user.full_name || ''}
        role={user.role}
        notifyMessages={user.notify_new_messages !== false}
        notifyBilling={user.notify_billing !== false}
      />
    </AdminShell>
  );
}
