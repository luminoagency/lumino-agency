import { requireClient } from '../_auth';
import AdminShell from '../AdminShell';
import { normalizeBuild } from '@/lib/lab/builder';
import ContentEditor from './ContentEditor';

export const dynamic = 'force-dynamic';

export default async function ContentPage() {
  const { user, project } = await requireClient();
  const pdata = project?.project_data || {};
  const cfg = pdata.build?.globalConfig;
  const businessName = cfg?.businessName || project?.business_name || 'Il tuo sito';
  const build = normalizeBuild(pdata.client_draft || pdata.build);

  return (
    <AdminShell active="content" businessName={businessName} email={user.email} logo={cfg?.logo?.url}>
      <ContentEditor initialBuild={build} />
    </AdminShell>
  );
}
