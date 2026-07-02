import { requireClient } from '../_auth';
import AdminShell from '../AdminShell';
import PublishClient from './PublishClient';

export const dynamic = 'force-dynamic';

export default async function PublishPage() {
  const { user, project } = await requireClient();
  const pdata = project?.project_data || {};
  const cfg = pdata.build?.globalConfig;
  const businessName = cfg?.businessName || project?.business_name || 'Il tuo sito';
  const hasDraft = !!pdata.client_draft;
  const draftPages: number = pdata.client_draft?.pages?.length || 0;

  return (
    <AdminShell active="publish" businessName={businessName} email={user.email} logo={cfg?.logo?.url}>
      <PublishClient
        hasDraft={hasDraft}
        draftUpdatedAt={pdata.client_draft_updated_at || null}
        lastPublishAt={pdata.client_last_publish_at || pdata.publish?.publishedAt || null}
        draftPages={draftPages}
      />
    </AdminShell>
  );
}
