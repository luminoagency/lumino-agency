import { requireClient } from '../_auth';
import AdminShell from '../AdminShell';
import { getClientMessages } from '../actions';
import MessagesClient from './MessagesClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user, project } = await requireClient();
  const cfg = project?.project_data?.build?.globalConfig;
  const businessName = cfg?.businessName || project?.business_name || 'Il tuo sito';
  const messages = await getClientMessages();
  return (
    <AdminShell active="messages" businessName={businessName} email={user.email} logo={cfg?.logo?.url}>
      <MessagesClient initial={messages} />
    </AdminShell>
  );
}
